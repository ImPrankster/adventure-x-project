"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import OpenAI from "openai";

interface SimilarityResult {
	ai_name: string;
	similarity: number | null;
}

interface ReasonablenessResult {
	model: string;
	score: number | null;
}

function extractScore(text: string | null): number | null {
	if (!text) {
		return null;
	}
	const match = text.match(/([01](?:\.\d+)?|0?\.\d+)/);
	if (match) {
		const matchedString = match[1] ?? "";
		const score = Number.parseFloat(matchedString);
		if (score >= 0 && score <= 1) {
			return score;
		}
	}
	return null;
}

async function callKimiAPI(
	prompt: string,
	apiKey: string,
): Promise<string | null> {
	try {
		const client = new OpenAI({
			apiKey: apiKey,
			baseURL: "https://api.moonshot.cn/v1",
		});

		const completion = await client.chat.completions.create({
			model: "kimi-k2-0711-preview",
			messages: [
				{ role: "system", content: "你是一个严格的相似度判分助手。" },
				{ role: "user", content: prompt },
			],
			temperature: 0.3,
		});

		return completion.choices?.[0]?.message?.content ?? null;
	} catch (error) {
		console.error("Kimi API error:", error);
		return null;
	}
}

async function callMiniMaxAPI(
	prompt: string,
	apiKey: string,
	groupId: string,
): Promise<string | null> {
	try {
		const url = `https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId=${groupId}`;
		const headers = {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		};

		const requestBody = {
			model: "abab6-chat",
			tokens_to_generate: 1024,
			reply_constraints: {
				sender_type: "BOT",
				sender_name: "MM智能助理",
			},
			messages: [{ sender_type: "USER", sender_name: "小明", text: prompt }],
			bot_setting: [
				{
					bot_name: "MM智能助理",
					content:
						"MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。",
				},
			],
		};

		const response = await fetch(url, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(requestBody),
		});

		if (response.ok) {
			const data = await response.json();
			return data.reply;
		}
		console.error("MiniMax API error:", response.status, response.statusText);
		return null;
	} catch (error) {
		console.error("MiniMax API error:", error);
		return null;
	}
}

export const createAnswerWithRatings = action({
	args: {
		answerContent: v.string(),
		questionId: v.id("question"),
	},
	returns: v.object({
		uniquenessRating: v.number(),
		reasonablenessRating: v.number(),
	}),
	handler: async (ctx, args) => {
		const questionId = args.questionId;
		const userText = args.answerContent;
		const sim_model = "kimi";
		const reason_model = "kimi";
		const score_type = "float";
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			throw new Error("User not authenticated");
		}
		const userId = user.subject;

		// 2. 获取所有AI答案
		const aiAnsList = await ctx.runQuery(api.question.getAIAnswer, {
			questionId: questionId,
		});

		if (!aiAnsList || aiAnsList.length === 0) {
			throw new Error("未找到AI答案");
		}

		// 3. 获取问题内容
		const question = await ctx.runQuery(api.question.getQuestionById, {
			id: questionId,
		});

		if (!question) {
			throw new Error("未找到问题");
		}

		const questionText = question.body;

		// 4. 计算每个AI答案与用户回答的相似度
		const simResults: SimilarityResult[] = [];

		for (const aiAns of aiAnsList) {
			const aiText = aiAns.content;
			const prompt = `AI的标准答案：${aiText}\n用户的回答：${userText}\n请你用0到1的分数严格判定两者内容的相似度，1为完全相同，0为完全不同，只返回分数，不要解释。`;

			let score: number | null = null;

			if (sim_model === "kimi") {
				const kimiApiKey = process.env.KIMI;
				if (!kimiApiKey) {
					throw new Error("KIMI API key not found");
				}
				const response = await callKimiAPI(prompt, kimiApiKey);
				score = extractScore(response);
			}
			simResults.push({
				ai_name: aiAns.aiName || "unknown",
				similarity: score,
			});
		}

		// 5. 判定合理性
		const reasonPrompt = `问题：${questionText}\n用户的回答：${userText}\n请你用0到1的分数严格判定用户回答的合理性，1为完全合理，0为完全不合理，只返回分数，不要解释。`;

		let reasonScoreKimi: number | null = null;
		let reasonScoreMini: number | null = null;

		// Kimi 合理性评分
		const kimiApiKey = process.env.KIMI;
		if (kimiApiKey) {
			const response = await callKimiAPI(reasonPrompt, kimiApiKey);
			reasonScoreKimi = extractScore(response);
		}

		// MiniMax 合理性评分
		const minimaxApiKey = process.env.MINIMAX;
		const minimaxGroupId = process.env.MINIMAX_GROUP;
		if (minimaxApiKey && minimaxGroupId) {
			const response = await callMiniMaxAPI(
				reasonPrompt,
				minimaxApiKey,
				minimaxGroupId,
			);
			reasonScoreMini = extractScore(response);
		}

		const reasonableness: ReasonablenessResult[] = [
			{ model: "kimi", score: reasonScoreKimi },
			{ model: "minimax", score: reasonScoreMini },
		];

		// 6. 计算平均相似度和合理性分数，并更新答案的评分
		const validSimilarities = simResults
			.map((result) => result.similarity)
			.filter((score) => score !== null) as number[];

		const validReasonableness = reasonableness
			.map((result) => result.score)
			.filter((score) => score !== null) as number[];

		let uniquenessRating = 0;
		let reasonablenessRating = 0;

		if (validSimilarities.length > 0 && validReasonableness.length > 0) {
			uniquenessRating =
				1 -
				validSimilarities.reduce((a, b) => a + b, 0) / validSimilarities.length;
			reasonablenessRating =
				validReasonableness.reduce((a, b) => a + b, 0) /
				validReasonableness.length;
		}

		if (uniquenessRating > 0.5 && reasonablenessRating > 0.3) {
			await ctx.runMutation(internal.answer.insertAnswer, {
				questionId: questionId,
				content: userText,
				userId: userId,
				uniquenessRating: uniquenessRating,
				reasonablenessRating: reasonablenessRating,
			});
			await ctx.runMutation(internal.question.unlockQuestion, {
				questionId: questionId,
				userId: userId,
			});
			await ctx.runMutation(internal.incentive.increaseUserIncentive, {
				userId: userId,
				amount: 10,
			});
		}

		return {
			uniquenessRating: uniquenessRating,
			reasonablenessRating: reasonablenessRating,
		};
	},
});

export const createQuestionWithRatings = action({
	args: {
		title: v.string(),
		body: v.string(),
		mainCategory: v.string(),
		subCategory: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
		questionId: v.optional(v.id("question")),
		reasonablenessRating: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			return {
				success: false,
				message: "User not authenticated",
				questionId: undefined,
				reasonablenessRating: undefined,
			};
		}
		const userId = user.subject;

		// Check reasonableness of the question
		const reasonPrompt = `问题标题：${args.title}\n问题内容：${args.body}\n问题分类：${args.mainCategory} - ${args.subCategory}\n请你用0到1的分数严格判定这个问题的合理性，1为完全合理，0为完全不合理，只返回分数，不要解释。`;

		let reasonScoreKimi: number | null = null;
		let reasonScoreMini: number | null = null;

		// Kimi reasonableness rating
		const kimiApiKey = process.env.KIMI;
		if (kimiApiKey) {
			const response = await callKimiAPI(reasonPrompt, kimiApiKey);
			reasonScoreKimi = extractScore(response);
		}

		// MiniMax reasonableness rating
		const minimaxApiKey = process.env.MINIMAX;
		const minimaxGroupId = process.env.MINIMAX_GROUP;
		if (minimaxApiKey && minimaxGroupId) {
			const response = await callMiniMaxAPI(
				reasonPrompt,
				minimaxApiKey,
				minimaxGroupId,
			);
			reasonScoreMini = extractScore(response);
		}

		const reasonableness: ReasonablenessResult[] = [
			{ model: "kimi", score: reasonScoreKimi },
			{ model: "minimax", score: reasonScoreMini },
		];

		// Calculate reasonableness rating
		const validReasonableness = reasonableness
			.map((result) => result.score)
			.filter((score) => score !== null) as number[];

		let reasonablenessRating = 0;

		if (validReasonableness.length > 0) {
			reasonablenessRating =
				validReasonableness.reduce((a, b) => a + b, 0) /
				validReasonableness.length;
		}

		// Check if question meets quality threshold
		if (reasonablenessRating > 0.5) {
			const requiredPoints = 10;

			await ctx.runMutation(internal.incentive.decreaseUserIncentive, {
				userId: userId,
				amount: requiredPoints,
			});

			const questionId: Id<"question"> = await ctx.runMutation(
				internal.question.insertQuestion,
				{
					title: args.title,
					body: args.body,
					mainCategory: args.mainCategory,
					subCategory: args.subCategory,
					userId: userId,
				},
			);

			return {
				success: true,
				message: `Question created successfully! ${requiredPoints} incentive points deducted.`,
				questionId: questionId,
				reasonablenessRating: reasonablenessRating,
			};
		}

		return {
			success: false,
			message: `Question rejected. Reasonableness: ${reasonablenessRating.toFixed(2)}. Need reasonableness > 0.5.`,
			questionId: undefined,
			reasonablenessRating: reasonablenessRating,
		};
	},
});

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// 1. Retrieve question content by id
export const getQuestionById = query({
	args: { id: v.id("question") },
	returns: v.union(
		v.object({
			_id: v.id("question"),
			_creationTime: v.number(),
			title: v.string(),
			body: v.string(),
			mainCategory: v.string(),
			subCategory: v.string(),
			userId: v.optional(v.string()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const question = await ctx.db.get(args.id);
		if (!question) return null;
		return {
			_id: question._id,
			_creationTime: question._creationTime,
			title: question.title,
			body: question.body,
			mainCategory: question.mainCategory,
			subCategory: question.subCategory,
			userId: question.userId,
		};
	},
});

// 2. Retrieve questions by category
export const getQuestionsByCategoryName = query({
	args: { categoryName: v.string() },
	returns: v.array(
		v.object({
			_id: v.id("question"),
			title: v.string(),
			body: v.string(),
			mainCategory: v.string(),
			subCategory: v.string(),
			userId: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const allQuestions = await ctx.db
			.query("question")
			.filter((q) => q.eq(q.field("mainCategory"), args.categoryName))
			.collect();

		return allQuestions.map((question) => ({
			_id: question._id,
			title: question.title,
			body: question.body,
			mainCategory: question.mainCategory,
			subCategory: question.subCategory,
			userId: question.userId,
		}));
	},
});

// 3. Retrieve questions by keyword matching title or body using search indexes
export const searchQuestions = query({
	args: { keyword: v.string() },
	returns: v.array(
		v.object({
			_id: v.id("question"),
			title: v.string(),
			body: v.string(),
			mainCategory: v.string(),
			subCategory: v.string(),
			userId: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const keyword = args.keyword;
		// Search in title
		const byTitle = await ctx.db
			.query("question")
			.withSearchIndex("by_title", (q) => q.search("title", keyword))
			.take(10);
		// Search in body
		const byBody = await ctx.db
			.query("question")
			.withSearchIndex("by_body", (q) => q.search("body", keyword))
			.take(10);
		// Merge and deduplicate by _id
		const map = new Map();
		for (const q of [...byTitle, ...byBody]) {
			map.set(q._id, q);
		}
		return Array.from(map.values()).map((question) => ({
			_id: question._id,
			title: question.title,
			body: question.body,
			mainCategory: question.mainCategory,
			subCategory: question.subCategory,
			userId: question.userId,
		}));
	},
});

// 4. Retrieve AI answer by question id
export const getAIAnswer = query({
	args: { questionId: v.id("question") },
	returns: v.array(
		v.object({
			_id: v.id("aiAnswer"),
			_creationTime: v.number(),
			questionId: v.id("question"),
			content: v.string(),
			aiName: v.string(),
		}),
	),
	handler: async (ctx, args) => {
		const aiAnswer = await ctx.db
			.query("aiAnswer")
			.filter((q) => q.eq(q.field("questionId"), args.questionId))
			.collect();

		if (!aiAnswer) return [];

		return aiAnswer.map((aiAnswer) => ({
			_id: aiAnswer._id,
			_creationTime: aiAnswer._creationTime,
			questionId: aiAnswer.questionId,
			content: aiAnswer.content,
			aiName: aiAnswer.aiName,
		}));
	},
});

// 5. Create a sample AI answer (for testing purposes)
export const createSampleAIAnswer = mutation({
	args: {
		questionId: v.id("question"),
		content: v.string(),
		aiName: v.string(),
	},
	returns: v.id("aiAnswer"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("aiAnswer", {
			questionId: args.questionId,
			content: args.content,
			aiName: args.aiName,
		});
	},
});

// 6. Internal mutation to unlock a question for a user
export const unlockQuestion = internalMutation({
	args: {
		userId: v.string(),
		questionId: v.id("question"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Check if the question exists
		const question = await ctx.db.get(args.questionId);
		if (!question) {
			throw new Error("Question not found");
		}

		// Check if already unlocked
		const existingUnlock = await ctx.db
			.query("questionUnlocked")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("questionId"), args.questionId))
			.first();

		if (existingUnlock) {
			// Already unlocked, no need to create duplicate
			return null;
		}

		// Create unlock record
		await ctx.db.insert("questionUnlocked", {
			userId: args.userId,
			questionId: args.questionId,
		});

		return null;
	},
});

// 7. Public mutation to unlock a question using incentive points
export const unlockQuestionWithIncentive = mutation({
	args: {
		questionId: v.id("question"),
	},
	returns: v.union(
		v.object({
			success: v.literal(true),
			message: v.string(),
		}),
		v.object({
			success: v.literal(false),
			message: v.string(),
		}),
	),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			return {
				success: false,
				message: "User not authenticated",
			};
		}
		const userId = user.subject;

		// Check if the question exists
		const question = await ctx.db.get(args.questionId);
		if (!question) {
			return {
				success: false,
				message: "Question not found",
			};
		}

		// Check if already unlocked
		const existingUnlock = await ctx.db
			.query("questionUnlocked")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("questionId"), args.questionId))
			.first();

		if (existingUnlock) {
			return {
				success: false,
				message: "Question is already unlocked",
			};
		}

		const userIncentive = await ctx.db
			.query("userIncentive")
			.filter((q) => q.eq(q.field("userId"), userId))
			.unique();

		const currentBalance = userIncentive?.amount || 0;
		const requiredPoints = 5;

		if (currentBalance < requiredPoints) {
			return {
				success: false,
				message: `Insufficient incentive points. You have ${currentBalance} points, but need ${requiredPoints} points to unlock this question.`,
			};
		}

		if (userIncentive) {
			await ctx.db.patch(userIncentive._id, {
				amount: currentBalance - requiredPoints,
			});
		} else {
			return {
				success: false,
				message: "Error processing incentive points",
			};
		}

		await ctx.runMutation(internal.question.unlockQuestion, {
			userId: userId,
			questionId: args.questionId,
		});

		return {
			success: true,
			message: `Question unlocked successfully! ${requiredPoints} incentive points deducted.`,
		};
	},
});

// 6. Retrieve all questions
export const getAllQuestions = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("question"),
			_creationTime: v.number(),
			title: v.string(),
			body: v.string(),
			mainCategory: v.string(),
			subCategory: v.string(),
			userId: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const allQuestions = await ctx.db.query("question").collect();

		return allQuestions.map((question) => ({
			_id: question._id,
			_creationTime: question._creationTime,
			title: question.title,
			body: question.body,
			mainCategory: question.mainCategory,
			subCategory: question.subCategory,
			userId: question.userId,
		}));
	},
});

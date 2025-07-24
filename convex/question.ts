import { query } from "./_generated/server";
import { v } from "convex/values";

// 1. Retrieve question content by id
export const getQuestionById = query({
	args: { id: v.id("question") },
	returns: v.union(
		v.object({
			_id: v.id("question"),
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

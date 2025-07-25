import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Get paginated user answers for a specific question
 */
export const getUserAnswersByQuestion = query({
	args: {
		questionId: v.id("question"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		// Verify the question exists
		const question = await ctx.db.get(args.questionId);
		if (!question) {
			throw new Error("Question not found");
		}

		// Query answers for the specific question with pagination
		const result = await ctx.db
			.query("answer")
			.withIndex("by_question", (q) => q.eq("questionId", args.questionId))
			.order("desc") // Most recent answers first
			.paginate(args.paginationOpts);

		return result;
	},
});

/**
 * Create a new user answer for a question
 */
export const createUserAnswer = mutation({
	args: {
		questionId: v.id("question"),
		content: v.string(),
		userId: v.string(),
		uniquenessRating: v.number(),
	},
	returns: v.id("answer"),
	handler: async (ctx, args) => {
		// Verify the question exists
		const question = await ctx.db.get(args.questionId);
		if (!question) {
			throw new Error("Question not found");
		}

		// Create the answer
		return await ctx.db.insert("answer", {
			questionId: args.questionId,
			content: args.content,
			userId: args.userId,
			uniquenessRating: args.uniquenessRating,
		});
	},
});

/**
 * Get a single answer by ID
 */
export const getAnswerById = query({
	args: { id: v.id("answer") },
	returns: v.union(
		v.object({
			_id: v.id("answer"),
			_creationTime: v.number(),
			questionId: v.id("question"),
			content: v.string(),
			userId: v.string(),
			uniquenessRating: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const answer = await ctx.db.get(args.id);
		if (!answer) return null;

		return {
			_id: answer._id,
			_creationTime: answer._creationTime,
			questionId: answer.questionId,
			content: answer.content,
			userId: answer.userId,
			uniquenessRating: answer.uniquenessRating,
		};
	},
});

/**
 * Update an existing answer
 */
export const updateAnswer = mutation({
	args: {
		id: v.id("answer"),
		content: v.optional(v.string()),
		uniquenessRating: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const answer = await ctx.db.get(args.id);
		if (!answer) {
			throw new Error("Answer not found");
		}

		const updates: {
			content?: string;
			uniquenessRating?: number;
		} = {};
		if (args.content !== undefined) {
			updates.content = args.content;
		}
		if (args.uniquenessRating !== undefined) {
			updates.uniquenessRating = args.uniquenessRating;
		}

		await ctx.db.patch(args.id, updates);
		return null;
	},
});

/**
 * Delete an answer
 */
export const deleteAnswer = mutation({
	args: { id: v.id("answer") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const answer = await ctx.db.get(args.id);
		if (!answer) {
			throw new Error("Answer not found");
		}

		await ctx.db.delete(args.id);
		return null;
	},
});

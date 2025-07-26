import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Get paginated user answers for a specific question
 */
export const getUserAnswersByQuestion = query({
	args: {
		questionId: v.id("question"),
	},
	returns: v.object({
		isUnlocked: v.boolean(),
		answers: v.array(
			v.object({
				_id: v.id("answer"),
				_creationTime: v.number(),
				questionId: v.id("question"),
				content: v.string(),
				userId: v.string(),
				uniquenessRating: v.number(),
				reasonablenessRating: v.number(),
			}),
		),
	}),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			throw new Error("User not authenticated");
		}
		const userId = user.subject;

		// Verify the question exists
		const question = await ctx.db.get(args.questionId);
		if (!question) {
			throw new Error("Question not found");
		}

		// Check if the question is unlocked for this user
		const unlockRecord = await ctx.db
			.query("questionUnlocked")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("questionId"), args.questionId))
			.first();

		const isUnlocked = !!unlockRecord;

		// Query answers for the specific question with pagination
		const answers = await ctx.db
			.query("answer")
			.withIndex("by_question", (q) => q.eq("questionId", args.questionId))
			.order("desc")
			.collect();

		return {
			isUnlocked,
			answers,
		};
	},
});

/**
 * Create a new user answer for a question
 */
export const createUserAnswer = mutation({
	args: {
		questionId: v.id("question"),
		content: v.string(),
	},
	returns: v.id("answer"),
	handler: async (ctx, args) => {
		// Verify the question exists
		const question = await ctx.db.get(args.questionId);
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			throw new Error("User not authenticated");
		}
		const userId = user.subject;

		if (!question) {
			throw new Error("Question not found");
		}

		// Generate random ratings (0-100) for uniqueness and reasonableness
		const randomUniquenessRating = Math.floor(Math.random() * 101); // 0-100
		const randomReasonablenessRating = Math.floor(Math.random() * 101); // 0-100

		// Create the answer
		const answerId = await ctx.db.insert("answer", {
			questionId: args.questionId,
			content: args.content,
			userId: userId,
			uniquenessRating: randomUniquenessRating,
			reasonablenessRating: randomReasonablenessRating,
		});

		// Increase user incentive for creating an answer
		await ctx.runMutation(internal.incentive.increaseUserIncentive, {
			userId: userId,
			amount: 10, // Give 10 points for creating an answer
		});

		// Unlock the question for the user
		await ctx.runMutation(internal.question.unlockQuestion, {
			userId: userId,
			questionId: args.questionId,
		});

		return answerId;
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
			reasonablenessRating: v.number(),
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
			reasonablenessRating: answer.reasonablenessRating,
		};
	},
});

/**
 * Check if the current user has already answered a specific question
 */
export const hasUserAnswered = query({
	args: {
		questionId: v.id("question"),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			return false; // If not authenticated, they haven't answered
		}
		const userId = user.subject;

		// Check if the user has already answered this question
		const existingAnswer = await ctx.db
			.query("answer")
			.withIndex("by_question", (q) => q.eq("questionId", args.questionId))
			.filter((q) => q.eq(q.field("userId"), userId))
			.first();

		return !!existingAnswer;
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

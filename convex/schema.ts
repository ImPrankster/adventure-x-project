import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	question: defineTable({
		title: v.string(),
		body: v.string(),
		mainCategory: v.string(),
		subCategory: v.string(),
		userId: v.optional(v.string()),
	})
		.searchIndex("by_title", {
			searchField: "title",
		})
		.searchIndex("by_body", {
			searchField: "body",
		}),
	answer: defineTable({
		questionId: v.id("question"),
		content: v.string(),
		userId: v.string(),
		uniquenessRating: v.optional(v.number()),
		reasonablenessRating: v.optional(v.number()),
	})
		.searchIndex("by_content", {
			searchField: "content",
		})
		.index("by_question", ["questionId"]),
	aiAnswer: defineTable({
		questionId: v.id("question"),
		content: v.string(),
		aiName: v.string(),
	}),
	userIncentive: defineTable({
		userId: v.string(),
		amount: v.number(),
	}),
	questionUnlocked: defineTable({
		userId: v.string(),
		questionId: v.id("question"),
	})
		.index("by_user", ["userId"])
		.index("by_question", ["questionId"]),
});

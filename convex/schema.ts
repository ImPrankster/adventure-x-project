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
		uniquenessRating: v.number(),
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
});

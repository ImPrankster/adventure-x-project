import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal function to increase user incentive by a specified amount.
 * If no entry exists for the user, creates one with the specified amount.
 */
export const increaseUserIncentive = internalMutation({
	args: {
		userId: v.string(),
		amount: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Check if an entry already exists for this user
		const existingIncentive = await ctx.db
			.query("userIncentive")
			.filter((q) => q.eq(q.field("userId"), args.userId))
			.unique();

		if (existingIncentive) {
			// Update existing entry by increasing the amount
			await ctx.db.patch(existingIncentive._id, {
				amount: existingIncentive.amount + args.amount,
			});
		} else {
			// Create new entry with the specified amount
			await ctx.db.insert("userIncentive", {
				userId: args.userId,
				amount: args.amount,
			});
		}

		return null;
	},
});

export const getUserIncentive = query({
	args: {},
	returns: v.object({
		amount: v.number(),
	}),
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			return {
				amount: 0,
			};
		}
		const userId = user.subject;

		// Check if an entry exists for this user
		const existingIncentive = await ctx.db
			.query("userIncentive")
			.filter((q) => q.eq(q.field("userId"), userId))
			.unique();

		return {
			amount: existingIncentive?.amount || 0,
		};
	},
});

"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface UserAnswerProps {
	questionId: Id<"question">;
}

export default function UserAnswer({ questionId }: UserAnswerProps) {
	const { results, status, loadMore } = usePaginatedQuery(
		api.answer.getUserAnswersByQuestion,
		{
			questionId,
		},
		{
			initialNumItems: 5,
		},
	);

	const handleLoadMore = () => {
		loadMore(5);
	};

	if (status === "LoadingFirstPage") {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold text-lg">用户回答</h3>
				<div className="text-muted-foreground">Loading answers...</div>
			</div>
		);
	}

	if (results.length === 0) {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold text-lg">用户回答</h3>
				<div className="text-muted-foreground">
					No answers yet. Be the first to answer!
				</div>
			</div>
		);
	}

	return (
		<div className="mt-4 space-y-4">
			<h3 className="font-semibold text-lg">用户回答</h3>

			<div className="space-y-4">
				{results.map(
					(answer: {
						_id: Id<"answer">;
						_creationTime: number;
						questionId: Id<"question">;
						content: string;
						userId: string;
						uniquenessRating: number;
					}) => (
						<Card key={answer._id} className="border border-green-400">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="font-medium text-sm">
										Answer by {answer.userId}
									</CardTitle>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											{new Date(answer._creationTime).toLocaleDateString()}
										</span>
										<span className="rounded bg-secondary px-2 py-1 text-xs">
											Rating: {answer.uniquenessRating}
										</span>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed">{answer.content}</p>
							</CardContent>
						</Card>
					),
				)}
			</div>

			{status === "CanLoadMore" && (
				<div className="flex justify-center pt-4">
					<Button
						onClick={handleLoadMore}
						variant="outline"
						className="w-full max-w-xs"
					>
						Load More Answers
					</Button>
				</div>
			)}

			{status === "LoadingMore" && (
				<div className="flex justify-center pt-4">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			)}

			{status === "Exhausted" && (
				<div className="pt-4 text-center text-muted-foreground text-sm">
					No more answers to load
				</div>
			)}
		</div>
	);
}

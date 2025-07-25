"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Lock } from "lucide-react";

interface UserAnswerProps {
	questionId: Id<"question">;
}

export default function UserAnswer({ questionId }: UserAnswerProps) {
	const result = useQuery(api.answer.getUserAnswersByQuestion, {
		questionId,
		paginationOpts: { numItems: 5, cursor: null },
	});

	if (result === undefined) {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold font-serif text-lg">用户回答</h3>
				<div className="text-muted-foreground">Loading answers...</div>
			</div>
		);
	}

	const { isUnlocked, page: answers } = result;

	if (!isUnlocked) {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold font-serif text-lg">用户回答</h3>
				<div className="flex items-center gap-2 rounded-lg border border-muted-foreground border-dashed p-4">
					<Lock className="h-5 w-5 text-muted-foreground" />
					<div className="text-muted-foreground">
						<Badge variant="secondary" className="mb-2">
							Question Locked
						</Badge>
						<p>
							You need to answer this question first to see other users'
							answers.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (answers.length === 0) {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold font-serif text-lg">用户回答</h3>
				<div className="text-muted-foreground">
					No answers yet. Be the first to answer!
				</div>
			</div>
		);
	}

	return (
		<div className="mt-4 space-y-4">
			<h3 className="font-semibold font-serif text-lg">用户回答</h3>

			<div className="space-y-4">
				{answers.map(
					(answer: {
						_id: Id<"answer">;
						_creationTime: number;
						questionId: Id<"question">;
						content: string;
						userId: string;
						uniquenessRating: number;
						reasonablenessRating: number;
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
											Uniqueness: {answer.uniquenessRating}
										</span>
										<span className="rounded bg-secondary px-2 py-1 text-xs">
											Reasonableness: {answer.reasonablenessRating}
										</span>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="font-serif text-sm leading-relaxed">
									{answer.content}
								</p>
							</CardContent>
						</Card>
					),
				)}
			</div>

			{!result.isDone && (
				<div className="flex justify-center pt-4">
					<Button
						onClick={() => {
							// For now, we'll just show a message since we're not implementing pagination
							alert("Load more functionality not implemented yet");
						}}
						variant="outline"
						className="w-full max-w-xs"
					>
						Load More Answers
					</Button>
				</div>
			)}
		</div>
	);
}

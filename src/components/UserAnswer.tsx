"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Lock, Unlock } from "lucide-react";

import { toast } from "sonner";

interface UserAnswerProps {
	questionId: Id<"question">;
}

export default function UserAnswer({ questionId }: UserAnswerProps) {
	const result = useQuery(api.answer.getUserAnswersByQuestion, {
		questionId,
	});
	const userIncentive = useQuery(api.incentive.getUserIncentive);
	const unlockQuestion = useMutation(api.question.unlockQuestionWithIncentive);

	if (result === undefined) {
		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold font-serif text-lg">用户回答</h3>
				<div className="text-muted-foreground">Loading answers...</div>
			</div>
		);
	}

	const { isUnlocked, answers } = result;

	if (!isUnlocked) {
		const currentBalance = userIncentive?.amount || 0;
		const requiredPoints = 5;

		const handleUnlock = async () => {
			try {
				const result = await unlockQuestion({ questionId });
				if (result.success) {
					toast.success(result.message);
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				toast.error("Failed to unlock question");
			}
		};

		return (
			<div className="mt-4 space-y-4">
				<h3 className="font-semibold font-serif text-lg">用户回答</h3>
				<div className="flex items-center gap-2 rounded-lg border border-muted-foreground border-dashed p-4">
					<Lock className="h-5 w-5 text-muted-foreground" />
					<div className="flex-1 text-muted-foreground">
						<Badge variant="secondary" className="mb-2 font-serif">
							Question Locked
						</Badge>
						<p className="mb-3">
							You need to answer this question first to see other users'
							answers, or unlock it with incentive points.
						</p>
						<div className="flex items-center gap-4">
							<div className="text-sm">
								<span className="font-medium">当前有</span> {currentBalance}{" "}
								思绪
							</div>
							<div className="text-sm">
								<span className="font-medium">解锁需要</span> {requiredPoints}{" "}
								思绪
							</div>
							<Button
								onClick={handleUnlock}
								disabled={currentBalance < requiredPoints}
								variant="outline"
								size="sm"
								className="ml-auto flex items-center gap-2"
							>
								<Unlock className="h-4 w-4" />
								Unlock Answers
							</Button>
						</div>
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
				{answers.map((answer) => (
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
									{answer.uniquenessRating && (
										<span className="rounded bg-secondary px-2 py-1 text-xs">
											Uniqueness: {answer.uniquenessRating}
										</span>
									)}
									{answer.reasonablenessRating && (
										<span className="rounded bg-secondary px-2 py-1 text-xs">
											Reasonableness: {answer.reasonablenessRating}
										</span>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="font-serif text-sm leading-relaxed">
								{answer.content}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

"use client";

import { useQuery } from "convex/react";
import { api as convexApi } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Typewriter from "typewriter-effect";
import UserAnswer from "~/components/UserAnswer";
import AnswerInput from "~/components/AnswerInput";

export default function QuestionDetailPage() {
	const params = useParams();
	const questionId = params.id as Id<"question">;

	const question = useQuery(convexApi.question.getQuestionById, {
		id: questionId,
	});

	const aiAnswer = useQuery(convexApi.question.getAIAnswer, {
		questionId: questionId,
	});

	if (question === undefined || aiAnswer === undefined) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 animate-spin rounded-full border border-foreground border-b-2" />
					<p className="mt-4">Loading question...</p>
				</div>
			</main>
		);
	}

	if (question === null) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="mb-4 font-bold text-2xl">Question Not Found</h1>
					<p className="mb-6 text-muted-foreground">
						The question you're looking for doesn't exist.
					</p>
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="container mx-auto max-w-4xl space-y-4 px-4 py-8 pt-16">
			<div className="mb-6">
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Questions
				</Link>
			</div>

			<Card className="w-full">
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<CardTitle className="mb-4 font-serif text-3xl leading-tight">
								{question.title}
							</CardTitle>
							<div className="flex items-center gap-4 text-muted-foreground text-sm">
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									<span>
										{new Date(question._creationTime).toLocaleDateString()}
									</span>
								</div>
								{question.userId && (
									<div className="flex items-center gap-1">
										<User className="h-4 w-4" />
										<span>{question.userId}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary" className="rounded-full">
								{question.mainCategory}
							</Badge>
							<Badge variant="outline" className="rounded-full">
								{question.subCategory}
							</Badge>
						</div>

						<div className="prose prose-lg max-w-none">
							<p className="font-serif text-lg leading-relaxed">
								{question.body}
							</p>
						</div>

						<div>
							<Badge variant="destructive">你不可以这样回答</Badge>
							<div className="mt-4 grid grid-cols-3 gap-2">
								{aiAnswer.length > 0 ? (
									aiAnswer.map((aiAnswer) => (
										<Card key={aiAnswer._id}>
											<CardHeader className="flex flex-row items-center justify-between">
												<Badge variant="secondary">{aiAnswer.aiName}</Badge>
												<span className="text-muted-foreground text-sm">
													{new Date(
														aiAnswer._creationTime,
													).toLocaleDateString()}
												</span>
											</CardHeader>
											<CardContent className="prose prose-sm line-clamp-5 max-w-none overflow-hidden line-through">
												<Typewriter
													onInit={(typewriter) => {
														typewriter.typeString(aiAnswer.content).start();
													}}
													options={{
														delay: 5,
													}}
												/>
											</CardContent>
										</Card>
									))
								) : (
									<div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
										<p>No AI answer available yet...</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
			<AnswerInput
				questionId={questionId}
				className="flex min-h-[260px] flex-col gap-2"
			/>
			<UserAnswer questionId={questionId} />
		</main>
	);
}

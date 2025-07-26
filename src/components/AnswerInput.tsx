"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import Spinner from "./Spinner";

interface AnswerInputProps {
	questionId: Id<"question">;
	placeholder?: string;
	className?: string;
}

interface ScoreData {
	uniquenessRating: number;
	reasonablenessRating: number;
}

const formSchema = z.object({
	answer: z
		.string({
			message: "回答不能为空",
		})
		.min(1, { message: "回答不能为空" }),
});

export default function AnswerInput({
	questionId,
	placeholder = "说说你的独特想法，不要用AI生成哦",
	className,
}: AnswerInputProps) {
	const { user } = useUser();
	const createUserAnswer = useAction(api.scoring.createAnswerWithRatings);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showScores, setShowScores] = useState(false);
	const [scoreData, setScoreData] = useState<ScoreData | null>(null);

	const form = useForm({
		resolver: zodResolver(formSchema),
	});

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		// Optionally show a message or notification that pasting is disabled
	};

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		if (!user) {
			console.error("User not authenticated");
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await createUserAnswer({
				questionId,
				answerContent: data.answer,
			});

			setScoreData(result);
			setShowScores(true);
			form.reset({ answer: "" });
			if (result.uniquenessRating > 0.5 && result.reasonablenessRating > 0.5) {
				toast.success(
					<div>
						<p className="font-serif">回答已提交</p>
						<p className="font-serif text-lg">
							<span className="font-bold">+10</span> 思绪
						</p>
					</div>,
				);
			}
		} catch (error) {
			console.error("Failed to submit answer:", error);
			toast.error("提交失败，请重试");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatScore = (score: number) => {
		return `${(score * 100).toFixed(1)}%`;
	};

	const getUniquenessEvaluation = (score: number) => {
		if (score >= 0.8) {
			return "非常独特！你的想法很有创意，展现了与众不同的思维方式。";
		}
		if (score >= 0.5) {
			return "比较独特，你的观点有一定的新颖性。";
		}
		if (score >= 0.3) {
			return "独特性一般，可以尝试从不同角度思考问题。";
		}
		return "独特性较低，建议多思考一些创新的观点。";
	};

	const getReasonablenessEvaluation = (score: number) => {
		if (score >= 0.8) {
			return "非常合理！你的回答逻辑清晰，论证充分。";
		}
		if (score >= 0.5) {
			return "比较合理，你的观点有一定的说服力。";
		}
		if (score >= 0.3) {
			return "合理性一般，可以加强论证的逻辑性。";
		}
		return "合理性较低，建议完善论证过程。";
	};

	return (
		<div className={className}>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex min-h-[260px] flex-col gap-2"
				>
					<FormField
						control={form.control}
						name="answer"
						render={({ field }) => (
							<FormItem className="flex flex-1 flex-col gap-2">
								<FormLabel className="font-serif">你的回答</FormLabel>
								<FormControl className="flex-1">
									<Textarea
										placeholder={placeholder}
										{...field}
										className="h-full w-full flex-1 resize-none rounded-lg px-6 py-4 font-serif"
										disabled={isSubmitting}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="self-end"
						disabled={isSubmitting || !user}
					>
						{isSubmitting ? "发送中..." : "发送"}
					</Button>
				</form>
			</Form>

			<Dialog open={showScores} onOpenChange={setShowScores}>
				<DialogContent
					className="max-w-md"
					aria-describedby="scores-description"
				>
					<DialogHeader>
						<DialogTitle className="font-serif">评分结果</DialogTitle>
					</DialogHeader>
					<div className="space-y-4" id="scores-description">
						{scoreData && (
							<>
								<div className="flex items-center justify-between">
									<span className="font-serif">独特性评分：</span>
									<span className="font-medium font-serif">
										{formatScore(scoreData.uniquenessRating)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-serif">合理性评分：</span>
									<span className="font-medium font-serif">
										{formatScore(scoreData.reasonablenessRating)}
									</span>
								</div>
								<div className="space-y-2">
									<div className="font-medium font-serif">独特性评价：</div>
									<div className="text-muted-foreground text-sm">
										{getUniquenessEvaluation(scoreData.uniquenessRating)}
									</div>
								</div>
								<div className="space-y-2">
									<div className="font-medium font-serif">合理性评价：</div>
									<div className="text-muted-foreground text-sm">
										{getReasonablenessEvaluation(
											scoreData.reasonablenessRating,
										)}
									</div>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{isSubmitting && <Spinner />}
		</div>
	);
}

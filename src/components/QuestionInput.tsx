"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import Spinner from "./Spinner";

interface QuestionInputProps {
	placeholder?: string;
	className?: string;
}

interface ScoreData {
	reasonablenessRating: number;
}

const formSchema = z.object({
	title: z
		.string({
			message: "问题标题不能为空",
		})
		.min(1, { message: "问题标题不能为空" })
		.max(100, { message: "问题标题不能超过100个字符" }),
	body: z
		.string({
			message: "问题内容不能为空",
		})
		.min(10, { message: "问题内容至少需要10个字符" })
		.max(1000, { message: "问题内容不能超过1000个字符" }),
	mainCategory: z
		.string({
			message: "主分类不能为空",
		})
		.min(1, { message: "主分类不能为空" }),
	subCategory: z
		.string({
			message: "子分类不能为空",
		})
		.min(1, { message: "子分类不能为空" }),
});

export default function QuestionInput({
	placeholder = "描述你的问题，让AI来评估质量",
	className,
}: QuestionInputProps) {
	const { user } = useUser();
	const createQuestion = useAction(api.scoring.createQuestionWithRatings);
	const userIncentive = useQuery(api.incentive.getUserIncentive);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showScores, setShowScores] = useState(false);
	const [scoreData, setScoreData] = useState<ScoreData | null>(null);

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			body: "",
			mainCategory: "",
			subCategory: "",
		},
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
			const result = await createQuestion({
				title: data.title,
				body: data.body,
				mainCategory: data.mainCategory,
				subCategory: data.subCategory,
			});

			if (result.success) {
				setScoreData({
					reasonablenessRating: result.reasonablenessRating || 0,
				});
				setShowScores(true);
				form.reset();
				toast.success(
					<div>
						<p className="font-serif">问题已创建</p>
						<p className="font-serif text-lg">
							<span className="font-bold">-10</span> 思绪
						</p>
					</div>,
				);
			} else {
				// Show rejection message with scores
				setScoreData({
					reasonablenessRating: result.reasonablenessRating || 0,
				});
				setShowScores(true);
				toast.error("问题质量未达标，请查看详细评分");
			}
		} catch (error) {
			console.error("Failed to create question:", error);
			toast.error("创建失败，请重试");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatScore = (score: number) => {
		return `${(score * 100).toFixed(1)}%`;
	};

	const getReasonablenessEvaluation = (score: number) => {
		if (score >= 0.8) {
			return "非常合理！你的问题逻辑清晰，表述准确。";
		}
		if (score >= 0.5) {
			return "比较合理，你的问题有一定的价值。";
		}
		if (score >= 0.3) {
			return "合理性一般，可以改进问题的表述。";
		}
		return "合理性较低，建议重新思考问题的表述。";
	};

	return (
		<>
			<Dialog>
				<DialogTrigger asChild>
					<Button
						className="fixed right-4 bottom-4 rounded-full p-4 text-lg"
						size="lg"
					>
						🤔 问个问题
					</Button>
				</DialogTrigger>
				<DialogContent className="z-50">
					<DialogHeader>
						<DialogTitle>创建问题</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex min-h-[400px] flex-col gap-4"
						>
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem className="flex flex-col gap-2">
										<FormLabel className="font-serif">问题标题</FormLabel>
										<FormControl>
											<Input
												placeholder="请输入问题标题"
												{...field}
												className="rounded-lg px-4 py-2 font-serif"
												disabled={isSubmitting}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="body"
								render={({ field }) => (
									<FormItem className="flex flex-1 flex-col gap-2">
										<FormLabel className="font-serif">问题内容</FormLabel>
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

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="mainCategory"
									render={({ field }) => (
										<FormItem className="flex flex-col gap-2">
											<FormLabel className="font-serif">主分类</FormLabel>
											<FormControl>
												<Input
													placeholder="如：哲学、科学、艺术"
													{...field}
													className="rounded-lg px-4 py-2 font-serif"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="subCategory"
									render={({ field }) => (
										<FormItem className="flex flex-col gap-2">
											<FormLabel className="font-serif">子分类</FormLabel>
											<FormControl>
												<Input
													placeholder="如：伦理学、物理学、绘画"
													{...field}
													className="rounded-lg px-4 py-2 font-serif"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<span className="text-muted-foreground text-sm">
								(需要10点思绪，当前思绪：{userIncentive?.amount})
							</span>
							<Button
								type="submit"
								className="self-end"
								disabled={
									isSubmitting ||
									!user ||
									(userIncentive && userIncentive.amount < 10)
								}
							>
								{isSubmitting ? "创建中..." : "创建问题"}
							</Button>
						</form>
					</Form>

					<Dialog open={showScores} onOpenChange={setShowScores}>
						<DialogContent
							className="max-w-md"
							aria-describedby="scores-description"
						>
							<DialogHeader>
								<DialogTitle className="font-serif">质量评估结果</DialogTitle>
							</DialogHeader>
							<div className="space-y-4" id="scores-description">
								{scoreData && (
									<>
										<div className="flex items-center justify-between">
											<span className="font-serif">合理性评分：</span>
											<span className="font-medium font-serif">
												{formatScore(scoreData.reasonablenessRating)}
											</span>
										</div>
										<div className="space-y-2">
											<div className="font-medium font-serif">合理性评价：</div>
											<div className="text-muted-foreground text-sm">
												{getReasonablenessEvaluation(
													scoreData.reasonablenessRating,
												)}
											</div>
										</div>
										{scoreData.reasonablenessRating <= 0.5 ? (
											<div className="text-muted-foreground text-sm">
												<p>💡 提示：</p>
												<ul className="mt-1 list-inside list-disc space-y-1">
													<li>确保问题表述清晰准确</li>
													<li>检查问题的逻辑性和合理性</li>
													<li>确保问题有实际意义和价值</li>
												</ul>
											</div>
										) : null}
									</>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</DialogContent>
			</Dialog>
			{isSubmitting && <Spinner />}
		</>
	);
}

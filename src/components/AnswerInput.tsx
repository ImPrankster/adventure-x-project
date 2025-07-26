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
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface AnswerInputProps {
	questionId: Id<"question">;
	placeholder?: string;
	className?: string;
}

const formSchema = z.object({
	answer: z.string().min(10),
});

export default function AnswerInput({
	questionId,
	placeholder = "Type something...",
	className,
}: AnswerInputProps) {
	const { user } = useUser();
	const createUserAnswer = useMutation(api.answer.createUserAnswer);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
			await createUserAnswer({
				questionId,
				content: data.answer,
			});

			form.reset({ answer: "" });
			toast.success(
				<div>
					<p className="font-serif">回答已提交</p>
					<p className="font-serif text-lg">
						<span className="font-bold">+10</span> 思绪
					</p>
				</div>,
			);
		} catch (error) {
			console.error("Failed to submit answer:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={className}>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-1 flex-col gap-2"
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
										onPaste={handlePaste}
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
		</div>
	);
}

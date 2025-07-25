"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import type { Id } from "convex/_generated/dataModel";

interface AnswerInputProps {
	questionId: Id<"question">;
	placeholder?: string;
	className?: string;
}

export default function AnswerInput({
	questionId,
	placeholder = "Type something...",
	className,
}: AnswerInputProps) {
	const [value, setValue] = useState("");

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		// Optionally show a message or notification that pasting is disabled
	};

	return (
		<div className={className}>
			<Textarea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onPaste={handlePaste}
				placeholder={placeholder}
				className="h-full w-full flex-1 resize-none rounded-lg px-6 py-4 font-serif"
			/>
			<Button disabled={!value.trim()} className="self-end">
				Send
			</Button>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "~/components/ui/carousel";
import { Film, BookOpen, MapPin } from "lucide-react";
import { cn } from "~/lib/utils";
import { useQuery } from "convex/react";
import { api as convexApi } from "@convex/_generated/api";
import { Badge } from "~/components/ui/badge";
import Noise from "~/components/Noise";
import Link from "next/link";
import QuestionInput from "~/components/QuestionInput";

const categoryConfig = [
	{
		title: "Travel",
		background: "bg-green-300",
		icon: MapPin,
		categoryName: "Travel",
	},
	{
		title: "Film",
		background: "bg-purple-300",
		icon: Film,
		categoryName: "Film",
	},
	{
		title: "Book",
		background: "bg-blue-300",
		icon: BookOpen,
		categoryName: "Book",
	},
] as const;

export default function QuestionCarousel() {
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	// Fetch questions for each category
	const filmQuestions = useQuery(
		convexApi.question.getQuestionsByCategoryName,
		{
			categoryName: "Film",
		},
	);
	const bookQuestions = useQuery(
		convexApi.question.getQuestionsByCategoryName,
		{
			categoryName: "Book",
		},
	);
	const travelQuestions = useQuery(
		convexApi.question.getQuestionsByCategoryName,
		{
			categoryName: "Travel",
		},
	);

	useEffect(() => {
		if (!api) {
			return;
		}

		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	// Helper function to get questions for current category
	const getQuestionsForCategory = (categoryName: string) => {
		switch (categoryName) {
			case "Film":
				return filmQuestions || [];
			case "Book":
				return bookQuestions || [];
			case "Travel":
				return travelQuestions || [];
			default:
				return [];
		}
	};

	// Loading state
	if (!filmQuestions || !bookQuestions || !travelQuestions) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 animate-spin rounded-full border border-foreground border-b-2" />
					<p className="mt-4">Loading questions...</p>
				</div>
			</main>
		);
	}

	return (
		<main
			className={cn(
				"flex min-h-screen items-center justify-center transition-colors duration-300",
				categoryConfig[current]?.background || categoryConfig[0].background,
			)}
		>
			<Noise className="bg-background opacity-70" />
			<div className="container mx-auto px-4 py-8">
				<Carousel setApi={setApi} className="mx-auto w-full max-w-6xl">
					<CarouselContent>
						{categoryConfig.map((category, index) => {
							const IconComponent = category.icon;
							const questions = getQuestionsForCategory(category.categoryName);

							return (
								<CarouselItem key={category.title}>
									<div className="mb-6 text-center">
										<div className="mb-4 flex items-center justify-center gap-3 font-serif">
											<IconComponent className="h-8 w-8" />
											<h2 className="font-bold text-3xl">{category.title}</h2>
										</div>
										<p className="font-serif text-lg">
											{questions.length} questions available
										</p>
									</div>

									<div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-4">
										{questions.map(
											(question: {
												_id: string;
												title: string;
												body: string;
												subCategory: string;
											}) => (
												<Link
													key={question._id}
													href={`/question/${question._id}`}
													className="cursor-pointer rounded bg-transparent p-2 backdrop-blur-sm transition-colors duration-300 hover:bg-background/20"
												>
													<div className="pb-3">
														<div className="flex items-center justify-between">
															<div className="font-bold font-serif text-4xl leading-tight">
																{question.title}
															</div>
															<Badge className="rounded-full px-2 py-1 font-mono text-xs">
																{question.subCategory}
															</Badge>
														</div>
													</div>
													<div className="pt-0">
														<p className="mb-4 line-clamp-3 font-serif text-foreground/80 text-sm">
															{question.body}
														</p>
													</div>
												</Link>
											),
										)}
									</div>

									{questions.length === 0 && (
										<div className="py-8 text-center">
											<p className="text-lg">
												No questions available for this category yet.
											</p>
										</div>
									)}
								</CarouselItem>
							);
						})}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>
			<QuestionInput />
		</main>
	);
}

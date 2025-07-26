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
import {
	Film,
	BookOpen,
	MapPin,
	Globe,
	Utensils,
	Briefcase,
	Brain,
	BrainCog,
	Gamepad,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useQuery } from "convex/react";
import { api as convexApi } from "@convex/_generated/api";
import { Badge } from "~/components/ui/badge";
import Noise from "~/components/Noise";
import Link from "next/link";
import QuestionInput from "~/components/QuestionInput";
import { Button } from "~/components/ui/button";

const categoryConfig = [
	{
		title: "旅行",
		background: "bg-green-300",
		icon: MapPin,
		categoryName: "Travel",
	},
	{
		title: "电影",
		background: "bg-purple-300",
		icon: Film,
		categoryName: "Movie & TV",
	},
	{
		title: "书籍",
		background: "bg-blue-300",
		icon: BookOpen,
		categoryName: "Book",
	},
	{
		title: "互联网",
		background: "bg-red-300",
		icon: Globe,
		categoryName: "Internet",
	},
	{
		title: "美食",
		background: "bg-yellow-300",
		icon: Utensils,
		categoryName: "Food",
	},
	{
		title: "游戏",
		background: "bg-orange-300",
		icon: Gamepad,
		categoryName: "Game",
	},
	{
		title: "工作",
		background: "bg-pink-300",
		icon: Briefcase,
		categoryName: "Work",
	},
	{
		title: "哲学",
		background: "bg-gray-300",
		icon: BrainCog,
		categoryName: "Philosophy",
	},
	{
		title: "头脑风暴",
		background: "bg-gray-300",
		icon: Brain,
		categoryName: "Brainstorm",
	},
] as const;

export default function QuestionCarousel() {
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	// Fetch questions for all categories dynamically
	const categoryQueries = categoryConfig.map((category) => ({
		...category,
		questions: useQuery(convexApi.question.getQuestionsByCategoryName, {
			categoryName: category.categoryName,
		}),
	}));

	useEffect(() => {
		if (!api) {
			return;
		}

		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	// Function to scroll to specific slide
	const scrollToSlide = (index: number) => {
		if (api) {
			api.scrollTo(index);
		}
	};

	// Check if all queries are loaded
	const allQueriesLoaded = categoryQueries.every(
		(query) => query.questions !== undefined,
	);

	// Loading state
	if (!allQueriesLoaded) {
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
				{/* Navigation Buttons */}
				<div className="my-2 mb-4 flex justify-center gap-2">
					{categoryQueries.map((category, index) => {
						const IconComponent = category.icon;
						const isActive = current === index + 1;

						return (
							<Button
								variant="outline"
								size="sm"
								key={category.title}
								onClick={() => scrollToSlide(index)}
								className={cn(
									"flex cursor-pointer items-center gap-2 rounded-full transition-all duration-200",
									"border backdrop-blur-sm",
									isActive
										? "border-foreground/20 bg-background/80 shadow-lg"
										: "border-transparent bg-background/40 hover:border-foreground/10 hover:bg-background/60",
								)}
							>
								<IconComponent className="h-4 w-4" />
								<span className="hidden sm:inline">{category.title}</span>
								{category.questions?.length || 0}
							</Button>
						);
					})}
				</div>

				<Carousel setApi={setApi} className="mx-auto w-full max-w-6xl">
					<CarouselContent>
						{categoryQueries.map((category) => {
							const IconComponent = category.icon;
							const questions = category.questions || [];

							return (
								<CarouselItem key={category.title}>
									<div className="mb-2 text-center">
										<div className="mb-2 flex items-center justify-center gap-3 font-serif">
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

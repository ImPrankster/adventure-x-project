"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "~/components/ui/carousel";
import { CheckCircle, Brain, Lightbulb } from "lucide-react";
import { cn } from "~/lib/utils";

const carouselData = [
	{
		title: "General Knowledge",
		background: "bg-green-400",
		icon: Brain,
		questions: [
			{
				id: 1,
				question: "What is the capital of France?",
				difficulty: "Easy",
			},
			{
				id: 2,
				question: "Which planet is known as the Red Planet?",
				difficulty: "Easy",
			},
			{
				id: 3,
				question: "Who painted the Mona Lisa?",
				difficulty: "Medium",
			},
			{
				id: 4,
				question: "What is the largest ocean on Earth?",
				difficulty: "Easy",
			},
		],
	},
	{
		title: "Science & Technology",
		background: "bg-blue-400",
		icon: Lightbulb,
		questions: [
			{
				id: 5,
				question: "What does DNA stand for?",
				difficulty: "Medium",
			},
			{
				id: 6,
				question: "Which programming language was created by Guido van Rossum?",
				difficulty: "Medium",
			},
			{
				id: 7,
				question: "What is the speed of light in vacuum?",
				difficulty: "Hard",
			},
			{
				id: 8,
				question: "What is the chemical symbol for gold?",
				difficulty: "Easy",
			},
		],
	},
	{
		title: "History & Culture",
		background: "bg-red-400",
		icon: CheckCircle,
		questions: [
			{
				id: 9,
				question: "In which year did World War II end?",
				difficulty: "Medium",
			},
			{
				id: 10,
				question: "Who wrote 'Romeo and Juliet'?",
				difficulty: "Easy",
			},
			{
				id: 11,
				question:
					"Which ancient wonder of the world was located in Alexandria?",
				difficulty: "Hard",
			},
			{
				id: 12,
				question: "What is the oldest known written language?",
				difficulty: "Hard",
			},
		],
	},
] as const;

const difficultyColors = {
	Easy: "bg-green-100 text-green-800",
	Medium: "bg-yellow-100 text-yellow-800",
	Hard: "bg-red-100 text-red-800",
};

export default function QuestionCarousel() {
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	const handleCarouselSelect = () => {
		if (!api) return;
		setCurrent(api.selectedScrollSnap());
	};

	useEffect(() => {
		if (!api) {
			return;
		}

		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	return (
		<div
			className={cn(
				"min-h-screen transition-colors duration-300",
				carouselData[current]?.background || carouselData[0].background,
			)}
		>
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-4xl text-white">Knowledge Quiz</h1>
					<p className="text-lg text-white/80">
						Test your knowledge across different categories
					</p>
				</div>

				<Carousel
					setApi={setApi}
					className="mx-auto w-full max-w-6xl"
					onSelect={handleCarouselSelect}
				>
					<CarouselContent>
						{carouselData.map((category, index) => {
							const IconComponent = category.icon;
							return (
								<CarouselItem key={category.title}>
									<div className="p-4">
										<div className="mb-6 text-center">
											<div className="mb-4 flex items-center justify-center gap-3">
												<IconComponent className="h-8 w-8 text-white" />
												<h2 className="font-bold text-3xl text-white">
													{category.title}
												</h2>
											</div>
										</div>

										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											{category.questions.map((question) => (
												<Card
													key={question.id}
													className="bg-white/95 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
												>
													<CardHeader className="pb-3">
														<div className="flex items-center justify-between">
															<CardTitle className="font-semibold text-gray-800 text-lg leading-tight">
																{question.question}
															</CardTitle>
															<span
																className={`rounded-full px-2 py-1 font-medium text-xs ${difficultyColors[question.difficulty as keyof typeof difficultyColors]}`}
															>
																{question.difficulty}
															</span>
														</div>
													</CardHeader>
													<CardContent className="pt-0">
														<Button className="w-full bg-gray-800 text-white transition-all duration-300 hover:bg-gray-700">
															Answer Question
														</Button>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								</CarouselItem>
							);
						})}
					</CarouselContent>
					<CarouselPrevious className="border-white/30 bg-white/20 text-white hover:bg-white/30" />
					<CarouselNext className="border-white/30 bg-white/20 text-white hover:bg-white/30" />
				</Carousel>
			</div>
		</div>
	);
}

import { SignIn } from "@clerk/nextjs";
import { BackgroundBeams } from "~/components/ui/background-beam";
import { Separator } from "~/components/ui/separator";

export default function Page() {
	return (
		<main className="flex h-screen w-screen flex-col items-center justify-center gap-10 bg-slate-800 text-white">
			<div className="z-20 flex flex-wrap items-center gap-5">
				<div className="flex flex-col gap-5 p-10 font-serif">
					<h1 className="font-bold font-serif text-4xl">思网</h1>
					<h2 className="font-serif text-2xl">我思故我在</h2>
					{[
						{ icon: "💡", text: "探寻不同视角" },
						{
							icon: "✍️",
							text: "提交你的回答，你的思维独一无二",
						},
						{
							icon: "🚀",
							text: "获得反馈，提升你的表达与思辨力",
						},
					].map(({ icon, text }) => (
						<div key={text} className="flex items-center gap-3">
							<span className="text-2xl">{icon}</span>
							<span>{text}</span>
						</div>
					))}
				</div>
				<Separator orientation="vertical" />
				<SignIn />
			</div>
			<BackgroundBeams className="z-0" />
		</main>
	);
}

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
	return (
		<main className="flex h-screen w-screen flex-col items-center justify-center gap-10">
			<h1 className="font-bold font-serif text-4xl">我思故我在</h1>
			<div className="-z-10 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
				<Image
					src="/rene-descartes.png"
					alt="rene-descartes"
					width={271}
					height={290}
				/>
			</div>
			<div className="opacity-50 transition-opacity duration-300 hover:opacity-100">
				<SignIn />
			</div>
		</main>
	);
}

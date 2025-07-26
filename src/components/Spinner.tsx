import Image from "next/image";

const Spinner = () => {
	return (
		<div className="fixed top-0 left-0 z-50 flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black/50">
			<Image
				src="/emoji-thinking.gif"
				alt="thinking"
				width={100}
				height={100}
			/>
			<p className="font-bold font-serif text-3xl text-white">正在思考...</p>
		</div>
	);
};

export default Spinner;

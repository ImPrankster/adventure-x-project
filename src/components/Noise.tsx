import { cn } from "~/lib/utils";
const Noise = ({ className }: { className?: string }) => {
	return (
		<div
			className={cn("noise absolute top-0 left-0 h-full w-full", className)}
		/>
	);
};

export default Noise;

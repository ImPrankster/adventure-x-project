import type { Metadata } from "next";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "~/components/ConvexProvider";
import { cn } from "~/lib/utils";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
	title: "IdeaMesh·思网",
	description: "我思故我在",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn("antialiased")}>
				<ClerkProvider>
					<ConvexClientProvider>
						{children}
						<Toaster />
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}

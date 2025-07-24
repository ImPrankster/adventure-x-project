"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export default function Header() {
	const { user } = useUser();

	if (!user) {
		return null;
	}

	return (
		<header className="fixed top-0 right-0 left-0 z-50 w-full bg-transparent px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="font-medium font-serif text-lg">
					Welcome, {user.firstName || user.username || "User"}
				</div>
				<Button asChild variant="destructive">
					<SignOutButton>Logout</SignOutButton>
				</Button>
			</div>
		</header>
	);
}

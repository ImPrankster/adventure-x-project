"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Badge } from "./ui/badge";

export default function Header() {
	const { user } = useUser();
	const userIncentive = useQuery(api.incentive.getUserIncentive);

	if (!user) {
		return null;
	}

	return (
		<header className="fixed top-0 right-0 left-0 z-50 w-full bg-transparent px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="font-medium font-serif text-lg">
						Welcome, {user.firstName || user.username || "User"}
					</div>
					{userIncentive && (
						<Badge className="font-medium font-serif text-sm">
							<span className="font-bold">{userIncentive.amount}</span> 思绪
						</Badge>
					)}
				</div>
				<Button asChild variant="destructive" className="cursor-pointer">
					<SignOutButton>Logout</SignOutButton>
				</Button>
			</div>
		</header>
	);
}

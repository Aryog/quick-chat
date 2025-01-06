"use client"
import React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

const handleGoogleLogin = async () => {
	signIn("google", {
		redirect: true,
		callbackUrl: "/",
	});
};

export default function LoginModal() {
	// Add this temporarily to your page to test the connection
	useEffect(() => {
		const testBackend = async () => {
			try {
				const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
					method: 'HEAD'
				});
				console.log('Backend status:', response.status);
			} catch (error) {
				console.error('Backend connection test failed:', error);
			}
		};

		testBackend();
	}, []);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Getting start</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-2xl">Welcome to QuickChat</DialogTitle>
					<DialogDescription>
						QuickChat makes it effortless to create secure chat links and start
						conversations in seconds.
					</DialogDescription>
				</DialogHeader>
				<Button variant="outline" onClick={handleGoogleLogin}>
					<Image
						src="/images/google.png"
						className=" mr-4"
						width={25}
						height={25}
						alt="google"
					/>
					Continue with Google
				</Button>
			</DialogContent>
		</Dialog>
	);
}

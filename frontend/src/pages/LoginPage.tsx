import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DotPattern } from "@/components/ui/dot-pattern";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LoginForm } from "@/components/login/LoginForm";
import { LoginHero } from "@/components/login/LoginHero";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";

export function LoginPage() {
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (identifier: string, password: string) => {
		setError("");
		setLoading(true);

		try {
			const response = await apiService.login({
				employeeIdOrEmail: identifier,
				password: password,
			});

			if (response.success) {
				const { user } = response.data;

				// Route based on role
				if (user.role === "faculty") {
					navigate("/faculty");
				} else if (user.role === "hod") {
					navigate("/hod");
				} else if (user.role === "staff") {
					navigate("/staff");
				} else if (user.role === "dean") {
					navigate("/dean");
				} else if (user.role === "admin") {
					navigate("/dashboard");
				} else {
					navigate("/dashboard");
				}
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Login failed. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
			{/* Theme Toggle Button */}
			<div className="absolute top-6 right-6 z-50">
				<AnimatedThemeToggler className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-700/50 shadow-lg" />
			</div>

			{/* Animated Dot Pattern Background */}
			<DotPattern
				className={cn(
					"mask-[radial-gradient(600px_circle_at_center,white,transparent)] text-slate-400/50 dark:text-neutral-400/80"
				)}
				width={20}
				height={20}
				cx={1}
				cy={1}
				cr={1}
			/>

			{/* Main Content Container */}
			<div className="relative z-10 w-full max-w-6xl px-4">
				<Card className="overflow-hidden border-slate-200 bg-white backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/90">
					<CardContent className="grid p-0 md:grid-cols-2">
						{/* Login Form Section */}
						<LoginForm
							onSubmit={handleSubmit}
							loading={loading}
							error={error}
						/>

						{/* Image Section */}
						<LoginHero />
					</CardContent>
				</Card>

				{/* Footer */}
				<p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-500">
					© {new Date().getFullYear()} Tezpur University. All rights
					reserved.
					<br />
					<span className="text-slate-500 dark:text-slate-600">
						NBA Outcome Based Education System
					</span>
				</p>
			</div>
		</div>
	);
}

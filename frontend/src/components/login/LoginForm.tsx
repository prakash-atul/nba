import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
	onSubmit: (identifier: string, password: string) => Promise<void>;
	loading: boolean;
}

export function LoginForm({ onSubmit, loading }: LoginFormProps) {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit(identifier, password);
	};

	const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIdentifier(e.target.value);
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	return (
		<div className="flex flex-col justify-center p-8 md:p-12">
			<div className="mx-auto w-full max-w-md space-y-8">
				{/* University Logo for mobile */}
				<div className="flex flex-col items-center md:hidden mb-4">
					<img
						src="/tulogo.png"
						alt="Tezpur University"
						className="h-20 w-20 object-contain"
					/>
					<h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
						Tezpur University
					</h2>
				</div>

				{/* Header */}
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						NBA Accreditation Portal
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Sign in with your university credentials
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Email or Employee ID Field */}
					<div className="space-y-2">
						<Label
							htmlFor="identifier"
							className="text-slate-700 dark:text-slate-200"
						>
							Email or Employee ID
						</Label>
						<Input
							id="identifier"
							type="text"
							placeholder="faculty@tezu.ac.in or EMP12345"
							value={identifier}
							onChange={handleIdentifierChange}
							required
							autoComplete="username"
							className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
						/>
					</div>

					{/* Password Field */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label
								htmlFor="password"
								className="text-slate-700 dark:text-slate-200"
							>
								Password
							</Label>
							<a
								href="#"
								className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
							>
								Forgot password?
							</a>
						</div>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={handlePasswordChange}
							required
							autoComplete="current-password"
							className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
						/>
					</div>

					{/* Submit Button */}
					<ShimmerButton
						className="w-full"
						type="submit"
						disabled={loading}
					>
						<span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white">
							{loading ? "Signing in..." : "Sign In"}
						</span>
					</ShimmerButton>
				</form>

				{/* Help Text */}
				<div className="text-center text-sm text-slate-500 dark:text-slate-400">
					<p>
						Need help?{" "}
						<a
							href="#"
							className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
						>
							Contact IT Support
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}

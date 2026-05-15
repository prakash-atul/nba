import { debugLogger } from "@/lib/debugLogger";
import { API_BASE_URL, tokenManager } from "./base";
import type { LoginCredentials, LoginResponse, User } from "./types";

export const authApi = {
	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		debugLogger.info("Auth", "Attempting login", {
			identifier:
				credentials.employeeIdOrEmail ||
				(credentials as any).email ||
				(credentials as any).username,
		});
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(credentials),
		});

		const data = await response.json();

		if (!response.ok) {
			debugLogger.error("Auth", "Login failed", {
				message: data.message,
			});
			throw new Error(data.message || "Login failed");
		}

		if (data.success) {
			debugLogger.info("Auth", "Login successful", {
				user: data.data.user,
			});
			tokenManager.setToken(data.data.token);
			localStorage.setItem("user", JSON.stringify(data.data.user));
		}

		return data;
	},

	async logout(): Promise<void> {
		const token = tokenManager.getToken();
		debugLogger.info("Auth", "Logging out");
		if (token) {
			try {
				await fetch(`${API_BASE_URL}/logout`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
			} catch (error) {
				debugLogger.error("Auth", "Logout API error", error);
				console.error("Logout error:", error);
			}
		}
		tokenManager.clearToken();
	},

	async getProfile(): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/profile`, {
			headers: tokenManager.getAuthHeaders(),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch profile");
		}

		return data.data;
	},

	getStoredUser(): User | null {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			return JSON.parse(userStr);
		}
		return null;
	},

	getToken(): string | null {
		return tokenManager.getToken();
	},

	setToken(token: string): void {
		tokenManager.setToken(token);
	},

	clearToken(): void {
		tokenManager.clearToken();
	},
};

export const API_BASE_URL = "http://localhost/nba/api";

class TokenManager {
	private token: string | null = null;

	constructor() {
		this.token = localStorage.getItem("auth_token");
	}

	setToken(token: string) {
		this.token = token;
		localStorage.setItem("auth_token", token);
	}

	clearToken() {
		this.token = null;
		localStorage.removeItem("auth_token");
		localStorage.removeItem("user");
	}

	getToken(): string | null {
		return this.token;
	}

	getAuthHeaders(): HeadersInit {
		return {
			Authorization: `Bearer ${this.token}`,
		};
	}

	getJsonHeaders(): HeadersInit {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.token}`,
		};
	}
}

export const tokenManager = new TokenManager();

// Helper function for making GET requests
export async function apiGet<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		headers: tokenManager.getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}

	return data.data;
}

// Helper function for making POST requests
export async function apiPost<T, R>(endpoint: string, body: T): Promise<R> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "POST",
		headers: tokenManager.getJsonHeaders(),
		body: JSON.stringify(body),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			data.errors
				? data.errors.join(", ")
				: data.message || "Request failed"
		);
	}

	return data.data;
}

// Helper function for making DELETE requests
export async function apiDelete(endpoint: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "DELETE",
		headers: tokenManager.getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}
}

// Helper function for making PUT requests
export async function apiPut<T, R>(endpoint: string, body: T): Promise<R> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "PUT",
		headers: tokenManager.getJsonHeaders(),
		body: JSON.stringify(body),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			data.errors
				? data.errors.join(", ")
				: data.message || "Request failed"
		);
	}

	return data.data;
}

// Helper for full response (when we need success, message, data)
export async function apiGetFull<T>(
	endpoint: string
): Promise<{ success: boolean; message: string; data: T }> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		headers: tokenManager.getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}

	return data;
}

export async function apiPostFull<T, R>(
	endpoint: string,
	body: T
): Promise<{ success: boolean; message: string; data: R }> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "POST",
		headers: tokenManager.getJsonHeaders(),
		body: JSON.stringify(body),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			data.errors
				? data.errors.join(", ")
				: data.message || "Request failed"
		);
	}

	return data;
}

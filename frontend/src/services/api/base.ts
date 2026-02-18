export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost/nba/api";

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
				: data.message || "Request failed",
		);
	}

	return data.data;
}

// Helper function for making DELETE requests
export async function apiDelete<T = void>(endpoint: string): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "DELETE",
		headers: tokenManager.getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}

	return data as T;
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
				: data.message || "Request failed",
		);
	}

	return data.data;
}

// Helper for full response (when we need success, message, data)
export async function apiGetFull<T>(
	endpoint: string,
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
	body: T,
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
				: data.message || "Request failed",
		);
	}

	return data;
}

// Helper for paginated GET requests — returns full {data, pagination} envelope
export async function apiGetPaginated<T>(
	endpoint: string,
	params?: Record<string, string | number | undefined>,
): Promise<import("./types").PaginatedResponse<T>> {
	let url = `${API_BASE_URL}${endpoint}`;
	if (params) {
		const filtered = Object.fromEntries(
			Object.entries(params).filter(
				([, v]) => v !== undefined && v !== null && v !== "",
			),
		) as Record<string, string>;
		const qs = new URLSearchParams(
			Object.fromEntries(
				Object.entries(filtered).map(([k, v]) => [k, String(v)]),
			),
		).toString();
		if (qs) url += "?" + qs;
	}

	const response = await fetch(url, {
		headers: tokenManager.getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}

	return data as import("./types").PaginatedResponse<T>;
}

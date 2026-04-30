import { debugLogger } from "@/lib/debugLogger";

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

/** Called on any 401 response — clears stale token and sends user to login. */
function handleUnauthorized(): never {
	tokenManager.clearToken();
	window.location.href = "/login";
	throw new Error("Session expired. Please log in again.");
}

// Helper function for making GET requests
export async function apiGet<T>(endpoint: string): Promise<T> {
	debugLogger.debug("API", `GET request: ${endpoint}`);
	const startTime = performance.now();

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			headers: tokenManager.getAuthHeaders(),
		});

		const duration = performance.now() - startTime;
		debugLogger.debug(
			"API",
			`GET ${endpoint} - Status: ${response.status} (${duration.toFixed(2)}ms)`,
		);

		if (response.status === 401) handleUnauthorized();

		const data = await response.json();

		if (!response.ok) {
			debugLogger.error("API", `GET ${endpoint} failed`, {
				status: response.status,
				message: data.message,
			});
			throw new Error(data.message || "Request failed");
		}

		debugLogger.debug("API", `GET ${endpoint} - Success`);
		return data.data;
	} catch (error) {
		debugLogger.error("API", `GET ${endpoint} - Error`, error);
		throw error;
	}
}

// Helper function for making POST requests
export async function apiPost<T, R>(endpoint: string, body: T): Promise<R> {
	debugLogger.info("API", `POST request: ${endpoint}`, { body });
	const startTime = performance.now();

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "POST",
			headers: tokenManager.getJsonHeaders(),
			body: JSON.stringify(body),
		});

		const duration = performance.now() - startTime;
		debugLogger.debug(
			"API",
			`POST ${endpoint} - Status: ${response.status} (${duration.toFixed(2)}ms)`,
		);

		if (response.status === 401) handleUnauthorized();

		const data = await response.json();

		if (!response.ok) {
			debugLogger.error("API", `POST ${endpoint} failed`, {
				status: response.status,
				errors: data.errors,
				message: data.message,
			});
			throw new Error(
				data.errors
					? data.errors.join(", ")
					: data.message || "Request failed",
			);
		}

		debugLogger.info("API", `POST ${endpoint} - Success`, {
			data: data.data,
		});
		return data.data;
	} catch (error) {
		debugLogger.error("API", `POST ${endpoint} - Error`, error);
		throw error;
	}
}

// Helper function for making DELETE requests
export async function apiDelete<T = void>(endpoint: string): Promise<T> {
	debugLogger.warn("API", `DELETE request: ${endpoint}`);
	const startTime = performance.now();

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "DELETE",
			headers: tokenManager.getAuthHeaders(),
		});

		const duration = performance.now() - startTime;
		debugLogger.debug(
			"API",
			`DELETE ${endpoint} - Status: ${response.status} (${duration.toFixed(2)}ms)`,
		);

		if (response.status === 401) handleUnauthorized();

		const data = await response.json();

		if (!response.ok) {
			debugLogger.error("API", `DELETE ${endpoint} failed`, {
				status: response.status,
				message: data.message,
			});
			throw new Error(data.message || "Request failed");
		}

		debugLogger.warn("API", `DELETE ${endpoint} - Success`);
		return data as T;
	} catch (error) {
		debugLogger.error("API", `DELETE ${endpoint} - Error`, error);
		throw error;
	}
}

// Helper function for making PUT requests
export async function apiPut<T, R>(endpoint: string, body: T): Promise<R> {
	debugLogger.info("API", `PUT request: ${endpoint}`, { body });
	const startTime = performance.now();

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "PUT",
			headers: tokenManager.getJsonHeaders(),
			body: JSON.stringify(body),
		});

		const duration = performance.now() - startTime;
		debugLogger.debug(
			"API",
			`PUT ${endpoint} - Status: ${response.status} (${duration.toFixed(2)}ms)`,
		);

		if (response.status === 401) handleUnauthorized();

		const data = await response.json();

		if (!response.ok) {
			debugLogger.error("API", `PUT ${endpoint} failed`, {
				status: response.status,
				errors: data.errors,
				message: data.message,
				error: data.error,
			});
			throw new Error(
				data.errors
					? data.errors.join(", ")
					: data.message || data.error || "Request failed",
			);
		}

		debugLogger.info("API", `PUT ${endpoint} - Success`, {
			data: data.data,
		});
		return data.data;
	} catch (error) {
		debugLogger.error("API", `PUT ${endpoint} - Error`, error);
		throw error;
	}
}

// Helper for full response (when we need success, message, data)
export async function apiGetFull<T>(
	endpoint: string,
): Promise<{ success: boolean; message: string; data: T }> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		headers: tokenManager.getAuthHeaders(),
	});

	if (response.status === 401) handleUnauthorized();

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

	if (response.status === 401) handleUnauthorized();

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

	debugLogger.debug("API", `GET paginated request: ${url}`);
	const response = await fetch(url, {
		headers: tokenManager.getAuthHeaders(),
	});

	if (response.status === 401) handleUnauthorized();

	const data = await response.json();

	if (!response.ok) {
		debugLogger.error("API", `GET paginated ${endpoint} failed`, {
			status: response.status,
			message: data.message,
		});
		throw new Error(data.message || "Request failed");
	}

	debugLogger.debug("API", `GET paginated ${endpoint} - Success`, {
		data: data.data,
	});
	return data as import("./types").PaginatedResponse<T>;
}

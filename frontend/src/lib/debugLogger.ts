/**
 * Debug Logger Utility
 * Provides structured logging for development and debugging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	module: string;
	message: string;
	data?: any;
	stackTrace?: string;
}

class DebugLogger {
	private logs: LogEntry[] = [];
	private maxLogs = 500;
	private isEnabled = true;

	constructor() {
		// Enable debug mode if running in development
		this.isEnabled = import.meta.env.DEV;
		console.log(
			"🔍 Debug Logger initialized (enabled: " + this.isEnabled + ")",
		);
	}

	private formatTimestamp(): string {
		return new Date().toISOString().split("T")[1].substring(0, 12);
	}

	private log(
		level: LogLevel,
		module: string,
		message: string,
		data?: any,
	): void {
		if (!this.isEnabled) return;

		const timestamp = this.formatTimestamp();
		const entry: LogEntry = {
			timestamp,
			level,
			module,
			message,
			data,
		};

		// Add to in-memory log
		this.logs.push(entry);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Console output with styling
		const colors = {
			debug: "color: #888; font-weight: normal;",
			info: "color: #0066cc; font-weight: bold;",
			warn: "color: #ff9900; font-weight: bold;",
			error: "color: #cc0000; font-weight: bold;",
		};

		const icon = {
			debug: "🔸",
			info: "ℹ️",
			warn: "⚠️",
			error: "❌",
		};

		const logMessage = `${icon[level]} [${timestamp}] ${module}: ${message}`;

		if (level === "error") {
			console.error(`%c${logMessage}`, colors[level], data);
		} else if (level === "warn") {
			console.warn(`%c${logMessage}`, colors[level], data);
		} else {
			console.log(`%c${logMessage}`, colors[level], data);
		}
	}

	debug(module: string, message: string, data?: any): void {
		this.log("debug", module, message, data);
	}

	info(module: string, message: string, data?: any): void {
		this.log("info", module, message, data);
	}

	warn(module: string, message: string, data?: any): void {
		this.log("warn", module, message, data);
	}

	error(module: string, message: string, data?: any): void {
		this.log("error", module, message, data);
	}

	getLogs(): LogEntry[] {
		return [...this.logs];
	}

	clearLogs(): void {
		this.logs = [];
		console.log("🧹 Debug logs cleared");
	}

	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	downloadLogs(): void {
		const content = this.exportLogs();
		const blob = new Blob([content], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `admin-debug-logs-${new Date().getTime()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
}

export const debugLogger = new DebugLogger();

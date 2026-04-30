import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="dark" storageKey="nba-ui-theme">
				<App />
				<Toaster />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);

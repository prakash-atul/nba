import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { HODDashboard } from "./pages/HODDashboard";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { MarksPage } from "./pages/MarksPage";
import { COPOPage } from "./pages/COPOPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/dashboard" element={<AdminDashboard />} />
				<Route path="/hod" element={<HODDashboard />} />
				<Route path="/assessments" element={<AssessmentsPage />} />
				<Route path="/marks" element={<MarksPage />} />
				<Route path="/copo" element={<COPOPage />} />
				<Route path="/" element={<Navigate to="/login" replace />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminHome } from "./pages/admin/AdminHome";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminSchools } from "./pages/admin/AdminSchools";
import { AdminDepartments } from "./pages/admin/AdminDepartments";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AdminCourses } from "./pages/admin/AdminCourses";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { HODHome } from "./pages/hod/HODHome";
import { HODFaculty } from "./pages/hod/HODFaculty";
import { HODStudents } from "./pages/hod/HODStudents";
import { HODCourses } from "./pages/hod/HODCourses";
import { HODLogs } from "./pages/hod/HODLogs";
import { FacultyHome } from "./pages/faculty/FacultyHome";
import { FacultyAssessments } from "./pages/faculty/FacultyAssessments";
import { FacultyStudents } from "./pages/faculty/FacultyStudents";
import { FacultyMarks } from "./pages/faculty/FacultyMarks";
import { FacultyCOPO } from "./pages/faculty/FacultyCOPO";
import { FacultyLogs } from "./pages/faculty/FacultyLogs";
import { StaffHome } from "./pages/staff/StaffHome";
import { StaffCourses } from "./pages/staff/StaffCourses";
import { StaffEnrollments } from "./pages/staff/StaffEnrollments";
import { DeanHome } from "./pages/dean/DeanHome";
import { DeanDepartments } from "./pages/dean/DeanDepartments";
import { DeanHODManagement } from "./pages/dean/DeanHODManagement";
import { DeanUsers } from "./pages/dean/DeanUsers";
import { DeanCourses } from "./pages/dean/DeanCourses";
import { DeanStudents } from "./pages/dean/DeanStudents";
import { DeanAssessments } from "./pages/dean/DeanAssessments";
import { DeanAnalytics } from "./pages/dean/DeanAnalytics";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />

				{/* Protected Routes with Dashboard Layout */}
				<Route element={<DashboardLayout />}>
					{/* Admin Routes */}
					<Route path="/dashboard" element={<AdminHome />} />
					<Route path="/dashboard/users" element={<AdminUsers />} />
					<Route
						path="/dashboard/schools"
						element={<AdminSchools />}
					/>
					<Route
						path="/dashboard/departments"
						element={<AdminDepartments />}
					/>
					<Route
						path="/dashboard/students"
						element={<AdminStudents />}
					/>
					<Route
						path="/dashboard/courses"
						element={<AdminCourses />}
					/>
					<Route path="/dashboard/logs" element={<AdminLogs />} />
					<Route path="/hod" element={<HODHome />} />
					<Route path="/hod/faculty" element={<HODFaculty />} />
					<Route path="/hod/students" element={<HODStudents />} />
					<Route path="/hod/courses" element={<HODCourses />} />
					<Route path="/hod/logs" element={<HODLogs />} />
					<Route path="/faculty" element={<FacultyHome />} />
					<Route path="/faculty/logs" element={<FacultyLogs />} />
					<Route
						path="/faculty/assessments"
						element={<FacultyAssessments />}
					/>
					<Route
						path="/faculty/students"
						element={<FacultyStudents />}
					/>
					<Route path="/faculty/marks" element={<FacultyMarks />} />
					<Route path="/faculty/copo" element={<FacultyCOPO />} />

					{/* Role Routes (Legacy Compatibility for now) */}
					<Route path="/dean" element={<DeanHome />} />
					<Route
						path="/dean/departments"
						element={<DeanDepartments />}
					/>
					<Route
						path="/dean/hod-management"
						element={<DeanHODManagement />}
					/>
					<Route path="/dean/users" element={<DeanUsers />} />
					<Route path="/dean/courses" element={<DeanCourses />} />
					<Route path="/dean/students" element={<DeanStudents />} />
					<Route
						path="/dean/assessments"
						element={<DeanAssessments />}
					/>
					<Route path="/dean/analytics" element={<DeanAnalytics />} />

					{/* Staff Routes */}
					<Route path="/staff" element={<StaffHome />} />
					<Route path="/staff/courses" element={<StaffCourses />} />
					<Route
						path="/staff/enrollments"
						element={<StaffEnrollments />}
					/>
				</Route>

				<Route path="/" element={<Navigate to="/login" replace />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;

import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar, type NavItem } from "@/components/layout";
import { apiService } from "@/services/api";
import type { User } from "@/services/api";
import {
	LayoutDashboard,
	ClipboardList,
	FileCheck,
	Network,
	GraduationCap,
	Users,
	BookOpen,
	ShieldCheck,
	Building2,
	UserCog,
	BarChart3,
	History,
} from "lucide-react";

export function DashboardLayout() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		const token = apiService.getToken();

		if (!storedUser || !token) {
			navigate("/login", { replace: true });
			return;
		}
		setUser(storedUser);
	}, [navigate]);

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	if (!user) return null;

	// Define navigation based on role
	const getNavItems = (): NavItem[] => {
		const common = [
			{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
		];

		if (user.is_dean) {
			return [
				...common,
				{ id: "departments", label: "Departments", icon: Building2 },
				{
					id: "hod-management",
					label: "HOD Management",
					icon: UserCog,
				},
				{ id: "users", label: "Users", icon: Users },
				{ id: "courses", label: "Courses", icon: BookOpen },
				{ id: "students", label: "Students", icon: GraduationCap },
				{
					id: "assessments",
					label: "Assessments",
					icon: ClipboardList,
				},
				{ id: "analytics", label: "Analytics", icon: BarChart3 },
			];
		}

		switch (user.role) {
			case "admin":
				return [
					...common,
					{ id: "users", label: "Users", icon: Users },
					{ id: "courses", label: "Courses", icon: BookOpen },
					{ id: "schools", label: "Schools", icon: ShieldCheck },
					{ id: "departments", label: "Departments", icon: BookOpen },
					{ id: "logs", label: "Audit Logs", icon: History },
				];
			case "hod":
				return [
					...common,
					{ id: "faculty", label: "Faculty", icon: Users },
					{ id: "students", label: "Students", icon: GraduationCap },
					{ id: "courses", label: "Courses", icon: BookOpen },
					{ id: "logs", label: "Audit Logs", icon: History },
				];
			case "faculty":
				return [
					...common,
					{
						id: "assessments",
						label: "Assessments",
						icon: ClipboardList,
					},
					{ id: "students", label: "Students", icon: GraduationCap },
					{ id: "marks", label: "Marks Entry", icon: FileCheck },
					{ id: "copo", label: "CO-PO Mapping", icon: Network },
				];
			case "staff":
				return [
					...common,
					{ id: "courses", label: "Courses", icon: BookOpen },
					{
						id: "enrollments",
						label: "Enrollments",
						icon: ClipboardList,
					},
				];
			default:
				return common;
		}
	};

	// Determine active ID from URL
	const pathParts = location.pathname.split("/");
	const activeId = pathParts[pathParts.length - 1] || "dashboard";

	const onNavigate = (id: string) => {
		let rolePath = `/${user.role}`;
		if (user.role === "admin") {
			rolePath = "/dashboard";
		} else if (user.is_dean) {
			rolePath = "/dean";
		}

		if (id === "dashboard") {
			navigate(rolePath);
		} else {
			navigate(`${rolePath}/${id}`);
		}
	};

	return (
		<div className="flex h-screen bg-background w-full overflow-hidden">
			<Toaster />
			<AppSidebar
				items={getNavItems()}
				user={user}
				activeId={activeId}
				onNavigate={onNavigate}
				onLogout={handleLogout}
				sidebarOpen={sidebarOpen}
			/>
			<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<Outlet context={{ user, sidebarOpen, setSidebarOpen }} />
			</main>
		</div>
	);
}

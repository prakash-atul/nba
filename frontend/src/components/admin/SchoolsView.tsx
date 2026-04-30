import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Trash2, UserPlus, Pencil, School as SchoolIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/services/api/admin";
import type { School, User } from "@/services/api/types";
import { CreateSchoolDialog } from "./CreateSchoolDialog";
import { EditSchoolDialog } from "./EditSchoolDialog";
import { AppointDeanDialog } from "./AppointDeanDialog";

export function SchoolsView() {
	const [schools, setSchools] = useState<School[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [refreshing, setRefreshing] = useState(true);

	const onDataRefresh = async () => {
		setRefreshing(true);
		try {
			const schoolsData = await adminApi.getAllSchools();
			setSchools(schoolsData);

			const usersData = await adminApi.getAllUsers({ limit: 1000 });
			setUsers(usersData.data);
		} catch (error: any) {
			console.error("Failed to refresh schools data:", error);
			toast.error("Failed to load data");
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		onDataRefresh();
	}, []);

	console.log("SchoolsView Render - Schools:", schools);
	console.log("SchoolsView Render - Users:", users);
	const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
	const [isEditSchoolOpen, setIsEditSchoolOpen] = useState(false);
	const [isAppointDeanOpen, setIsAppointDeanOpen] = useState(false);
	const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Filter schools based on search query
	const filteredSchools = useMemo(() => {
		if (!searchQuery) return schools;
		const query = searchQuery.toLowerCase();
		return schools.filter(
			(school) =>
				school.school_name.toLowerCase().includes(query) ||
				school.school_code.toLowerCase().includes(query),
		);
	}, [schools, searchQuery]);

	// Filter faculty for Dean appointment
	const facultyUsers = useMemo(
		() => users.filter((u) => u.role === "faculty"),
		[users],
	);

	const openEditSchoolDialog = (school: School) => {
		setSelectedSchool(school);
		setIsEditSchoolOpen(true);
	};

	const openAppointDeanDialog = (school: School) => {
		setSelectedSchool(school);
		setIsAppointDeanOpen(true);
	};

	const handleDeleteSchool = async (school: School) => {
		if (
			!confirm(
				`Are you sure you want to delete ${school.school_name}? This action cannot be undone.`,
			)
		) {
			return;
		}

		try {
			await adminApi.deleteSchool(school.school_id);
			toast.success("School deleted successfully");
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to delete school");
		}
	};

	const handleDemoteDean = async (user: User) => {
		if (
			!confirm(
				`Are you sure you want to demote Dean ${user.username}? They will revert to Faculty role.`,
			)
		) {
			return;
		}

		try {
			await adminApi.demoteDean(user.employee_id);
			toast.success("Dean demoted successfully");
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to demote Dean");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Schools Management</h2>
					<p className="text-gray-500 dark:text-gray-400">
						Manage schools and appoint Deans
					</p>
				</div>
				<CreateSchoolDialog
					isOpen={isCreateSchoolOpen}
					onOpenChange={setIsCreateSchoolOpen}
					onSuccess={onDataRefresh}
				/>

				<EditSchoolDialog
					isOpen={isEditSchoolOpen}
					onOpenChange={setIsEditSchoolOpen}
					onSuccess={onDataRefresh}
					school={selectedSchool}
				/>
			</div>

			{/* Appoint Dean Dialog extracted to separate component */}
			<AppointDeanDialog
				isOpen={isAppointDeanOpen}
				onOpenChange={setIsAppointDeanOpen}
				onSuccess={onDataRefresh}
				school={selectedSchool}
				facultyUsers={facultyUsers}
			/>

			<div className="flex w-full max-w-sm items-center space-x-2 pb-4">
				<Input
					placeholder="Search schools..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{refreshing ? (
					Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="overflow-hidden">
							<CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
								<div className="flex justify-between items-start">
									<Skeleton className="h-6 w-3/4" />
									<div className="flex gap-1">
										<Skeleton className="h-8 w-8 rounded-md" />
										<Skeleton className="h-8 w-8 rounded-md" />
									</div>
								</div>
								<Skeleton className="h-4 w-1/4 mt-2" />
							</CardHeader>
							<CardContent className="pt-4 space-y-4">
								<div>
									<Skeleton className="h-3 w-1/4 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-3 w-1/4 mb-2" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							</CardContent>
						</Card>
					))
				) : filteredSchools.length === 0 ? (
					<div className="col-span-full py-12 text-center border rounded-lg bg-gray-50 dark:bg-gray-900/50">
						<SchoolIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
						<p className="text-gray-500">
							{searchQuery
								? "No schools default your search"
								: "No schools found"}
						</p>
					</div>
				) : (
					filteredSchools.map((school) => (
						<Card
							key={school.school_id}
							className="overflow-hidden"
						>
							<CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
								<CardTitle className="text-lg flex items-start justify-between">
									<span>{school.school_name}</span>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												openEditSchoolDialog(school)
											}
										>
											<Pencil className="h-4 w-4 text-blue-500" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												handleDeleteSchool(school)
											}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								</CardTitle>
								<div className="text-sm text-gray-500 flex justify-between">
									<span>Code: {school.school_code}</span>
								</div>
							</CardHeader>
							<CardContent className="pt-4 space-y-4">
								<div>
									<Label className="text-xs text-muted-foreground uppercase tracking-wider">
										Current Dean
									</Label>
									<div className="mt-1 flex items-center justify-between">
										{school.dean ? (
											<div className="flex items-center gap-2">
												<div>
													<p className="font-medium flex px-2">
														{school.dean.username}
													</p>
													<Badge
														variant="outline"
														className="flex"
													>
														{school.dean.email}
													</Badge>
												</div>
											</div>
										) : (
											<span className="text-sm text-yellow-600 dark:text-yellow-500 italic">
												Vacant
											</span>
										)}

										{school.dean ? (
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() =>
													handleDemoteDean(
														school.dean!,
													)
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="h-8"
												onClick={() =>
													openAppointDeanDialog(
														school,
													)
												}
											>
												<UserPlus className="h-3.5 w-3.5 mr-1" />
												Appoint
											</Button>
										)}
									</div>
								</div>
								<div className="flex justify-between items-center text-sm pt-2 border-t">
									<span className="text-muted-foreground">
										Departments
									</span>
									<span className="font-medium bg-secondary px-2 py-0.5 rounded-full text-xs">
										{school.departments_count || 0}
									</span>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}

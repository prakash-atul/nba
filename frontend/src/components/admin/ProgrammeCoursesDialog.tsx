import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin";
import type { Programme, ProgrammeCourse, ProgrammeCourseResponse } from "@/services/api";

interface ProgrammeCourseApi {
	getProgrammeCourses: (programmeId: number) => Promise<ProgrammeCourseResponse>;
	addProgrammeCourse: (programmeId: number, courseId: number) => Promise<void>;
	removeProgrammeCourse: (programmeId: number, courseId: number) => Promise<void>;
}

interface ProgrammeCoursesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	programme: Programme | null;
	onSuccess?: () => void;
	api?: ProgrammeCourseApi;
}

export function ProgrammeCoursesDialog({
	open,
	onOpenChange,
	programme,
	onSuccess,
	api = adminApi,
}: ProgrammeCoursesDialogProps) {
	const [courses, setCourses] = useState<ProgrammeCourse[]>([]);
	const [availableCourses, setAvailableCourses] = useState<
		Array<{ course_id: number; course_code: string; course_name: string; credits: number | null }>
	>([]);
	const [loading, setLoading] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState<string>("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open && programme) {
			loadCourses();
		}
	}, [open, programme]);

	const loadCourses = async () => {
		if (!programme) return;
		setLoading(true);
		try {
			const data = await api.getProgrammeCourses(programme.programme_id);
			setCourses(data.courses);
			setAvailableCourses(data.available);
		} catch (error) {
			console.error("Failed to load programme courses:", error);
			toast.error("Failed to load courses");
		} finally {
			setLoading(false);
		}
	};

	const handleAddCourse = async () => {
		if (!programme || !selectedCourseId) return;

		const courseId = parseInt(selectedCourseId);
		setSaving(true);
		try {
			await api.addProgrammeCourse(programme.programme_id, courseId);
			toast.success("Course assigned to programme");
			setSelectedCourseId("");
			await loadCourses();
			if (onSuccess) onSuccess();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to assign course");
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveCourse = async (course: ProgrammeCourse) => {
		if (!programme) return;

		try {
			await api.removeProgrammeCourse(programme.programme_id, course.course_id);
			toast.success(`"${course.course_code}" removed from programme`);
			await loadCourses();
			if (onSuccess) onSuccess();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to remove course");
		}
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BookOpen className="w-5 h-5" />
						Programme Courses
					</DialogTitle>
					<DialogDescription>
						Manage courses assigned to{" "}
						{programme?.programme_name || "the selected programme"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Add Course Section */}
					<div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
						<h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
							<Plus className="w-4 h-4" />
							Assign Course
						</h4>
						<div className="flex gap-2 items-end">
							<div className="flex-1 space-y-2">
								<Label htmlFor="add-course">Select Course</Label>
								<Select
									value={selectedCourseId}
									onValueChange={setSelectedCourseId}
								>
									<SelectTrigger id="add-course">
										<SelectValue placeholder="Choose a course..." />
									</SelectTrigger>
									<SelectContent>
										{availableCourses.length === 0 ? (
											<SelectItem value="__none__" disabled>
												No courses available
											</SelectItem>
										) : (
											availableCourses.map((c) => (
												<SelectItem
													key={c.course_id}
													value={c.course_id.toString()}
												>
													{c.course_code} — {c.course_name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleAddCourse}
								disabled={!selectedCourseId || saving}
								className="mb-0.5"
							>
								<Plus className="w-4 h-4 mr-1" />
								Add
							</Button>
						</div>
					</div>

					{/* Assigned Courses Table */}
					<div>
						<h4 className="text-sm font-medium mb-2">
							Assigned Courses ({courses.length})
						</h4>
						{loading ? (
							<div className="text-center py-8 text-muted-foreground">
								Loading...
							</div>
						) : courses.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground border rounded-md">
								No courses assigned yet
							</div>
						) : (
							<div className="max-h-64 overflow-y-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Code</TableHead>
											<TableHead>Course Name</TableHead>
											<TableHead className="w-20 text-center">
												Credits
											</TableHead>
											<TableHead className="w-16" />
										</TableRow>
									</TableHeader>
									<TableBody>
										{courses.map((course) => (
											<TableRow key={course.id}>
												<TableCell>
													<Badge
														variant="secondary"
														className="font-mono"
													>
														{course.course_code}
													</Badge>
												</TableCell>
												<TableCell className="font-medium">
													{course.course_name}
												</TableCell>
												<TableCell className="text-center">
													{course.credits ?? "—"}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
														onClick={() =>
															handleRemoveCourse(course)
														}
													>
														<X className="w-4 h-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

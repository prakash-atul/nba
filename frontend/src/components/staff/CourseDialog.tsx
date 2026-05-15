import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface CourseFormData {
	course_code: string;
	name: string;
	credit: number;
	faculty_id: string;
	year: number;
	semester: string;
}

interface Faculty {
	employee_id: string;
	username: string;
	email: string;
	role: string;
}

interface CourseDialogProps {
	mode: "add" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: CourseFormData;
	setFormData: (data: CourseFormData) => void;
	faculty: Faculty[];
	isLoadingFaculty: boolean;
	onSubmit: () => void;
	isSubmitting: boolean;
	onCancel: () => void;
	years: number[];
	semesters: readonly string[];
}

export function CourseDialog({
	mode,
	open,
	onOpenChange,
	formData,
	setFormData,
	faculty,
	isLoadingFaculty,
	onSubmit,
	isSubmitting,
	onCancel,
	years,
	semesters,
}: CourseDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "add" ? "Add New Course" : "Edit Course"}
					</DialogTitle>
					<DialogDescription>
						{mode === "add"
							? "Create a new course for your department"
							: "Update course information"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${mode}_course_code`}>
								Course Code *
							</Label>
							<Input
								id={`${mode}_course_code`}
								placeholder="e.g., CS301"
								value={formData.course_code}
								onChange={(e) =>
									setFormData({
										...formData,
										course_code: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${mode}_credit`}>Credits *</Label>
							<Select
								value={String(formData.credit)}
								onValueChange={(value) =>
									setFormData({
										...formData,
										credit: parseInt(value),
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[1, 2, 3, 4, 5, 6].map((c) => (
										<SelectItem key={c} value={String(c)}>
											{c} {c === 1 ? "Credit" : "Credits"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${mode}_name`}>Course Name *</Label>
						<Input
							id={`${mode}_name`}
							placeholder="e.g., Database Management Systems"
							value={formData.name}
							onChange={(e) =>
								setFormData({
									...formData,
									name: e.target.value,
								})
							}
						/>
					</div>

					{mode === "add" && (
						<>
							<div className="space-y-2">
								<Label htmlFor={`${mode}_faculty`}>
									Assign Faculty *
								</Label>
								<Select
									value={formData.faculty_id}
									onValueChange={(value) =>
										setFormData({
											...formData,
											faculty_id: value,
										})
									}
									disabled={isLoadingFaculty}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												isLoadingFaculty
													? "Loading..."
													: "Select faculty member"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{faculty
											.filter(
												(f) =>
													f.role === "faculty" ||
													f.role === "hod",
											)
											.map((f) => (
												<SelectItem
													key={f.employee_id}
													value={f.employee_id}
												>
													{f.username}{" "}
													{f.role === "hod"
														? "(HOD)"
														: ""}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${mode}_year`}>
										Year *
									</Label>
									<Select
										value={String(formData.year)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												year: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{years.map((y) => (
												<SelectItem
													key={y}
													value={String(y)}
												>
													{y}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${mode}_semester`}>
										Semester *
									</Label>
									<Select
										value={formData.semester}
										onValueChange={(value) =>
											setFormData({
												...formData,
												semester: value,
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((s) => (
												<SelectItem key={s} value={s}>
													{s} Semester
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						onClick={onSubmit}
						disabled={isSubmitting}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						{isSubmitting
							? mode === "add"
								? "Creating..."
								: "Saving..."
							: mode === "add"
								? "Create Course"
								: "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

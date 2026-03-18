import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface CreateBaseCourseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: any) => Promise<void>;
	isLoading?: boolean;
}

export function CreateBaseCourseDialog({
	open,
	onOpenChange,
	onSave,
	isLoading = false,
}: CreateBaseCourseDialogProps) {
	const [formData, setFormData] = useState({
		course_code: "",
		course_name: "",
		credit: "3",
		course_type: "Theory",
		course_level: "UG",
		is_active: true,
	});

	const handleSave = async () => {
		if (!formData.course_code || !formData.course_name) {
			return;
		}

		await onSave({
			course_code: formData.course_code,
			course_name: formData.course_name,
			credit: parseInt(formData.credit),
			course_type: formData.course_type,
			course_level: formData.course_level,
			is_active: formData.is_active ? 1 : 0,
		});

		setFormData({
			course_code: "",
			course_name: "",
			credit: "3",
			course_type: "Theory",
			course_level: "UG",
			is_active: true,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add New Course Template</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Course Code *</Label>
							<Input
								value={formData.course_code}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										course_code: e.target.value,
									}))
								}
								disabled={isLoading}
								placeholder="e.g., BT101"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Credit</Label>
							<Select
								value={formData.credit}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										credit: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[1, 2, 3, 4, 5, 6].map((c) => (
										<SelectItem
											key={c}
											value={c.toString()}
										>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>Course Name *</Label>
						<Input
							value={formData.course_name}
							onChange={(e) =>
								setFormData((f) => ({
									...f,
									course_name: e.target.value,
								}))
							}
							disabled={isLoading}
							placeholder="e.g., Biochemistry"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Course Type</Label>
							<Select
								value={formData.course_type}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										course_type: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"Theory",
										"Lab",
										"Project",
										"Seminar",
									].map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Course Level</Label>
							<Select
								value={formData.course_level}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										course_level: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"UG",
										"PG",
										"UG & PG",
										"PHD",
									].map((l) => (
										<SelectItem key={l} value={l}>
											{l}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex items-center space-x-2 pt-2">
						<Checkbox
							id="is_active"
							checked={formData.is_active}
							onCheckedChange={(checked: boolean) =>
								setFormData((f) => ({
									...f,
									is_active: checked,
								}))
							}
							disabled={isLoading}
						/>
						<Label
							htmlFor="is_active"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Active (Template visible for new offerings)
						</Label>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							isLoading ||
							!formData.course_code ||
							!formData.course_name
						}
					>
						{isLoading ? "Adding..." : "Add to Catalog"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

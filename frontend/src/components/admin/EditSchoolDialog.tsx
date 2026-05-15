import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin";
import type { School } from "@/services/api/types";

interface EditSchoolDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	school: School | null;
}

export function EditSchoolDialog({
	isOpen,
	onOpenChange,
	onSuccess,
	school,
}: EditSchoolDialogProps) {
	const [submitting, setSubmitting] = useState(false);
	const [schoolForm, setSchoolForm] = useState({
		school_code: "",
		school_name: "",
		description: "",
	});

	useEffect(() => {
		if (school && isOpen) {
			setSchoolForm({
				school_code: school.school_code,
				school_name: school.school_name,
				description: school.description || "",
			});
		}
	}, [school, isOpen]);

	const handleUpdateSchool = async () => {
		if (
			!school ||
			!schoolForm.school_name.trim() ||
			!schoolForm.school_code.trim()
		) {
			toast.error("School name and code are required");
			return;
		}

		setSubmitting(true);
		try {
			await adminApi.updateSchool(school.school_id, schoolForm);
			toast.success("School updated successfully");
			onOpenChange(false);
			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Failed to update school");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit School</DialogTitle>
					<DialogDescription>
						Update school details.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-school-code">School Code</Label>
						<Input
							id="edit-school-code"
							value={schoolForm.school_code}
							onChange={(e) =>
								setSchoolForm({
									...schoolForm,
									school_code: e.target.value,
								})
							}
							placeholder="e.g. SOE"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-school-name">School Name</Label>
						<Input
							id="edit-school-name"
							value={schoolForm.school_name}
							onChange={(e) =>
								setSchoolForm({
									...schoolForm,
									school_name: e.target.value,
								})
							}
							placeholder="e.g. School of Engineering"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-description">
							Description (Optional)
						</Label>
						<Input
							id="edit-description"
							value={schoolForm.description}
							onChange={(e) =>
								setSchoolForm({
									...schoolForm,
									description: e.target.value,
								})
							}
							placeholder="e.g. Engineering and Technology disciplines"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleUpdateSchool} disabled={submitting}>
						{submitting ? "Updating..." : "Update School"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

import { useState } from "react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin";

interface CreateSchoolDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function CreateSchoolDialog({
	isOpen,
	onOpenChange,
	onSuccess,
}: CreateSchoolDialogProps) {
	const [submitting, setSubmitting] = useState(false);
	const [schoolForm, setSchoolForm] = useState({
		school_code: "",
		school_name: "",
		description: "",
	});

	const resetForm = () => {
		setSchoolForm({
			school_code: "",
			school_name: "",
			description: "",
		});
	};

	const handleOpenChange = (open: boolean) => {
		if (open) {
			resetForm();
		}
		onOpenChange(open);
	};

	const handleCreateSchool = async () => {
		if (!schoolForm.school_name.trim() || !schoolForm.school_code.trim()) {
			toast.error("School name and code are required");
			return;
		}

		setSubmitting(true);
		try {
			await adminApi.createSchool(schoolForm);
			toast.success("School created successfully");
			onOpenChange(false);
			resetForm();
			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Failed to create school");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Add School
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New School</DialogTitle>
					<DialogDescription>
						Add a new school to the university.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="school-code">School Code</Label>
						<Input
							id="school-code"
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
						<Label htmlFor="school-name">School Name</Label>
						<Input
							id="school-name"
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
						<Label htmlFor="description">
							Description (Optional)
						</Label>
						<Input
							id="description"
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
					<Button onClick={handleCreateSchool} disabled={submitting}>
						{submitting ? "Creating..." : "Create School"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

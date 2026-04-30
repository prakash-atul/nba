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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin";
import type { School, User } from "@/services/api/types";
import { generateAppointmentOrder } from "@/utils/appointmentUtils";

interface AppointDeanDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	school: School | null;
	facultyUsers: User[];
}

export function AppointDeanDialog({
	isOpen,
	onOpenChange,
	onSuccess,
	school,
	facultyUsers,
}: AppointDeanDialogProps) {
	const [submitting, setSubmitting] = useState(false);
	const [appointDeanForm, setAppointDeanForm] = useState({
		employee_id: "",
		appointment_order: "",
	});

	useEffect(() => {
		if (isOpen && school) {
			setAppointDeanForm({
				employee_id: "",
				appointment_order: generateAppointmentOrder(
					"DEAN",
					school.school_id,
				),
			});
		}
	}, [isOpen, school]);

	const handleAppointDean = async () => {
		if (
			!school ||
			!appointDeanForm.employee_id ||
			!appointDeanForm.appointment_order
		) {
			toast.error("Please fill in all fields");
			return;
		}

		setSubmitting(true);
		try {
			await adminApi.appointDean(school.school_id, {
				employee_id: parseInt(appointDeanForm.employee_id),
				appointment_order: appointDeanForm.appointment_order,
			});
			toast.success("Dean appointed successfully");
			onOpenChange(false);
			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Failed to appoint Dean");
		} finally {
			setSubmitting(false);
		}
	};

	const eligibleFaculty = facultyUsers.filter(
		(u) => school && Number(u.school_id) === school.school_id,
	);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Appoint Dean - {school?.school_name}
					</DialogTitle>
					<DialogDescription>
						Select a faculty member to appoint as Dean.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<Label>Faculty Member</Label>
						<Select
							value={appointDeanForm.employee_id}
							onValueChange={(val) =>
								setAppointDeanForm({
									...appointDeanForm,
									employee_id: val,
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select faculty" />
							</SelectTrigger>
							<SelectContent>
								{eligibleFaculty.map((u) => (
									<SelectItem
										key={u.employee_id}
										value={u.employee_id.toString()}
									>
										{u.username} ({u.employee_id})
										{u.department_code
											? ` - ${u.department_code}`
											: ""}
									</SelectItem>
								))}
								{eligibleFaculty.length === 0 && (
									<SelectItem value="none" disabled>
										No eligible faculty found in this school
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="order">Appointment Order No.</Label>
						<Input
							id="order"
							value={appointDeanForm.appointment_order}
							onChange={(e) =>
								setAppointDeanForm({
									...appointDeanForm,
									appointment_order: e.target.value,
								})
							}
							placeholder="e.g. ORD/DEAN/2026/01"
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
					<Button onClick={handleAppointDean} disabled={submitting}>
						{submitting ? "Appointing..." : "Appoint Dean"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

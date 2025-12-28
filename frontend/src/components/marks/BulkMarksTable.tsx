import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { QuestionResponse, Enrollment } from "@/services/api";

interface BulkMarksTableProps {
	questions: QuestionResponse[];
	enrollments: Enrollment[];
	marks: Record<string, Record<string, string>>;
	dirtyRows: Set<string>;
	onMarkChange: (
		studentRollno: string,
		questionId: string,
		value: string
	) => void;
}

export function BulkMarksTable({
	questions,
	enrollments,
	marks,
	dirtyRows,
	onMarkChange,
}: BulkMarksTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	if (enrollments.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				No students enrolled in this course
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				No questions found for this test
			</div>
		);
	}

	// Calculate pagination
	const totalPages = Math.ceil(enrollments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentEnrollments = enrollments.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	return (
		<div className="px-6  py-0 space-y-4 grid grid-cols-1 w-full">
			{dirtyRows.size > 0 && (
				<div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md px-4 py-2">
					<span className="font-medium">
						{dirtyRows.size} student(s) modified
					</span>
					<span className="text-xs">
						(Highlighted rows will be saved)
					</span>
				</div>
			)}
			<div className="relative border rounded-md w-full overflow-hidden">
				<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
					<table className="w-full caption-bottom text-sm min-w-max">
						<TableHeader className="bg-background">
							<TableRow className="hover:bg-transparent">
								<TableHead className="text-left w-[120px] min-w-[120px] sticky left-0 top-0 bg-background z-50 border-r shadow-sm">
									Roll No
								</TableHead>
								<TableHead className="text-left w-[200px] min-w-[200px] sticky left-[120px] top-0 bg-background z-50 border-r shadow-sm">
									Name
								</TableHead>
								{questions.map((q) => (
									<TableHead
										key={q.id}
										className="text-center min-w-[100px] sticky top-0 bg-background z-40 shadow-sm"
									>
										<div className="flex flex-col items-center gap-1 py-2">
											<span>
												Q{q.question_identifier}
											</span>
											<div className="flex gap-1">
												<Badge
													variant="outline"
													className="text-xs"
												>
													CO{q.co}
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													{q.max_marks}
												</Badge>
												{q.is_optional && (
													<Badge
														variant="outline"
														className="text-xs text-orange-600"
													>
														Opt
													</Badge>
												)}
											</div>
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{currentEnrollments.map((enrollment) => {
								const isDirty = dirtyRows.has(
									enrollment.student_rollno
								);
								return (
									<TableRow
										key={enrollment.student_rollno}
										className={
											isDirty
												? "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30"
												: "bg-background hover:bg-muted/50"
										}
									>
										<TableCell className="text-left font-medium sticky left-0 bg-inherit z-30 border-r">
											{enrollment.student_rollno}
										</TableCell>
										<TableCell className="text-left sticky left-[120px] bg-inherit z-30 border-r">
											{enrollment.student_name}
										</TableCell>
										{questions.map((q) => (
											<TableCell
												key={q.id}
												className="text-center"
											>
												<Input
													type="number"
													step="0.5"
													min="0"
													max={q.max_marks}
													value={
														marks[
															enrollment
																.student_rollno
														]?.[
															q
																.question_identifier
														] || ""
													}
													onChange={(e) =>
														onMarkChange(
															enrollment.student_rollno,
															q.question_identifier,
															e.target.value
														)
													}
													onFocus={(e) =>
														e.target.select()
													}
													placeholder="0"
													className="w-20 text-center"
												/>
											</TableCell>
										))}
									</TableRow>
								);
							})}
						</TableBody>
					</table>
				</div>
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() =>
										handlePageChange(
											Math.max(1, currentPage - 1)
										)
									}
									className={
										currentPage === 1
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									// Show first page, last page, current page, and pages around current
									return (
										page === 1 ||
										page === totalPages ||
										Math.abs(page - currentPage) <= 1
									);
								})
								.map((page, index, array) => {
									// Add ellipsis
									const prevPage = array[index - 1];
									const showEllipsis =
										prevPage && page - prevPage > 1;

									if (showEllipsis) {
										return (
											<>
												<PaginationItem
													key={`ellipsis-${page}`}
												>
													<span className="px-4">
														...
													</span>
												</PaginationItem>
												<PaginationItem key={page}>
													<PaginationLink
														onClick={() =>
															handlePageChange(
																page
															)
														}
														isActive={
															currentPage === page
														}
														className="cursor-pointer"
													>
														{page}
													</PaginationLink>
												</PaginationItem>
											</>
										);
									}
									return (
										<PaginationItem key={page}>
											<PaginationLink
												onClick={() =>
													handlePageChange(page)
												}
												isActive={currentPage === page}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									);
								})}
							<PaginationItem>
								<PaginationNext
									onClick={() =>
										handlePageChange(
											Math.min(
												totalPages,
												currentPage + 1
											)
										)
									}
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}

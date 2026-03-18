import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { Test } from "@/services/api";

interface TestsListTableProps {
	tests: Test[];
	onTestSelect: (test: Test) => void;
}

export function TestsListTable({ tests, onTestSelect }: TestsListTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Calculate pagination
	const totalPages = Math.ceil(tests.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentTests = tests.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Test Name</TableHead>
						<TableHead className="text-center">
							Full Marks
						</TableHead>
						<TableHead className="text-center">
							Pass Marks
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{currentTests.map((test) => (
						<TableRow
							key={test.id}
							className="cursor-pointer hover:bg-muted/50"
							onClick={() => onTestSelect(test)}
						>
							<TableCell className="font-medium">
								{test.name}
							</TableCell>
							<TableCell className="text-center">
								<Badge variant="outline" className="font-mono">
									{test.full_marks}
								</Badge>
							</TableCell>
							<TableCell className="text-center">
								<Badge variant="outline" className="font-mono">
									{test.pass_marks}
								</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{totalPages > 1 && (
				<div className="flex justify-center">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() =>
										handlePageChange(
											Math.max(1, currentPage - 1),
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

									return (
										<>
											{showEllipsis && (
												<PaginationItem
													key={`ellipsis-${page}`}
												>
													<span className="px-4">
														...
													</span>
												</PaginationItem>
											)}
											<PaginationItem key={page}>
												<PaginationLink
													onClick={() =>
														handlePageChange(page)
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
								})}
							<PaginationItem>
								<PaginationNext
									onClick={() =>
										handlePageChange(
											Math.min(
												totalPages,
												currentPage + 1,
											),
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

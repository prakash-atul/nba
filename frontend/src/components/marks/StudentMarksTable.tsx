import { useState, useEffect } from "react";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentMark {
	student_id: string;
	student_name: string;
	CO1: string | number;
	CO2: string | number;
	CO3: string | number;
	CO4: string | number;
	CO5: string | number;
	CO6: string | number;
}

interface StudentMarksTableProps {
	marks: StudentMark[];
	passMarks: number;
	loading: boolean;
}

const CO_KEYS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

function calculateTotal(mark: StudentMark): number {
	return CO_KEYS.reduce((sum, co) => sum + Number(mark[co]), 0);
}

export function StudentMarksTable({
	marks,
	passMarks,
	loading,
}: StudentMarksTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const itemsPerPage = 10;

	// Reset page when marks list or search changes
	useEffect(() => {
		setCurrentPage(1);
	}, [marks, searchTerm]);

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-9 w-64" />
				<div className="relative border rounded-md overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full caption-bottom text-sm min-w-max">
							<TableHeader className="bg-background">
								<TableRow className="hover:bg-transparent">
									<TableHead className="w-[120px] min-w-[120px]">
										Student ID
									</TableHead>
									<TableHead className="w-[200px] min-w-[200px]">
										Student Name
									</TableHead>
									{CO_KEYS.map((co) => (
										<TableHead
											key={co}
											className="text-center min-w-20"
										>
											{co}
										</TableHead>
									))}
									<TableHead className="text-center min-w-20">
										Total
									</TableHead>
									<TableHead className="text-center min-w-[90px]">
										Status
									</TableHead>
								</TableRow>
							</TableHeader>
							<tbody>
								{Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell>
											<Skeleton className="h-4 w-[100px]" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-[150px]" />
										</TableCell>
										{CO_KEYS.map((co) => (
											<TableCell key={co}>
												<Skeleton className="h-4 w-10 mx-auto" />
											</TableCell>
										))}
										<TableCell>
											<Skeleton className="h-4 w-10 mx-auto" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-14 mx-auto rounded-full" />
										</TableCell>
									</TableRow>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	}

	const filteredMarks = marks.filter(
		(m) =>
			m.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			m.student_name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const totalPages = Math.ceil(filteredMarks.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentMarks = filteredMarks.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

	return (
		<div className="space-y-4">
			{/* Search + count row */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search by roll no or name..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9 w-64"
					/>
				</div>
				{marks.length > 0 && (
					<p className="text-sm text-muted-foreground shrink-0">
						{searchTerm
							? `${filteredMarks.length} of ${marks.length} students`
							: `${marks.length} student${marks.length !== 1 ? "s" : ""}`}
					</p>
				)}
			</div>

			{marks.length === 0 ? (
				<div className="text-center py-12">
					<FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
					<p className="text-muted-foreground">
						No marks entered yet for this assessment
					</p>
				</div>
			) : filteredMarks.length === 0 ? (
				<div className="text-center py-12">
					<Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
					<p className="text-muted-foreground">
						No students match &ldquo;{searchTerm}&rdquo;
					</p>
				</div>
			) : (
				<>
					<div className="relative border rounded-md overflow-hidden">
						<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
							<table className="w-full caption-bottom text-sm min-w-max">
								<TableHeader className="bg-muted/50">
									<TableRow className="hover:bg-transparent border-b border-border">
										<TableHead className="text-left w-[120px] min-w-[120px] sticky left-0 top-0 bg-background z-50 border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]">
											Student ID
										</TableHead>
										<TableHead className="text-left w-[200px] min-w-[200px] sticky left-[120px] top-0 bg-background z-50 border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]">
											Student Name
										</TableHead>
										{CO_KEYS.map((co) => (
											<TableHead
												key={co}
												className="text-center min-w-20 sticky top-0 bg-background z-40 shadow-sm"
											>
												<div className="flex justify-center py-1">
													<Badge
														variant="outline"
														className="text-xs"
													>
														{co}
													</Badge>
												</div>
											</TableHead>
										))}
										<TableHead className="text-center min-w-20 sticky top-0 bg-background z-40 shadow-sm font-semibold">
											Total
										</TableHead>
										<TableHead className="text-center min-w-[90px] sticky top-0 bg-background z-40 shadow-sm">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{currentMarks.map((mark) => {
										let total = 0;
										CO_KEYS.forEach((k) => {
											total += Number(mark[k] || 0);
										});
										const passed = total >= passMarks;
										return (
											<TableRow
												key={mark.student_id}
												className="bg-background hover:bg-muted/50 group"
											>
												<TableCell className="text-left font-medium sticky left-0 bg-background group-hover:bg-muted/50 z-30 border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]">
													<span className="font-mono text-xs">
														{mark.student_id}
													</span>
												</TableCell>
												<TableCell className="text-left sticky left-[120px] bg-background group-hover:bg-muted/50 z-30 border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]">
													{mark.student_name}
												</TableCell>
												{CO_KEYS.map((co) => (
													<TableCell
														key={co}
														className="text-center tabular-nums"
													>
														{Number(mark[co]) >
														0 ? (
															<span className="font-medium">
																{mark[co]}
															</span>
														) : (
															<span className="text-muted-foreground/30">
																-
															</span>
														)}
													</TableCell>
												))}
												<TableCell className="text-center font-bold tabular-nums">
													{total}
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant={
															passed
																? "outline"
																: "destructive"
														}
														className={
															passed
																? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
																: ""
														}
													>
														{passed
															? "Pass"
															: "Fail"}
													</Badge>
												</TableCell>
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
												setCurrentPage((p) =>
													Math.max(1, p - 1),
												)
											}
											className={
												currentPage === 1
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
									{Array.from(
										{ length: totalPages },
										(_, i) => i + 1,
									)
										.filter(
											(page) =>
												page === 1 ||
												page === totalPages ||
												Math.abs(page - currentPage) <=
													1,
										)
										.map((page, index, array) => {
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
																setCurrentPage(
																	page,
																)
															}
															isActive={
																currentPage ===
																page
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
												setCurrentPage((p) =>
													Math.min(totalPages, p + 1),
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
				</>
			)}
		</div>
	);
}

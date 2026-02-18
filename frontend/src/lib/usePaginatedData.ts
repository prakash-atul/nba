import { useState, useEffect, useCallback, useRef } from "react";
import type {
	PaginatedResponse,
	PaginationMeta,
	PaginationParams,
} from "../services/api/types";

export interface UsePaginatedDataOptions<
	F extends Record<string, string | number | undefined>,
> {
	/** The async function that fetches a page */
	fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<unknown>>;
	/** How many rows per page (default 20) */
	limit?: number;
	/** Default sort field */
	defaultSort?: string;
	/** Default sort direction */
	defaultSortDir?: "ASC" | "DESC";
	/** Extra filter keys and their initial values */
	initialFilters?: Partial<F>;
	/** Debounce ms for search (default 300) */
	searchDebounceMs?: number;
}

export interface UsePaginatedDataReturn<
	T,
	F extends Record<string, string | number | undefined>,
> {
	/** Current page rows */
	data: T[];
	/** Loading state */
	loading: boolean;
	/** Error message, if any */
	error: string | null;
	/** Pagination metadata from the last response */
	pagination: PaginationMeta | null;
	/** Whether backward navigation is possible */
	canPrev: boolean;
	/** Navigate forward */
	goNext: () => void;
	/** Navigate backward */
	goPrev: () => void;
	/** Jump back to page 1 */
	reset: () => void;
	/** Refresh the current page */
	refresh: () => void;
	/** Current search string */
	search: string;
	/** Update search (triggers debounce + page reset) */
	setSearch: (value: string) => void;
	/** Current filters */
	filters: Partial<F>;
	/** Update a single filter value (resets to page 1) */
	setFilter: (key: keyof F, value: string | number | undefined) => void;
	/** Current sort */
	sort: string;
	/** Current sort direction */
	sortDir: "ASC" | "DESC";
	/** Update sort (resets to page 1) */
	setSort: (field: string, dir?: "ASC" | "DESC") => void;
	/** Current zero-based page index (for display) */
	pageIndex: number;
}

/**
 * usePaginatedData — generic cursor-keyset pagination hook.
 *
 * Maintains a cursor stack so users can go backward as well as forward.
 * Debounces search input to avoid firing on every keystroke.
 *
 * @example
 * const { data, loading, goNext, goPrev, canPrev, pagination } = usePaginatedData<AdminCourse, {}>({
 *   fetchFn: (params) => adminApi.getAllCourses(params),
 *   limit: 20,
 * });
 */
export function usePaginatedData<
	T,
	F extends Record<string, string | number | undefined> = Record<
		string,
		never
	>,
>({
	fetchFn,
	limit = 20,
	defaultSort = "",
	defaultSortDir = "ASC",
	initialFilters = {},
	searchDebounceMs = 300,
}: UsePaginatedDataOptions<F>): UsePaginatedDataReturn<T, F> {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	// Cursor stack: cursorStack[0] = undefined (first page), [1] = cursor for page 2, etc.
	const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([
		undefined,
	]);
	const [pageIndex, setPageIndex] = useState(0); // 0-based

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearchDebounced] = useState("");
	const [filters, setFilters] = useState<Partial<F>>(
		initialFilters as Partial<F>,
	);
	const [sort, setSort] = useState(defaultSort);
	const [sortDir, setSortDir] = useState<"ASC" | "DESC">(defaultSortDir);

	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fetchFnRef = useRef(fetchFn);

	useEffect(() => {
		fetchFnRef.current = fetchFn;
	}, [fetchFn]);

	// Derive current cursor from cursor stack
	const currentCursor = cursorStack[pageIndex];

	const doFetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params: PaginationParams = {
				limit,
				// Include required sort props even if they are empty
				sort: sort || undefined,
				sort_dir: sortDir || undefined,
				// Add cursor if not the first page
				...(currentCursor !== undefined
					? { cursor: currentCursor }
					: {}),
				// Add search if present
				...(search ? { search } : {}),
				// Spread any extra filters
				...(filters as Record<string, string | number | undefined>),
			};

			const response = await (fetchFnRef.current(params) as Promise<
				PaginatedResponse<T>
			>);
			setData(response.data);
			setPagination(response.pagination);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [limit, currentCursor, sort, sortDir, search, filters]); // removed fetchFn dependency

	useEffect(() => {
		// Only run when pagination state changes
		doFetch();
	}, [limit, currentCursor, sort, sortDir, search, filters]);

	const goNext = useCallback(() => {
		if (!pagination?.next_cursor) return;
		const nextCursor = pagination.next_cursor;
		setCursorStack((prev) => {
			const next = [...prev];
			// If we already have a cursor for the next page, just advance
			if (next[pageIndex + 1] === undefined) {
				next.push(nextCursor);
			}
			return next;
		});
		setPageIndex((i) => i + 1);
	}, [pagination, pageIndex]);

	const goPrev = useCallback(() => {
		if (pageIndex === 0) return;
		setPageIndex((i) => i - 1);
	}, [pageIndex]);

	const reset = useCallback(() => {
		setCursorStack([undefined]);
		setPageIndex(0);
	}, []);

	const refresh = useCallback(() => {
		doFetch();
	}, [doFetch]);

	const setSearch = useCallback(
		(value: string) => {
			setSearchInput(value);
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			debounceTimer.current = setTimeout(() => {
				setSearchDebounced(value);
				setCursorStack([undefined]);
				setPageIndex(0);
			}, searchDebounceMs);
		},
		[searchDebounceMs],
	);

	const setFilter = useCallback(
		(key: keyof F, value: string | number | undefined) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
			setCursorStack([undefined]);
			setPageIndex(0);
		},
		[],
	);

	const setSortFn = useCallback((field: string, dir?: "ASC" | "DESC") => {
		setSort(field);
		if (dir) setSortDir(dir);
		setCursorStack([undefined]);
		setPageIndex(0);
	}, []);

	const canPrev = pageIndex > 0;

	// Expose raw searchInput so controlled inputs show immediate feedback
	// but swap search ref to debounced value via setSearch
	void searchInput; // consumed via setSearch / setSearchInput path

	return {
		data,
		loading,
		error,
		pagination,
		canPrev,
		goNext,
		goPrev,
		reset,
		refresh,
		search: searchInput,
		setSearch,
		filters,
		setFilter,
		sort,
		sortDir,
		setSort: setSortFn,
		pageIndex,
	};
}

// Main components
export { DataTable, type ServerPaginationProps } from "./DataTable";
export { DataTableFacetedFilter } from "./DataTableFacetedFilter";
export {
	DataTableView,
	getRoleBadgeColor,
	RoleBadge,
	StatusBadge,
	type DataColumn,
	type FilterConfig,
} from "./DataTableView";
export { EmptyState, TableEmptyState } from "./EmptyState";
export { LoadingSpinner, LoadingContainer, PageLoader } from "./LoadingSpinner";
export {
	QuickAccessCard,
	QuickAccessGrid,
	type QuickAccessItem,
} from "./QuickAccessCard";
export {
	StatsCard,
	StatsGrid,
	StatsGridSkeleton,
	type StatItem,
} from "./StatsCard";
export { PageHeader } from "./PageHeader";

// Stats Factory
export {
	createAdminStats,
	createHODStats,
	createFacultyStats,
	createDeanStats,
	createStaffStats,
} from "./statsFactory";
export {
        createAdminQuickAccess,
        createHODQuickAccess,
        createFacultyQuickAccess,
        createStaffQuickAccess,
} from "./quickAccessFactory";

export { UserList, getBaseUserColumns, type BaseUserType } from './UserList';

export { TestList, getBaseTestColumns, type BaseTestType } from './TestList';

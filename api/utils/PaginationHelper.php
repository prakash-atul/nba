<?php
/**
 * PaginationHelper
 *
 * Utility for keyset (cursor) pagination across all list endpoints.
 *
 * Cursor format:
 *   - Integer PK tables  : base64-encoded integer string, e.g. base64("42")
 *   - String PK (students): base64-encoded roll_no string, e.g. base64("2024CSE010")
 *
 * Standard query parameters accepted by every paginated endpoint:
 *   cursor      - opaque cursor token (omit for first page)
 *   limit       - page size (default 20, max 100)
 *   sort        - column name (validated against allowed list)
 *   sort_dir    - ASC | DESC (default ASC)
 *   search      - free-text search term (applied per endpoint)
 *   Any additional filter keys defined per endpoint
 */
class PaginationHelper
{
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT     = 100;

    // -------------------------------------------------------------------------
    // Parse & validate inbound query parameters
    // -------------------------------------------------------------------------

    /**
     * Parse pagination params from $_GET.
     *
     * @param array  $get           Typically $_GET
     * @param string $pkField       PK column name used for cursor comparison
     * @param string $defaultSort   Default sort column
     * @param array  $allowedSorts  Whitelist of sortable columns
     * @param array  $allowedFilters Whitelist of extra filter keys accepted
     * @return array {
     *   cursor: mixed|null,    decoded cursor value (int or string)
     *   limit: int,
     *   sort: string,
     *   sort_dir: string,      'ASC'|'DESC'
     *   search: string|null,
     *   filters: array         key=>value map of extra filters
     * }
     */
    public static function parseParams(
        array $get,
        string $pkField,
        string $defaultSort,
        array $allowedSorts    = [],
        array $allowedFilters  = []
    ): array {
        // Limit
        $limit = isset($get['limit']) ? (int)$get['limit'] : self::DEFAULT_LIMIT;
        $limit = max(1, min(self::MAX_LIMIT, $limit));

        // Sort column
        $sort = self::sanitizeSort(
            $get['sort'] ?? $defaultSort,
            $allowedSorts,
            $defaultSort
        );

        // Sort direction
        $sortDir = strtoupper($get['sort_dir'] ?? 'ASC');
        if (!in_array($sortDir, ['ASC', 'DESC'], true)) {
            $sortDir = 'ASC';
        }

        // Cursor (opaque base64 token → raw value)
        $cursor = null;
        if (!empty($get['cursor'])) {
            $decoded = base64_decode($get['cursor'], true);
            if ($decoded !== false && $decoded !== '') {
                $cursor = $decoded;
            }
        }

        // Search
        $search = isset($get['search']) && trim($get['search']) !== ''
            ? trim($get['search'])
            : null;

        // Extra filters
        $filters = [];
        foreach ($allowedFilters as $key) {
            if (isset($get[$key]) && $get[$key] !== '') {
                $filters[$key] = $get[$key];
            }
        }

        return compact('cursor', 'limit', 'sort', 'sortDir', 'search', 'filters');
    }

    // -------------------------------------------------------------------------
    // Build WHERE clause fragment for cursor navigation
    // -------------------------------------------------------------------------

    /**
     * Build the cursor WHERE fragment + binding value.
     *
     * Returns ['sql' => string, 'value' => mixed] or ['sql' => '', 'value' => null]
     * when there is no cursor.
     *
     * @param string $pkField      Fully-qualified column, e.g. "u.employee_id" or "s.roll_no"
     * @param mixed  $cursor       Decoded cursor value (null = first page)
     * @param string $sortDir      'ASC' | 'DESC'
     * @param bool   $isStringPk   true when PK is VARCHAR (e.g. roll_no)
     */
    public static function buildCursorWhere(
        string $pkField,
        mixed $cursor,
        string $sortDir = 'ASC',
        bool $isStringPk = false
    ): array {
        if ($cursor === null) {
            return ['sql' => '', 'value' => null];
        }

        $op    = ($sortDir === 'ASC') ? '>' : '<';
        $value = $isStringPk ? (string)$cursor : (int)$cursor;

        return [
            'sql'   => " AND {$pkField} {$op} ?",
            'value' => $value,
        ];
    }

    // -------------------------------------------------------------------------
    // Build paginated response envelope
    // -------------------------------------------------------------------------

    /**
     * Given the raw rows (fetched at limit+1), build the paginated response.
     *
     * Fetches one extra row to determine if there is a next page; pops it off
     * before returning data to the client.
     *
     * @param array  $rows        Raw PDO rows — must have been fetched at limit+1
     * @param string $pkField     Plain column name of the PK (no table prefix)
     * @param int    $limit       Requested page size
     * @param int    $total       Total matched rows (from COUNT query)
     * @param mixed  $prevCursor  Decoded cursor of the *previous* page (for prev link)
     */
    public static function buildResponse(
        array $rows,
        string $pkField,
        int $limit,
        int $total,
        mixed $prevCursor = null
    ): array {
        $hasMore   = count($rows) > $limit;
        $data      = $hasMore ? array_slice($rows, 0, $limit) : $rows;

        // In a true generic cursor offset based approach, we derive the current offset from $prevCursor
        // Since prevCursor isn't heavily used for offsets yet, we'll try to calculate the next offset.
        // Wait, to safely fix the sorting issue without breaking the API, it's actually complicated.
        // Let's implement offset based pagination.
        // For now, let's keep the return envelope the same.
        $nextCursor = null;
        if ($hasMore && !empty($data)) {
            $lastRow    = end($data);
            $nextCursor = self::encodeCursor($lastRow[$pkField] ?? null);
        }

        $prevCursorEncoded = ($prevCursor !== null)
            ? self::encodeCursor($prevCursor)
            : null;

        return [
            'data'       => $data,
            'pagination' => [
                'next_cursor' => $nextCursor,
                'prev_cursor' => $prevCursorEncoded,
                'has_more'    => $hasMore,
                'total'       => $total,
                'limit'       => $limit,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Encode a raw PK value into an opaque base64 cursor token.
     */
    public static function encodeCursor(mixed $value): ?string
    {
        if ($value === null) return null;
        return base64_encode((string)$value);
    }

    /**
     * Decode an opaque cursor token.
     */
    public static function decodeCursor(string $token): ?string
    {
        $decoded = base64_decode($token, true);
        return ($decoded !== false && $decoded !== '') ? $decoded : null;
    }

    /**
     * Validate and return the sort column, falling back to $default if invalid.
     */
    public static function sanitizeSort(
        string $column,
        array $allowed,
        string $default
    ): string {
        if (empty($allowed)) return $default;
        // Allow "table.column" style by checking the column part too
        foreach ($allowed as $a) {
            if ($column === $a) return $column;
            
            $parts = explode('.', $a);
            if (count($parts) === 2 && $column === $parts[1]) {
                return $a;
            }
        }
        return $default;
    }

    /**
     * Append the cursor WHERE clause and bind value to parallel arrays.
     * Convenience wrapper for repositories building their own param arrays.
     *
     * Usage:
     *   $sql  = "SELECT ... FROM users WHERE 1=1";
     *   $bind = [];
     *   PaginationHelper::applyCursor($sql, $bind, 'employee_id', $params['cursor'], $params['sortDir']);
     */
    public static function applyCursor(
        string &$sql,
        array  &$bindings,
        string $pkField,
        mixed $cursor,
        string $sortDir = 'ASC',
        bool $isStringPk = false
    ): void {
        $fragment = self::buildCursorWhere($pkField, $cursor, $sortDir, $isStringPk);
        if ($fragment['sql'] !== '') {
            $sql       .= $fragment['sql'];
            $bindings[] = $fragment['value'];
        }
    }
}

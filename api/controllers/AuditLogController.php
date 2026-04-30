<?php

class AuditLogController {
    protected $auditService;
private $auditRepo;

    public function __construct($auditRepo, ?AuditService $auditService = null) {
        $this->auditService = $auditService;
$this->auditRepo = $auditRepo;
    }

    public function getLogs($request) {
        // Build filters manually instead of using mismatched PaginationHelper
        $filters = [
            'user_id' => $_GET['user_id'] ?? null,
            'action' => $_GET['action'] ?? null,
            'entity_type' => $_GET['entity_type'] ?? null,
            'entity_id' => $_GET['entity_id'] ?? null,
            'date_from' => $_GET['date_from'] ?? null,
            'date_to' => $_GET['date_to'] ?? null,
        ];
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

        $result = $this->auditRepo->findAll($filters, $page, $limit);

        // Result data is already mapped in Repository as array or needs toArray if objects
        $items = $result['data'];
        
        // Handle potential AuditLog objects if they exist
        if (!empty($items) && is_object($items[0]) && method_exists($items[0], 'toArray')) {
            $items = array_map(function($log) {
                return $log->toArray();
            }, $items);
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'total' => $result['pagination']['total_items'],
                'limit' => $result['pagination']['limit'],
                'has_more' => $page < $result['pagination']['total_pages'],
                'next_cursor' => $page < $result['pagination']['total_pages'] ? 'next' : null,
                'prev_cursor' => $page > 1 ? 'prev' : null
            ]
        ]);
    }
}
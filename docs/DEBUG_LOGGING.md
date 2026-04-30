# Admin Debug Logging System

## Overview

A comprehensive debug logging system for the NBA Admin system, tracking all API requests, user operations, and form interactions. The system consists of frontend logging (JavaScript) and backend logging (PHP).

## Frontend Debug Logger

### Location

- **Debug Logger Utility**: `src/lib/debugLogger.ts`
- **Debug Panel Component**: `src/features/admin/AdminDebugPanel.tsx`

### Features

#### 1. **Structured Logging**

```typescript
debugLogger.debug(module, message, data?);   // DEBUG level
debugLogger.info(module, message, data?);    // INFO level
debugLogger.warn(module, message, data?);    // WARN level
debugLogger.error(module, message, data?);   // ERROR level
```

#### 2. **Automatic Features**

- ✅ Timestamp tracking for every log entry
- ✅ Module-based organization
- ✅ Browser console output with color coding
- ✅ In-memory log storage (max 500 entries)
- ✅ Development-mode only

#### 3. **Log Management**

```typescript
// View all logs
const logs = debugLogger.getLogs();

// Export logs as JSON
const json = debugLogger.exportLogs();

// Download logs to file
debugLogger.downloadLogs();

// Clear all logs
debugLogger.clearLogs();
```

### Debug Panel (Frontend)

Accessible in the bottom-right corner of the Admin interface:

- **Expand/Collapse**: Click the header to toggle the panel
- **Refresh**: Update the log display
- **Export**: Download logs as JSON file
- **Clear**: Remove all logs from memory

**Log Entry Display**:

```
[timestamp] [LEVEL] [module]: message
├── Data (expandable)
└── Additional context
```

## Backend Logger (PHP)

### Location

- **File Logger Class**: `api/utils/FileLogger.php`

### Features

#### 1. **File-Based Logging**

- Logs stored in: `api/logs/admin-YYYY-MM-DD.log`
- Automatic directory creation
- Automatic log rotation (5MB threshold)

#### 2. **Logging Methods**

```php
$fileLogger = $GLOBALS['fileLogger'];

$fileLogger->debug($module, $message, $data);
$fileLogger->info($module, $message, $data);
$fileLogger->warn($module, $message, $data);
$fileLogger->error($module, $message, $data);
```

#### 3. **Log Format**

```
[2026-03-17 14:35:42] [INFO] [Module]: Message description | Data: {...}
[2026-03-17 14:35:43] [ERROR] [Module]: Error occurred | Data: {...}
```

#### 4. **Log Retrieval**

```php
// Get recent 100 log lines
$recentLogs = $fileLogger->getRecentLogs(100);
```

## Implementation Examples

### Frontend: API Call Logging

**Base API Service** (`src/services/api/base.ts`):

- All GET, POST, PUT, DELETE requests automatically logged
- Performance timing tracked
- Response status and errors captured

Example output:

```
ℹ️ [14:35:42] API: POST request: /admin/users
  └─ body: {username: "john", email: "john@example.com"}
✓ [14:35:43] API: POST /admin/users - Status: 201 (145.23ms)
  └─ Success
```

### Frontend: User Operations

**UserList Component** (`src/features/users/UserList.tsx`):

```typescript
// Create user logged
debugLogger.info("UserList", "Creating user", {
	employee_id: data.employee_id,
	username: data.username,
	role: data.role,
});

// Update user logged
debugLogger.info("UserList", "Updating user", {
	employee_id: employeeId,
	changes: data,
});

// Delete user logged
debugLogger.warn("UserList", "Deleting user", {
	employee_id: employeeId,
});
```

### Frontend: Form Validation

**CreateUserDialog** (`src/features/users/CreateUserDialog.tsx`):

```typescript
// Validation logging
if (Object.keys(newErrors).length > 0) {
	debugLogger.warn("CreateUserDialog", "Form validation failed", newErrors);
} else {
	debugLogger.debug("CreateUserDialog", "Form validation passed");
}

// Form submission
debugLogger.info("CreateUserDialog", "Submitting new user form", {
	employee_id: formData.employee_id,
	username: formData.username,
	email: formData.email,
	role: formData.role,
});
```

### Backend: User Controller

**UserController** (`api/controllers/UserController.php`):

```php
// Create user operation
$fileLogger->info('UserController', 'CREATE USER: Request received', [
  'admin_id' => $userData['employee_id'],
  'admin_role' => $userData['role']
]);

// Permission denied
$fileLogger->warn('UserController', 'CREATE USER: Access denied - not admin', [
  'user_role' => $userData['role']
]);

// Success
$fileLogger->info('UserController', 'CREATE USER: User created successfully', [
  'employee_id' => $data['employee_id'],
  'username' => $data['username'],
  'role' => $data['role']
]);

// Error
$fileLogger->error('UserController', 'CREATE USER: Exception occurred', [
  'error' => $e->getMessage()
]);
```

## Log Levels Explained

| Level     | Usage                                      | Color  |
| --------- | ------------------------------------------ | ------ |
| **DEBUG** | Fine-grained diagnostic info               | Gray   |
| **INFO**  | General informational messages             | Blue   |
| **WARN**  | Warning conditions (delete, sensitive ops) | Yellow |
| **ERROR** | Error conditions requiring attention       | Red    |

## Accessing Logs

### Frontend

1. Open admin interface in development mode
2. Look for **Debug Logs** panel in bottom-right corner
3. Click to expand and view real-time logs
4. Click "Export" to download as JSON

### Backend

1. Navigate to: `api/logs/`
2. Open the current day's log file: `admin-YYYY-MM-DD.log`
3. Use any text editor to view
4. Most recent entries appear at bottom

### Real-time Backend Monitoring

```bash
# On Linux/Mac
tail -f api/logs/admin-2026-03-17.log

# Watch for new entries
tail -f api/logs/admin-*.log | grep "ERROR"
```

## Debugging Workflow

### Issue: User update fails with 500 error

**Step 1: Frontend**

- Check Debug Panel for API error logs
- Look for "PUT /admin/users/XXXX" entry
- Note the response status and error message

**Step 2: Backend**

- Check `api/logs/admin-YYYY-MM-DD.log`
- Search for "UPDATE USER:" entries
- Find matching timestamp from frontend logs
- Review the error context and data

**Step 3: Analysis**

```
Frontend Log:
❌ [14:35:43] API: PUT /admin/users/3001 - Status: 500
  └─ error: "Failed to update user"

Backend Log:
[2026-03-17 14:35:43] [ERROR] [UserController]: UPDATE USER: Exception occurred | Data: {
  "employee_id": 3001,
  "error": "Unknown column 'department_id' in SET clause"
}
```

## Performance Tracking

Frontend logs include millisecond-precision timing:

```
ℹ️ [14:35:42] API: GET /admin/users - Status: 200 (234.56ms)
ℹ️ [14:35:43] API: POST /admin/users - Status: 201 (145.23ms)
```

Monitor for slow requests (>1000ms) to identify performance issues.

## Best Practices

1. **Always log user-initiated actions** (create, update, delete)
2. **Include context** - user IDs, operation details
3. **Use appropriate levels** - don't overuse DEBUG/INFO
4. **Check frontend + backend logs together** for full flow
5. **Export logs** before clearing for record-keeping
6. **Monitor for errors** in production-like environments

## Security Considerations

- ✅ Debug logs are **development-mode only**
- ✅ Sensitive data (passwords, tokens) **NOT logged**
- ✅ Backend logs stored on server, not exposed to clients
- ✅ Frontend logs stored in browser memory only
- ⚠️ Export logs carefully - may contain personal info (emails, employee IDs)

## Troubleshooting

### Logs not appearing in frontend

- Ensure you're in development mode (`import.meta.env.DEV`)
- Check browser DevTools for console errors
- Verify AdminDebugPanel is rendered

### Backend logs not created

- Check if `api/logs/` directory is writable
- Verify FileLogger is included in `api/index.php`
- Check PHP error logs for permission issues

### Log file too large

- Automatic rotation at 5MB threshold
- Old files renamed with timestamp: `admin-2026-03-17.log.1711036542`
- Manual cleanup: `rm api/logs/admin-*.log.*`

## Future Enhancements

- [ ] Remote log aggregation
- [ ] Real-time log streaming via WebSocket
- [ ] Log search and filtering UI
- [ ] Performance metrics dashboard
- [ ] Automatic error alerting

---

**Last Updated**: March 17, 2026
**Version**: 1.0

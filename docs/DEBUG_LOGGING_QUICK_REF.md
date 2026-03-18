# Debug Logging Quick Reference

## Frontend Usage

### Import the logger

```typescript
import { debugLogger } from "@/lib/debugLogger";
```

### Log levels

```typescript
debugLogger.debug("MyModule", "Debug message", { data: "optional" });
debugLogger.info("MyModule", "Info message", { data: "optional" });
debugLogger.warn("MyModule", "Warning message", { data: "optional" });
debugLogger.error("MyModule", "Error message", { data: "optional" });
```

### UI Component logging

```typescript
// In React component
const handleClick = () => {
	debugLogger.info("MyComponent", "Button clicked", {
		userId: user.id,
		action: "create",
	});
	// ... rest of logic
};
```

### Form validation logging

```typescript
if (errors.length > 0) {
	debugLogger.warn("FormComponent", "Validation failed", { errors });
} else {
	debugLogger.debug("FormComponent", "Validation passed");
}
```

## Backend Usage

### Access the logger

```php
$fileLogger = $GLOBALS['fileLogger'];

// Logging operations
$fileLogger->info('ControllerName', 'Operation: Message', [
  'user_id' => $userId,
  'action' => 'create',
  'status' => 'success'
]);
```

### Common patterns

```php
// At operation start
$fileLogger->info('UserController', 'CREATE USER: Request received', [
  'admin_id' => $admin_id
]);

// Access control
if (!$isAdmin) {
  $fileLogger->warn('UserController', 'CREATE USER: Access denied', [
    'role' => $user_role
  ]);
}

// Validation
if (!empty($errors)) {
  $fileLogger->warn('UserController', 'CREATE USER: Validation failed', [
    'errors' => $errors
  ]);
}

// Success
$fileLogger->info('UserController', 'CREATE USER: Success', [
  'employee_id' => $data['employee_id'],
  'username' => $data['username']
]);

// Error
$fileLogger->error('UserController', 'CREATE USER: Exception', [
  'error' => $e->getMessage()
]);
```

## Viewing Logs

### Frontend (Chrome DevTools)

1. Open DevTools (F12)
2. Go to Console tab
3. Filter by color coding or by searching module name
4. Or use the **Debug Logs** panel in bottom-right corner

### Backend

1. Navigate to `api/logs/` folder
2. Open current day file: `admin-YYYY-MM-DD.log`
3. Use `tail -f` to watch live:
    ```bash
    tail -f api/logs/admin-2026-03-17.log
    ```

## Common Scenarios

### User Creation Flow

```typescript
// Frontend
debugLogger.info("UserList", "Creating user", { username, role });
// → API Call logged automatically
// → Response logged with status

// Backend → UserController
$fileLogger->info('UserController', 'CREATE USER: Request received');
// ... validation ...
$fileLogger->info('UserController', 'CREATE USER: User created successfully', [
  'employee_id' => $id
]);
```

### User Update Flow

```typescript
// Frontend
debugLogger.info("EditUserDialog", "Submitting update", { employee_id, fields });
// → API Call logged (PUT request)

// Backend → UserController
$fileLogger->info('UserController', 'UPDATE USER: Request received', [
  'target_employee_id' => $id
]);
// ... updates ...
$fileLogger->info('UserController', 'UPDATE USER: User updated successfully', [
  'fields_updated' => array_keys($data)
]);
```

### Debugging an Error

```
1. Check frontend panel or console
2. Find the failed operation timestamp
3. Search backend logs for same timestamp
4. Match the module name and operation
5. Review the logged data context
6. Check error/exception details
```

## Tips & Tricks

- **Timestamps auto-included** - easy to correlate frontend & backend
- **Always include context** - user IDs, operation names
- **Use warn level for deletions** - color-coded for attention
- **Export logs** for sharing with debugging team
- **Keep data payloads small** - don't log entire objects if not needed

---

For detailed documentation, see `DEBUG_LOGGING.md`

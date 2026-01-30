<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NBA Assessment API</title>
    <style>
        :root {
            --primary: #2563eb;
            --bg: #f8fafc;
            --card: #ffffff;
            --text: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 3rem;
            text-align: center;
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--primary), #1d4ed8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        h2 {
            font-size: 1.5rem;
            margin-top: 2rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--border);
        }

        .card {
            background: var(--card);
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 1rem;
            overflow: hidden;
        }

        .endpoint {
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .endpoint:last-child {
            border-bottom: none;
        }

        .method {
            font-weight: bold;
            font-size: 0.875rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            min-width: 60px;
            text-align: center;
        }

        .method.GET {
            background: #dbeafe;
            color: #1e40af;
        }

        .method.POST {
            background: #d1fae5;
            color: #065f46;
        }

        .method.PUT {
            background: #fef3c7;
            color: #92400e;
        }

        .method.DELETE {
            background: #fee2e2;
            color: #991b1b;
        }

        .path {
            font-family: monospace;
            font-size: 1rem;
            color: var(--text);
            flex-grow: 1;
        }

        .desc {
            font-size: 0.875rem;
            color: var(--text-light);
        }

        .badge {
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
            border-radius: 999px;
            background: var(--bg);
            border: 1px solid var(--border);
        }

        .role-admin {
            border-color: var(--danger);
            color: var(--danger);
        }

        .role-faculty {
            border-color: var(--primary);
            color: var(--primary);
        }

        .role-hod {
            border-color: var(--warning);
            color: var(--warning);
        }

        footer {
            margin-top: 4rem;
            text-align: center;
            color: var(--text-light);
            font-size: 0.875rem;
        }
    </style>
</head>

<body>
    <div class="container">
        <header>
            <h1>NBA Assessment API</h1>
            <p>RESTful API for Outcome Based Education Management System</p>
            <div style="margin-top: 1rem;">
                <span class="badge">v1.0.0</span>
                <span class="badge">JSON</span>
                <span class="badge">JWT Auth</span>
            </div>
        </header>

        <h2>Authentication</h2>
        <div class="card">
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/auth/login</span>
                <span class="desc">Authenticate user & get token</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/auth/profile</span>
                <span class="desc">Get current user profile</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/auth/logout</span>
                <span class="desc">Invalidate session</span>
            </div>
        </div>

        <h2>Faculty Operations</h2>
        <div class="card">
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/courses</span>
                <span class="desc">Get assigned courses</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/course-tests</span>
                <span class="desc">Get tests for a course</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/assessment</span>
                <span class="desc">Create new assessment/test</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/courses/{id}/copo-matrix</span>
                <span class="desc">Get CO-PO mapping matrix</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/courses/{id}/copo-matrix</span>
                <span class="desc">Save CO-PO mapping matrix</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/courses/{id}/attainment-config</span>
                <span class="desc">Get attainment target levels</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/courses/{id}/attainment-config</span>
                <span class="desc">Set attainment target levels</span>
            </div>
        </div>

        <h2>Marks Management</h2>
        <div class="card">
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/marks/bulk</span>
                <span class="desc">Bulk upload marks (Excel/CSV)</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/marks/by-question</span>
                <span class="desc">Save marks per question</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/marks</span>
                <span class="desc">Get marks overview</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/marks/test</span>
                <span class="desc">Get detailed marks for test</span>
            </div>
        </div>

        <h2>Admin & HOD</h2>
        <div class="card">
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/admin/users</span>
                <span class="desc">List all system users</span>
            </div>
            <div class="endpoint">
                <span class="method POST">POST</span>
                <span class="path">/admin/users</span>
                <span class="desc">Create new user</span>
            </div>
            <div class="endpoint">
                <span class="method GET">GET</span>
                <span class="path">/hod/stats</span>
                <span class="desc">Department statistics</span>
            </div>
        </div>

        <footer>
            <p>Documentation &copy; 2026 NBA Assessment System. <a href="/nba/docs/API_REFERENCE.md" style="color: inherit;">Full Reference</a></p>
        </footer>
    </div>
</body>

</html>
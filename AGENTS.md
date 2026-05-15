# NBA OBE System - Agent Guide

## Project Structure

- `/api` - PHP backend (Custom MVC, no framework)
- `/frontend` - React 19 + TypeScript + Vite + Tailwind CSS + Shadcn
- `/docs` - Database schema, migrations, API documentation

## Code Exploration Policy

Always use jcodemunch tools—never fall back to Read, Grep, or Glob for code exploration.

- Before reading a file: use get_file_outline or get_file_content.
- Before searching: use search_symbols or search_text.
- Call resolve_repo on the current directory first; if not indexed, call index_folder.

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev      # Start dev server
npm run build    # TypeScript + Vite build
npm run lint     # ESLint
```

### Backend

- Requires XAMPP (Apache + MySQL)
- Database: Import `docs/db.sql` and `docs/migrations/*.sql`
- Config: Update `api/config/DatabaseConfig.php`
- URL: `http://localhost/nba/api` (requires Apache URL rewriting)

## Key Setup Notes

- **API Base URL**: Configure in `frontend/.env` via `VITE_API_BASE_URL`
- **Shadcn Components**: Run from `frontend/` root, not repo root
- **PHP Version**: 8.x required
- **Database**: MySQL 8.0

## Dev Server Behavior

Frontend runs on Vite (typically port 5173), proxy configured in `vite.config.ts` to forward `/api` requests to backend.

## No CI/CD

This repo has no GitHub Actions workflows or automated pipelines. Deployment is manual to AWS EC2.

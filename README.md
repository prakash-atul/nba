# NBA Assessment System (OBE)

A comprehensive **Outcome Based Education (OBE)** management system tailored for verifying National Board of Accreditation (NBA) compliance. This system streamlines the calculation of **Course Attainment**, **CO-PO Mapping**, and **Student Performance Assessment**.

## Key Features

- **RBAC System**: Dedicated portals for Dean, HOD, Faculty, Staff, and Admin.
- **Course Outcome (CO) Mapping**: Dynamic CO-PO/PSO mapping matrix with persistence.
- **Marks Management**: Question-wise marks entry to auto-calculate CO attainment totals.
- **Bulk Imports**: Support for CSV/Excel upload for student marks and enrollment.
- **Attainment Calculation**: Automated calculation of Course Attainment Levels (1, 2, 3) based on configurable thresholds.
- **Digital Records**: PDF storage for Syllabus and Question Papers.

## Tech Stack

- **Backend**: PHP 8.x (Custom MVC Architecture)
- **Database**: MySQL 8.0
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Deployment**: AWS EC2 (Ubuntu/Nginx)

## Quick Setup

1. **Database Setup**:
   Import docs/db.sql and docs/migrations/*.sql into your MySQL instance.

2. **Backend Configuration**:
   Update pi/config/DatabaseConfig.php with your credentials.

3. **Frontend Setup**:
   `ash
   cd frontend
   npm install
   npm run dev
   `

## Project Structure

- /api - PHP REST API (Controllers, Models, Middleware)
- /frontend - React SPA (Dashboards, Components)
- /docs - Database Schema, ER Diagrams, and API Documentation

## Live Demo
- **Frontend**: [https://nba.wily.in](https://nba.wily.in)
- **API**: [https://api.nba.wily.in](https://api.nba.wily.in)

---
*Developed for CSE Department, Tezpur University.*

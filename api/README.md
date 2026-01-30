# NBA Assessment API

Restful API for the NBA Outcome Based Education (OBE) Management System.

**Base URL**: https://api.nba.wily.in (Production) | http://localhost/nba/api (Dev)  
**Auth**: Bearer Token (JWT) required for all non-auth endpoints.

## Quick Start

### 1. Login
`http
POST /auth/login
Content-Type: application/json

{
    "email": "faculty_01@tezu.ac.in",
    "password": "password123"
}
`

### 2. Get Courses (Faculty)
`http
GET /courses
Authorization: Bearer <your_token>
`

## Key Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Auth** | POST | /auth/login | Login & get token |
| | GET | /auth/profile | Get user details |
| **Faculty** | GET | /courses | List assigned courses |
| | POST | /assessment | Create a test/assessment |
| | GET | /course-tests | List tests for a course |
| **Attainment** | GET | /courses/{id}/copo-matrix | View CO-PO Mapping |
| | POST | /courses/{id}/copo-matrix | Update Mapping |
| | GET | /courses/{id}/attainment-config | View Target Levels |
| **Marks** | POST | /marks/bulk | Upload Marks via CSV |
| | GET | /marks/test | Get Test Results |

## Documentation
- [Full API Reference](../docs/API_REFERENCE.md)
- [Database Schema](../docs/DATABASE_SCHEMA.md)

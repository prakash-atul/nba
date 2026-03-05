#!/bin/bash
TOKEN=$(curl -s -X POST https://api.nba.wily.in/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin_01@tezu.ac.in\",\"password\":\"password123\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['token'])")
curl -s "https://api.nba.wily.in/admin/departments?limit=20&sort=d.department_code&sort_dir=ASC" -H "Authorization: Bearer $TOKEN"
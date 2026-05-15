---
name: jcodemunch
description: High-performance code indexing and symbol search for token savings.
compatibility: opencode
---

## What I do

- Index entire codebases into a symbol-based catalog.
- Perform O(1) symbol lookups (functions, classes, methods).
- Search text and symbols across the repository without reading every file.

## When to use me

- Use this IMMEDIATELY when entering a new project or after major changes.
- ALWAYS use `index_folder` before exploring code.
- Use `search_symbols` or `get_file_outline` instead of reading full files to save tokens.
- Use `get_symbol_source` to pull specific code blocks once identified.

## Execution Rules

- NEVER fall back to default Read, Grep, or Bash for code exploration if this skill is available.
- If a repository isn't indexed, call `index_folder` on the root directory first.

import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already imported
    if 'debugLogger' in content:
        print(f"Skipping {file_path}")
        return

    # Add import
    import_match = list(re.finditer(r'^import .*;?$', content, re.MULTILINE))
    if import_match:
        last_import_end = import_match[-1].end()
        content = content[:last_import_end] + '\nimport { debugLogger } from "@/lib/debugLogger";' + content[last_import_end:]
    else:
        content = 'import { debugLogger } from "@/lib/debugLogger";\n' + content

    # Find component body and its name
    # We'll use a wrapper to handle multiple components in the same file
    def inject_logs(content_to_edit):
        # Match components more broadly
        comp_pattern = r'(?:export\s+)?(?:function|const)\s+(\w+)\s*=\s*(?:\([^)]*\)|)\s*=>\s*\{|(?:export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{'
        
        matches = list(re.finditer(comp_pattern, content_to_edit))
        # Iterate backwards to avoid index shifts
        for m in reversed(matches):
            comp_name = m.group(1) or m.group(2)
            if not comp_name: continue
            
            # Find the range of this component (simplistic brace counting)
            start_idx = m.end() - 1
            brace_count = 0
            end_idx = -1
            for i in range(start_idx, len(content_to_edit)):
                if content_to_edit[i] == '{':
                    brace_count += 1
                elif content_to_edit[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break
            
            if end_idx == -1: continue
            
            comp_body_full = content_to_edit[start_idx:end_idx]
            original_body = comp_body_full
            body_inner = comp_body_full[1:-1] # Remove outer braces

            # 1. useEffect mount log
            def sub_ue(m):
                indent = m.group(1)
                inner = m.group(2)
                deps = m.group(3)
                if 'debugLogger.info' in inner: return m.group(0)
                return f'{indent}useEffect(() => {{\n{indent}\tdebugLogger.info("{comp_name}", "Mounted");\n{inner}{indent}}}, {deps}'

            body_inner = re.sub(r'(\s+)useEffect\(\(\) => \{(.*?)\s+\}, (\[.*?\]|\))', sub_ue, body_inner, flags=re.DOTALL)

            # 2. Async functions log
            def sub_async(a_m):
                indent = a_m.group(1)
                prefix = a_m.group(2)
                name = a_m.group(3)
                params = a_m.group(4)
                inner = a_m.group(5)
                if 'debugLogger.info' in inner: return a_m.group(0)
                
                new_inner = f'\n{indent}\tdebugLogger.info("{comp_name}", "{name} starting");\n{inner}'
                
                # Catch blocks in this async function
                def sub_catch(c_m):
                    c_indent = c_m.group(1)
                    err_var = c_m.group(2)
                    c_inner = c_m.group(3)
                    if 'debugLogger.error' in c_inner: return c_m.group(0)
                    return f'{c_indent}catch ({err_var}) {{\n{c_indent}\tdebugLogger.error("{comp_name}", "{name} failed", {err_var});\n{c_inner}{c_indent}}}'
                
                new_inner = re.sub(r'(\s+)catch\s*\((.*?)\)\s*\{(.*?)\s+\}', sub_catch, new_inner, flags=re.DOTALL)
                return f'{indent}{prefix}{name}{params}{{{new_inner}{indent}}}'

            # Pattern for async arrow functions: const name = async (...) => {
            body_inner = re.sub(r'(\s+)(const\s+(\w+)\s*=\s*async\s*)(\(.*?\)| \w+)\s*=>\s*\{(.*?)\s+\}', sub_async, body_inner, flags=re.DOTALL)
            # Pattern for async declared functions: async function name(...) {
            body_inner = re.sub(r'(\s+)(async\s+function\s+(\w+)\s*)(\(.*?\))\s*\{(.*?)\s+\}', sub_async, body_inner, flags=re.DOTALL)

            content_to_edit = content_to_edit[:start_idx+1] + body_inner + content_to_edit[end_idx-1:]
            
        return content_to_edit

    content = inject_logs(content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {file_path}")

folder = r"c:\xampp\htdocs\nba-met4l\frontend\src\components\hod"
targets = ["CoursesManagement.tsx", "FacultyManagement.tsx", "HODQuickAccess.tsx", "HODStatsCards.tsx", "HODStudents.tsx"]

for filename in targets:
    path = os.path.join(folder, filename)
    if os.path.exists(path):
        process_file(path)

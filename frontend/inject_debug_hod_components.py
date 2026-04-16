import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already imported
    if 'debugLogger' in content:
        print(f"Skipping {file_path} (already has debugLogger)")
        return

    # Add import
    # Find the last import line or just add at top
    import_match = list(re.finditer(r'^import .*;?$', content, re.MULTILINE))
    if import_match:
        last_import_end = import_match[-1].end()
        content = content[:last_import_end] + '\nimport { debugLogger } from "@/lib/debugLogger";' + content[last_import_end:]
    else:
        content = 'import { debugLogger } from "@/lib/debugLogger";\n' + content

    # Find component body and its name
    # We'll use a wrapper to handle multiple components in the same file
    def inject_logs(content_to_edit):
        # 1. Component definitions and their names
        # export function Name(...) { | function Name(...) { | const Name = (...) => { | export const Name = (...) => {
        comp_pattern = r'(?:export\s+)?(?:function|const)\s+(\w+)\s*=\s*(?:\([^)]*\)|)\s*=>\s*\{|(?:export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{'
        
        for m in re.finditer(comp_pattern, content_to_edit):
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
            
            comp_body = content_to_edit[start_idx:end_idx]
            original_body = comp_body

            # A. useEffect mount log
            # useEffect(() => { ... }, [deps])
            def sub_ue(ue_m):
                indent = ue_m.group(1)
                inner = ue_m.group(2)
                deps = ue_m.group(3)
                if 'debugLogger.info' in inner: return ue_m.group(0)
                return f'{indent}useEffect(() => {{\n{indent}\tdebugLogger.info("{comp_name}", "Mounted");\n{inner}{indent}}}, {deps}'

            comp_body = re.sub(r'(\s+)useEffect\(\(\) => \{(.*?)\s+\}, (\[.*?\]|\))', sub_ue, comp_body, flags=re.DOTALL)

            # B. Async functions log
            # const name = async (...) => { ... } | async function name(...) { ... }
            def sub_async(a_m):
                indent = a_m.group(1)
                prefix = a_m.group(2)
                name = a_m.group(3)
                inner = a_m.group(4)
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
                return f'{indent}{prefix}{name}{a_m.group(5)}{{{new_inner}{indent}}}'

            # Pattern for async arrow functions
            comp_body = re.sub(r'(\s+)(const\s+(\w+)\s*=\s*async\s*.*?\s*=>\s*)\{(.*?)\s+\}', sub_async, comp_body, flags=re.DOTALL)
            # Pattern for async declared functions
            comp_body = re.sub(r'(\s+)(async\s+function\s+(\w+)\s*\(.*?\)\s*)\{(.*?)\s+\}', sub_async, comp_body, flags=re.DOTALL)

            content_to_edit = content_to_edit.replace(original_body, comp_body)
            
        return content_to_edit

    content = inject_logs(content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

folder = r"c:\xampp\htdocs\nba-met4l\frontend\src\components\hod"
targets = ["CoursesManagement.tsx", "FacultyManagement.tsx", "HODQuickAccess.tsx", "HODStatsCards.tsx", "HODStudents.tsx"]

for filename in targets:
    path = os.path.join(folder, filename)
    if os.path.exists(path):
        print(f"Processing {filename}...")
        process_file(path)
    else:
        print(f"File {filename} not found.")

import os
import re

def process_file(file_path, page_name):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import debugLogger
    if 'import { debugLogger } from "@/lib/debugLogger";' not in content:
        # Insert after the last import
        import_match = list(re.finditer(r'^import .*;?$', content, re.MULTILINE))
        if import_match:
            last_import_end = import_match[-1].end()
            content = content[:last_import_end] + '\nimport { debugLogger } from "@/lib/debugLogger";' + content[last_import_end:]
        else:
            content = 'import { debugLogger } from "@/lib/debugLogger";\n' + content

    # 2. Add log for component mount in useEffect
    # Find useEffect(() => { ... }, []);
    def replace_use_effect(match):
        body = match.group(2)
        if f'debugLogger.info("{page_name}", "Component mounted")' not in body:
            return f'useEffect(() => {{\n\t\tdebugLogger.info("{page_name}", "Component mounted");{body}}}, {match.group(3)})'
        return match.group(0)

    content = re.sub(r'useEffect\(\(\) => \{(.*?)\}, (\[.*?\])\)', replace_use_effect, content, flags=re.DOTALL)

    # 3. Add debug logs to async data loading functions
    # Patterns like: const loadStats = async () => { ... }
    # or async function fetchData() { ... }
    # or const handleStudentUpdate = async (...) => { ... }
    
    def replace_async_func(match):
        func_name = match.group(1) or match.group(2)
        params = match.group(3) or ""
        body = match.group(4)
        
        # Check if it already has the log
        if f'debugLogger.info("{page_name}", "{func_name} starting"' in body:
            return match.group(0)
            
        new_body = f'\n\t\tdebugLogger.info("{page_name}", "{func_name} starting", {{ {params.strip()} }});' + body
        
        # Replace catch blocks if present
        def replace_catch(catch_match):
            catch_body = catch_match.group(1)
            error_var = catch_match.group(2) or "error"
            if f'debugLogger.error("{page_name}", "{func_name} failed"' not in catch_body:
                # Insert at beginning of catch body
                return f'catch ({error_var}) {{\n\t\t\tdebugLogger.error("{page_name}", "{func_name} failed", {error_var});{catch_body}}}'
            return catch_match.group(0)
            
        new_body = re.sub(r'catch\s*\((.*?)\)\s*\{(.*?)\}', replace_catch, new_body, flags=re.DOTALL)
        
        # Reconstruct the function
        if match.group(1): # const name = async (...) => {
            return f'const {func_name} = async ({params}) => {{{new_body}}}'
        else: # async function name(...) {
            return f'async function {func_name}({params}) {{{new_body}}}'

    # Match async functions
    content = re.sub(r'const (\w+) = async \((.*?)\) => \{(.*?)\}', replace_async_func, content, flags=re.DOTALL)
    content = re.sub(r'async function (\w+)\((.*?)\) \{(.*?)\}', replace_async_func, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

base_path = r'c:\xampp\htdocs\nba-met4l\frontend\src\pages\hod'
files_to_process = {
    'HODHome.tsx': 'HODHome',
    'HODStudentsPage.tsx': 'HODStudentsPage'
}

for file_name, page_name in files_to_process.items():
    process_file(os.path.join(base_path, file_name), page_name)

print("Processed files successfully.")

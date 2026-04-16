import re

file_path = 'src/features/copo/COPOMapping.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'debugLogger\.log\(', r'debugLogger.info("COPOMapping", ', content)
content = re.sub(r'debugLogger\.error\(', r'debugLogger.error("COPOMapping", ', content)

# Optionally fix the specific colon issue from the example:
content = re.sub(r'"([^"]+):"\s*,\s*error\)', r'"\1", error)', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {file_path}")

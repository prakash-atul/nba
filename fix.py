import re
with open('c:/xampp/htdocs/nba-met4l/api/models/UserRepository.php', 'r', encoding='utf-8') as f:
    text = f.read()
text2 = re.sub(r"\$userData\['updated_at'\] \?\? null[\s\S]*?\);", "\$userData['updated_at'] ?? null,\n                    \$userData['school_id'] ?? null\n                );", text)
with open('c:/xampp/htdocs/nba-met4l/api/models/UserRepository.php', 'w', encoding='utf-8') as f:
    f.write(text2)
print("done", text != text2)

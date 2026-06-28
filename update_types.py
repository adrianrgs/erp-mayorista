import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# We want to add "updatedAt?: string;" to every interface in types.ts
interfaces = re.findall(r'export interface \w+\s*\{[^}]+\}', content)

for i in interfaces:
    if "updatedAt?: string;" not in i:
        # Find the opening brace and append after it
        new_i = i.replace("{", "{\n  updatedAt?: string;", 1)
        content = content.replace(i, new_i)

with open('src/types.ts', 'w') as f:
    f.write(content)

print("Done")

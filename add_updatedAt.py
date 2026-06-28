import re

with open('dataconnect/schema/schema.gql', 'r') as f:
    content = f.read()

# We want to add "  updatedAt: String" to every type definition before the closing bracket
types = re.findall(r'type \w+ @table \{[^}]+\}', content)

for t in types:
    if "updatedAt:" not in t:
        new_t = t.replace('}', '  updatedAt: String\n}')
        content = content.replace(t, new_t)

with open('dataconnect/schema/schema.gql', 'w') as f:
    f.write(content)

print("Done")

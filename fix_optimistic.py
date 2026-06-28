import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We need to swap the setX(prev => ...) with the await updateX(...)
# For example:
# await updatePayableObligation(dataConnect, { ...updated });
# setPayableObligations(prev => prev.map(o => o.id === updated.id ? updated : o));

def optimize_update(match):
    await_call = match.group(1)
    set_call = match.group(2)
    return set_call + "\n      " + await_call

# update
content = re.sub(r'(await\s+\w+\(dataConnect,[^\)]+\);)\s*(set\w+\([^;]+;\))', optimize_update, content)
# insert
content = re.sub(r'(await\s+\w+\(dataConnect,[^\)]+\);)\s*(set\w+\([^;]+;\))', optimize_update, content)
# delete
content = re.sub(r'(await\s+\w+\(dataConnect,[^\)]+\);)\s*(set\w+\([^;]+;\))', optimize_update, content)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")

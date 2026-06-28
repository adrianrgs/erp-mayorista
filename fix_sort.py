import re

with open("src/App.tsx", "r") as f:
    content = f.read()

old_sort = "const sortByUpdated = (a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();"

new_sort = """const sortByUpdated = (a: any, b: any) => {
    const timeA = new Date(a.updatedAt || a.createdAt || a.date || a.issueDate || a.fecha || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || b.date || b.issueDate || b.fecha || 0).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  };"""

content = content.replace(old_sort, new_sort)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")

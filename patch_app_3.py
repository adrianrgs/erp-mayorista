import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("const sortedPayables = [...obligations].sort(sortByUpdated);", "const sortedPayables = [...payableObligations].sort(sortByUpdated);")
content = content.replace("const sortedTransfers = [...operacionesTraslados].sort(sortByUpdated);", "")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")

import re

with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
boletos_count = 0
for line in lines:
    if "const [boletos, setBoletos] = useState" in line:
        boletos_count += 1
        if boletos_count > 1:
            continue
    new_lines.append(line)

content = "".join(new_lines)
# Fix the OperationalTransfer
content = content.replace("const handleUpdateTransfer = async (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")
# Fix any remaining String
content = content.replace("temporadaFin: String", "temporadaFin: string")

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/types/producto.ts", "r") as f:
    prod = f.read()
prod = prod.replace("temporadaFin: String", "temporadaFin: string")
with open("src/types/producto.ts", "w") as f:
    f.write(prod)

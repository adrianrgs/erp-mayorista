import re

with open("src/App.tsx", "r") as f:
    content = f.read()

lucide_imports = ["ChevronDown", "Search", "Box", "Activity", "Wallet", "Receipt", "CreditCard", "ArrowDownRight"]

for icon in lucide_imports:
    if icon not in content.split("lucide-react")[0]: # quick hack, check if it's imported
        content = content.replace('import { ChevronDown, Search, Box } from "lucide-react";', f'import {{ ChevronDown, Search, Box, Activity, Wallet, Receipt, CreditCard, ArrowDownRight }} from "lucide-react";')

with open("src/App.tsx", "w") as f:
    f.write(content)

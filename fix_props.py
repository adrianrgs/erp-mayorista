import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix Wallet
content = content.replace('import { ChevronDown, Search, Box, Activity, Wallet, Receipt, CreditCard, ArrowDownRight } from "lucide-react";', 
                          'import { ChevronDown, Search, Box, Activity, Receipt, CreditCard, ArrowDownRight } from "lucide-react";')

# Fix mapToOperationalTransfer
content = content.replace("mapToOperationalTransfer(res, transfers)", "mapToOperationalTransfer(res)")

# Fix ServiciosView props
content = content.replace("onDeleteExtraService={handleDeleteExtraService}", "")
content = content.replace("onDeleteServiceRate={handleDeleteServiceRate}", "")

# Fix BuscadorGlobalView props
content = content.replace("clients={clients}", "")

with open("src/App.tsx", "w") as f:
    f.write(content)

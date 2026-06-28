import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix icon imports
if "Activity" not in content.split("from \"lucide-react\"")[0]:
    content = content.replace('import { ChevronDown, Search, Box } from "lucide-react";', 
                              'import { ChevronDown, Search, Box, Activity, Receipt, CreditCard, ArrowDownRight } from "lucide-react";')

# Fix ServiciosView props
content = content.replace("onDeleteExtraService={handleDeleteExtraService}", "")
content = content.replace("onDeleteServiceRate={handleDeleteServiceRate}", "")

# Fix BuscadorGlobalView props
# It has <BuscadorGlobalView \n reservations={reservations} \n invoices={invoices} \n clients={clients} \n />
# I will use a simple string replace
old_buscador = """<BuscadorGlobalView 
                      reservations={reservations} 
                      invoices={invoices} 
                      clients={clients}
                    />"""
new_buscador = """<BuscadorGlobalView 
                      reservations={reservations} 
                      invoices={invoices} 
                      boletos={boletos}
                      payableObligations={payableObligations}
                      onNavigate={setCurrentSection}
                    />"""
content = content.replace(old_buscador, new_buscador)

with open("src/App.tsx", "w") as f:
    f.write(content)

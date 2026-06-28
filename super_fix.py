import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove duplicate imports
content = content.replace('import { FlightTicket } from "./types/aereos";', '')
content = content.replace('import { ExtraService, ServiceRate } from "./types/producto";', '')
content = content.replace(', FlightTicket } from "./types"', ' } from "./types"')

# Add the correct imports cleanly
imports = """
import { FlightTicket } from "./types/aereos";
import { ExtraService, ServiceRate } from "./types/producto";
"""
content = imports + content

# Fix mapToOperationalTransfer
content = content.replace("mapToOperationalTransfer(res, transfers)", "mapToOperationalTransfer(res)")

# Fix VuelosView and CobranzasView props because my previous string replace failed
# Let's find VuelosView and replace the props
old_vuelos = """<VuelosView
                    flights={flights}
                    boletos={boletos}
                    onBoletosChange={setBoletos}
                    clients={clients}
                  />"""
new_vuelos = """<VuelosView
                    flights={flights}
                    boletos={boletos}
                    onAddBoleto={handleAddBoleto}
                    onUpdateBoleto={handleUpdateBoleto}
                    onDeleteBoleto={handleDeleteBoleto}
                    clients={clients}
                  />"""
content = content.replace(old_vuelos, new_vuelos)
# also if it was previously partially matched:
content = re.sub(r'<VuelosView[^>]+>', new_vuelos, content)

old_cobranzas = """<CobranzasView
                      clients={clients}
                    
                    onUpdateClient={handleUpdateClient}
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    reservations={reservations}
                    onAddInvoice={handleAddInvoice}
                  />"""
new_cobranzas = """<CobranzasView
                    clients={clients}
                    onUpdateClient={handleUpdateClient}
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    reservations={reservations}
                    onAddInvoice={handleAddInvoice}
                    vouchers={vouchers}
                    onAddVoucher={handleAddVoucher}
                    onUpdateVoucher={handleUpdateVoucher}
                  />"""
content = content.replace(old_cobranzas, new_cobranzas)

with open("src/App.tsx", "w") as f:
    f.write(content)

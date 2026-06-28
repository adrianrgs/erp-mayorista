import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add missing imports for types
imports = """
import { FlightTicket } from "./types/aereos";
import { ExtraService, ServiceRate } from "./types/producto";
"""
content = content.replace('import { ProjectView', imports + '\nimport { ProjectView')

# Fix VuelosView props
old_vuelos = """<VuelosView
                    flights={flights}
                    boletos={boletos}
                    onAddBoleto={handleAddBoleto}
                    onUpdateBoleto={handleUpdateBoleto}
                    onDeleteBoleto={handleDeleteBoleto}
                    
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

# Fix CobranzasView props
old_cobranzas = """<CobranzasView
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

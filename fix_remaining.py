import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix 1: Import FlightTicket
if "FlightTicket" not in content.split("} from")[0]:
    content = content.replace("PaymentVoucher } from", "PaymentVoucher, FlightTicket } from")

# Fix 2 & 3: VuelosView and CobranzasView props
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

# Fix 4: OperationalTransfer in handleUpdateTransfer
ops = """
  const operacionesTraslados = reservations.flatMap(res => mapToOperationalTransfer(res, transfers));
"""
if "operacionesTraslados =" not in content:
    content = content.replace("const handleUpdateTransfer =", ops + "\n  const handleUpdateTransfer =")

content = content.replace("transfers={transfers}\n                    onUpdateTransfer={handleUpdateTransfer}", "transfers={operacionesTraslados}\n                    onUpdateTransfer={handleUpdateTransfer}")

content = content.replace("const handleUpdateTransfer = (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")

old_handler = "const handleUpdateTransfer = async (updated: OperationalTransfer) => {\n    setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));\n  };"
new_handler = """const handleUpdateTransfer = async (updated: OperationalTransfer) => {
    const ts = mapToTransferService(updated);
    const existing = transfers.find(t => t.id === updated.id);
    if (existing) {
      setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));
      try { await updateTransferService(dataConnect, { ...ts }); } catch (e) {}
    } else {
      setTransfers(prev => [...prev, ts]);
      try { await insertTransferService(dataConnect, { ...ts }); } catch (e) {}
    }
  };"""
content = content.replace(old_handler, new_handler)

with open("src/App.tsx", "w") as f:
    f.write(content)

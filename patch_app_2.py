import re

with open("src/App.tsx", "r") as f:
    content = f.read()

sorted_vars_code = """
  // SORTING LOGIC (Newest modifications first)
  const sortByUpdated = (a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
  
  const sortedReservations = [...reservations].sort(sortByUpdated);
  const sortedBoletos = [...boletos].sort(sortByUpdated);
  const sortedInvoices = [...invoices].sort(sortByUpdated);
  const sortedClients = [...clients].sort(sortByUpdated);
  const sortedPayables = [...obligations].sort(sortByUpdated);
  const sortedTransfers = [...operacionesTraslados].sort(sortByUpdated);
"""

content = content.replace("  return (\n    <div className=\"min-h-screen", sorted_vars_code + "\n  return (\n    <div className=\"min-h-screen")

# Replace obligations in CuentasPorPagarView
content = content.replace("obligations={payableObligations}", "obligations={sortedPayables}")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")

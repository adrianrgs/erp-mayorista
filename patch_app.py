import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Inject updatedAt stamping into handleAdd and handleUpdate functions
def inject_updatedAt_stamp(match):
    func_decl = match.group(1)
    var_name = match.group(2)
    body = match.group(3)
    
    # If already injected, skip
    if "updatedAt = new Date().toISOString()" in body:
        return match.group(0)
    
    # We inject it right after the try { block if it exists, otherwise at the start of the function body
    if "try {" in body:
        return f"{func_decl} {var_name}) => {{\n    try {{\n      {var_name}.updatedAt = new Date().toISOString();" + body.split("try {", 1)[1]
    else:
        # Just put it at the very start of the body
        return f"{func_decl} {var_name}) => {{\n    {var_name}.updatedAt = new Date().toISOString();\n" + body[1:] # body starts with {\n...

# regex to find const handleAdd... = async (newRes: Type) => {
content = re.sub(r'(const handle(?:Add|Update)\w+\s*=\s*(?:async\s*)?\(\s*)([a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_]+\s*\)\s*=>\s*(\{)', inject_updatedAt_stamp, content)

# 2. Sort arrays before passing to Views
# Find where the views are rendered: e.g. <ReservasView reservations={reservations}
# Instead of replacing them all, it's easier to create sorted versions right before the return statement of App.

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

if "SORTING LOGIC" not in content:
    content = content.replace("  return (\n    <DialogProvider>", sorted_vars_code + "\n  return (\n    <DialogProvider>")

# Now replace the prop passing in the JSX
content = content.replace("reservations={reservations}", "reservations={sortedReservations}")
content = content.replace("boletos={boletos}", "boletos={sortedBoletos}")
content = content.replace("invoices={invoices}", "invoices={sortedInvoices}")
content = content.replace("clients={clients}", "clients={sortedClients}")
content = content.replace("obligations={obligations}", "obligations={sortedPayables}")
# content = content.replace("operacionesTraslados={operacionesTraslados}", "operacionesTraslados={sortedTransfers}")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")

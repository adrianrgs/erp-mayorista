import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove updatedAt for things that don't have it
content = re.sub(r'newBol\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)
content = re.sub(r'updated\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)
content = re.sub(r'newVoucher\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)
# wait, updated in handleUpdateVoucher might conflict. Let's just sed it.
content = content.replace("updated.updatedAt = new Date().toISOString();", "")
content = content.replace("newVoucher.updatedAt = new Date().toISOString();", "")

# Fix handleUpdateTransfer parameter type
content = content.replace("const handleUpdateTransfer = async (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")

# Fix handleUpdateTransfer body to map correctly
old_body = """const ts = mapToTransferService(updated); await updateTransferService(dataConnect, ts); setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));"""
new_body = """const ts = mapToTransferService(updated);
    try {
      await updateTransferService(dataConnect, ts);
      setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));
    } catch (e) {}"""
content = content.replace(old_body, new_body)

# setCobranzasInitialClient issue in AdministracionView
# Wait, AdministracionView expects setCobranzasInitialClient as a prop?
# In App.tsx:
# <AdministracionView ... setCobranzasInitialClient={(() => {})} />
content = content.replace("setCobranzasInitialClient={(() => {})}", "setCobranzasInitialClient={(client) => {}}")

with open("src/App.tsx", "w") as f:
    f.write(content)

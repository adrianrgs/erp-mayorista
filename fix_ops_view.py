import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add operacionesTraslados
computed = """
  // Compute operacionesTraslados
  const operacionesTraslados = reservations.flatMap(res => mapToOperationalTransfer(res, transfers));
"""
content = re.sub(r'(const handleUpdateTransfer = async \(updated: OperationalTransfer\) => \{)', computed + r'\n  \1', content)

# 2. Update the OperacionesView props
content = content.replace("transfers={transfers}", "transfers={operacionesTraslados}")

# 3. Update handleUpdateTransfer
old_handler = "const ts = mapToTransferService(updated); setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));"
new_handler = """
    updated.updatedAt = new Date().toISOString();
    const ts = mapToTransferService(updated);
    // If it's a new transfer, we need to insert it
    const existing = transfers.find(t => t.id === updated.id);
    if (existing) {
      setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));
      try { await updateTransferService(dataConnect, { ...ts }); } catch (e) { console.error(e); }
    } else {
      setTransfers(prev => [...prev, ts]);
      try { await insertTransferService(dataConnect, { ...ts }); } catch (e) { console.error(e); }
    }
"""
content = content.replace(old_handler, new_handler)

with open("src/App.tsx", "w") as f:
    f.write(content)

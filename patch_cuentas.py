import re

with open("src/views/CuentasPorPagarView.tsx", "r") as f:
    content = f.read()

# 1. Update state type
content = content.replace('useState<"obligaciones" | "proveedores">("obligaciones");', 'useState<"obligaciones" | "proveedores" | "pagadas">("obligaciones");')

# 2. Add Tab Button
btn_html = """          <button
            onClick={() => setActiveTab("pagadas")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pagadas" 
                ? "bg-zinc-950 text-white" 
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cuentas Pagadas
          </button>
"""
content = content.replace('Bandeja de Obligaciones\n          </button>', 'Bandeja de Obligaciones\n          </button>\n' + btn_html)

# 3. Update filteredObligations
old_filter = """  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      const matchesSearch ="""

new_filter = """  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      if (activeTab === "obligaciones" && o.status === "Pagado Total") return false;
      if (activeTab === "pagadas" && o.status !== "Pagado Total") return false;
      
      const matchesSearch ="""
content = content.replace(old_filter, new_filter)

# Also update dependency array for filteredObligations
content = content.replace('[obligations, searchQuery, statusFilter]);', '[obligations, searchQuery, statusFilter, activeTab]);')

# 4. Render datatable for both tabs
content = content.replace('{activeTab === "obligaciones" && (', '{(activeTab === "obligaciones" || activeTab === "pagadas") && (')

with open("src/views/CuentasPorPagarView.tsx", "w") as f:
    f.write(content)

print("Done")

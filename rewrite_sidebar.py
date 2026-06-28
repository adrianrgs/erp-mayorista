import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add the imports
imports = """
import ServiciosView from "./views/ServiciosView";
import BuscadorGlobalView from "./views/BuscadorGlobalView";
import { ChevronDown, Search, Box } from "lucide-react";
"""
content = content.replace('import CuentasPorPagarView from "./views/CuentasPorPagarView";', 'import CuentasPorPagarView from "./views/CuentasPorPagarView";\n' + imports)

# Add expanded state
state_str = """
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ comercial: true, operaciones: true, finanzas: true });
  const toggleMenu = (key: string) => setExpandedMenus(p => ({ ...p, [key]: !p[key] }));
"""
content = content.replace("const [isFase0SkeletonView, setIsFase0SkeletonView] = useState<boolean>(false);", "const [isFase0SkeletonView, setIsFase0SkeletonView] = useState<boolean>(false);\n" + state_str)

# Find the start and end of the <nav className="flex-1 space-y-1.5"> block
nav_start = content.find('<nav className="flex-1 space-y-1.5">')
nav_end = content.find('</nav>', nav_start) + 6

# The new sidebar
new_nav = """<nav className="flex-1 space-y-3 overflow-y-auto pb-6">
          {/* COMERCIAL & BOOKING */}
          <div className="px-1">
            <button onClick={() => toggleMenu('comercial')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Comercial & Booking</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.comercial ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.comercial && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-propiedades" onClick={() => setCurrentSection(ProjectView.PROPIEDADES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.PROPIEDADES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">1. Propiedades y Tarifas</span>
                </button>
                <button id="nav-servicios" onClick={() => setCurrentSection(ProjectView.SERVICIOS_VARIOS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.SERVICIOS_VARIOS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Box className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Servicios Varios (Producto)</span>
                </button>
                <button id="nav-reservas" onClick={() => setCurrentSection(ProjectView.RESERVAS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.RESERVAS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">2. Reservas (Booking)</span>
                </button>
                <button id="nav-clientes" onClick={() => setCurrentSection(ProjectView.CLIENTES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.CLIENTES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">6. Clientes B2B</span>
                </button>
                <button id="nav-buscador" onClick={() => setCurrentSection(ProjectView.BUSCADOR)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.BUSCADOR ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Buscador Global</span>
                </button>
              </div>
            )}
          </div>

          {/* OPERACIONES */}
          <div className="px-1">
            <button onClick={() => toggleMenu('operaciones')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Operaciones & Tráfico</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.operaciones ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.operaciones && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-vuelos" onClick={() => setCurrentSection(ProjectView.VUELOS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.VUELOS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Plane className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">3. Vuelos (Air Control)</span>
                </button>
                <button id="nav-operaciones" onClick={() => setCurrentSection(ProjectView.OPERACIONES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.OPERACIONES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">4. Ops. Receptivo</span>
                </button>
              </div>
            )}
          </div>

          {/* FINANZAS */}
          <div className="px-1">
            <button onClick={() => toggleMenu('finanzas')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Admin & Finanzas</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.finanzas ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.finanzas && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-admin" onClick={() => setCurrentSection(ProjectView.ADMINISTRACION)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.ADMINISTRACION ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Wallet className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">5. Administración/BI</span>
                </button>
                <button id="nav-facturacion" onClick={() => setCurrentSection(ProjectView.FACTURACION)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.FACTURACION ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Receipt className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">7. Dpto. Facturación</span>
                </button>
                <button id="nav-cobranzas" onClick={() => setCurrentSection(ProjectView.COBRANZAS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.COBRANZAS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">8. Cuentas por Cobrar</span>
                </button>
                <button id="nav-pagos" onClick={() => setCurrentSection(ProjectView.CUENTAS_PAGAR)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.CUENTAS_PAGAR ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <ArrowDownRight className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">9. Cuentas por Pagar</span>
                </button>
              </div>
            )}
          </div>
        </nav>"""

# Delete the "Departamentos ERP" header part too
header_start = content.rfind('<div className="px-1 mb-3">', 0, nav_start)
content = content[:header_start] + new_nav + content[nav_end:]

# Add the render blocks for ServiciosVarios and Buscador
render_blocks = """
                  {currentSection === ProjectView.SERVICIOS_VARIOS && (
                    <ServiciosView 
                      extraServices={extraServices}
                      onAddExtraService={handleAddExtraService}
                      onUpdateExtraService={handleUpdateExtraService}
                      onDeleteExtraService={handleDeleteExtraService}
                      serviceRates={serviceRates}
                      onAddServiceRate={handleAddServiceRate}
                      onUpdateServiceRate={handleUpdateServiceRate}
                      onDeleteServiceRate={handleDeleteServiceRate}
                    />
                  )}
                  {currentSection === ProjectView.BUSCADOR && (
                    <BuscadorGlobalView 
                      reservations={reservations} 
                      invoices={invoices} 
                      clients={clients}
                    />
                  )}
"""
content = content.replace('{currentSection === ProjectView.RESERVAS', render_blocks + '\n                  {currentSection === ProjectView.RESERVAS')

with open("src/App.tsx", "w") as f:
    f.write(content)

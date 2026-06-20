import React from "react";
import { 
  Building2, 
  Calendar, 
  Plane, 
  Route, 
  Wallet, 
  Compass, 
  Settings, 
  HelpCircle 
} from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans flex">
      {/* Sidebar Persistente */}
      <aside className="w-64 bg-[#0b1c30] border-r border-[#c3c6d7]/20 flex flex-col h-screen fixed left-0 top-0 text-white p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded bg-[#2563eb] flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Foratour ERP</h1>
            <p className="text-xs text-[#bec6e0]">Tourism Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <a href="/propiedades" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-[#bec6e0] hover:text-white">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Propiedades y Tarifas</span>
          </a>
          <a href="/reservas" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-[#bec6e0] hover:text-white">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Reservas</span>
          </a>
          <a href="/vuelos" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-[#bec6e0] hover:text-white">
            <Plane className="w-5 h-5" />
            <span className="text-sm font-medium">Vuelos</span>
          </a>
          <a href="/operaciones" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-[#bec6e0] hover:text-white">
            <Route className="w-5 h-5" />
            <span className="text-sm font-medium">Operaciones Terrestres</span>
          </a>
          <a href="/administracion" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-[#bec6e0] hover:text-white">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Administración y Finanzas</span>
          </a>
        </nav>

        <div className="border-t border-[#c3c6d7]/10 pt-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-[#bec6e0] hover:text-white">
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition text-sm text-[#bec6e0] hover:text-white">
            <HelpCircle className="w-5 h-5" />
            <span>Soporte</span>
          </a>
        </div>
      </aside>

      {/* Contenido Principal a la derecha */}
      <div className="flex-1 pl-64 min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-[#c3c6d7]/30 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Compass className="text-[#004ac6] w-6 h-6" />
            <span className="font-bold text-[#0b1c30]">Canal ERP Mayorista</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#dae2fd] text-[#004ac6] font-semibold flex items-center justify-center text-sm">
              JD
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

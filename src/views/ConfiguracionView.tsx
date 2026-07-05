import React, { useState } from "react";
import { CompanyConfig } from "../types";
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Layers
} from "lucide-react";

interface ConfiguracionViewProps {
  config: CompanyConfig;
  onUpdateConfig: (updated: CompanyConfig) => void;
}

type TabType = "empresa" | "usuarios" | "permisos" | "autorizaciones";

export default function ConfiguracionView({ config, onUpdateConfig }: ConfiguracionViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("empresa");
  const [formData, setFormData] = useState<CompanyConfig>({ ...config });
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>✓ Ajustes de la empresa guardados y propagados con éxito.</span>
        </div>
      )}

      {/* Title Header */}
      <div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Ajustes del Sistema</h2>
        <p className="text-xs text-zinc-450 mt-1">Configure los parámetros generales, datos oficiales y accesos de administración del ERP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Internal Navigation Tabs */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-lg p-4 space-y-2 shadow-xs">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block px-2 mb-2">Panel de Control</span>
          
          <button
            onClick={() => setActiveTab("empresa")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${
              activeTab === "empresa" 
                ? "bg-zinc-900 text-white shadow-xs" 
                : "text-zinc-550 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            <Building2 className="w-4.5 h-4.5" />
            <span className="text-xs">Datos de la Empresa</span>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-350 bg-zinc-50/20 cursor-not-allowed border border-dashed border-transparent"
            title="Funcionalidad futura para el superadministrador"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4.5 h-4.5" />
              <span className="text-xs">Usuarios y Accesos</span>
            </div>
            <Lock className="w-3 h-3 text-zinc-300" />
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-350 bg-zinc-50/20 cursor-not-allowed border border-dashed border-transparent"
            title="Funcionalidad futura para el superadministrador"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4.5 h-4.5" />
              <span className="text-xs">Permisos y Roles</span>
            </div>
            <Lock className="w-3 h-3 text-zinc-300" />
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-350 bg-zinc-50/20 cursor-not-allowed border border-dashed border-transparent"
            title="Funcionalidad futura para el superadministrador"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span className="text-xs">Autorizaciones</span>
            </div>
            <Lock className="w-3 h-3 text-zinc-300" />
          </button>

          <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 px-2 font-medium">
            💡 <span className="font-semibold text-zinc-500">Super Admin Mode:</span> Las pestañas marcadas con candado se habilitarán tras definir los flujos de autorización solicitados.
          </div>
        </div>

        {/* Right Column: Active Tab Content & Document Live Preview */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Form Area */}
          <div className="md:col-span-7 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
            <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-650" /> Datos de Identidad Corporativa
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-9">
                  <label htmlFor="name" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Nombre de la Empresa</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    autoComplete="organization"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="logoLetter" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Logo (Letra)</label>
                  <input
                    type="text"
                    id="logoLetter"
                    name="logoLetter"
                    required
                    maxLength={2}
                    value={formData.logoLetter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-bold text-center uppercase"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Giro Comercial / Subtítulo</label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  required
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="tagline" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Descripción del Negocio (Documentos)</label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={formData.tagline || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: Operador Mayorista de Turismo / Agencia de Viajes Minorista"
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Frase que aparece bajo el nombre en cotizaciones, vouchers y boletos. Ajústala según tu rol real (mayorista o minorista) en cada etapa del negocio.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rif" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">RIF / Identificación Fiscal</label>
                  <input
                    type="text"
                    id="rif"
                    name="rif"
                    required
                    value={formData.rif}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Teléfono de Contacto</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    required
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Dirección Fiscal / Corporativa</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5">Correo Electrónico de Facturación</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4 text-zinc-300" /> Guardar Ajustes
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Area */}
          <div className="md:col-span-5 space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block px-1">Previsualización en Documentos</span>
            
            {/* Header Document Mockup */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs relative overflow-hidden font-sans">
              <div className="absolute top-0 right-0 left-0 h-1 bg-zinc-900" />
              
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-right mb-4">Cabecera de Factura</div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase leading-none">{formData.name || "Sin Nombre"}</h1>
                    <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mt-1">{formData.subtitle || "Sin Subtítulo"}</p>
                    <p className="text-[9px] text-zinc-500 font-medium mt-1">{formData.tagline || formData.subtitle || "Sin Descripción"}</p>
                  </div>
                  <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                    {formData.logoLetter || "F"}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-600 space-y-0.5 border-t border-zinc-100 pt-3">
                  <p className="font-semibold"><span className="text-zinc-400">RIF:</span> {formData.rif || "Sin RIF"}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-zinc-400" /> <span className="line-clamp-2">{formData.address || "Sin Dirección"}</span></p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-400" /> <span>{formData.phone || "Sin Teléfono"}</span></p>
                  <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-400" /> <span className="break-all">{formData.email || "Sin Correo"}</span></p>
                </div>
              </div>
            </div>

            {/* Sidebar Logo Mockup */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 shadow-xs font-sans text-white">
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Estilo en Sidebar</div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-white text-zinc-950 flex items-center justify-center font-extrabold text-xl shadow-sm">
                  {formData.logoLetter || "F"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-bold text-sm tracking-tight leading-none text-white line-clamp-1">{formData.name || "Foratour ERP"}</h1>
                    <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-1 rounded-sm">V0</span>
                  </div>
                  <p className="text-[9px] text-zinc-550 font-medium mt-1 uppercase tracking-wider line-clamp-1">{formData.subtitle || "Wholesale Logistics"}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { CompanyConfig, ProjectView, CustomRate } from "../types";
import { getCurrencySymbol } from "../lib/taxEngine";
import {
  Usuario, Rol, ReglaAutorizacion, SolicitudAutorizacion, RegistroAuditoria,
  AccionPermiso, ACCIONES_POR_MODULO, NOMBRE_MODULO, NOMBRE_ACCION,
} from "../types/usuarios";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/ui/DialogProvider";
import { nextSequentialId } from "../lib/idGenerator";
import Button from "../components/ui/Button";
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle2,
  Save,
  Phone,
  Mail,
  MapPin,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  History,
  ShieldCheck,
  Coins,
  Eye,
  EyeOff,
} from "lucide-react";

interface ConfiguracionViewProps {
  config: CompanyConfig;
  onUpdateConfig: (updated: CompanyConfig) => void;
  usuarios: Usuario[];
  roles: Rol[];
  customRates: CustomRate[];
  onUpsertCustomRate: (rate: CustomRate) => void;
  onDeleteCustomRate: (id: string) => void;
  reglasAutorizacion: ReglaAutorizacion[];
  solicitudesAutorizacion: SolicitudAutorizacion[];
  registrosAuditoria: RegistroAuditoria[];
  onAddUsuario: (dto: { id: string; username: string; password: string; nombre: string; email: string; rolId: string }) => void;
  onUpdateUsuario: (id: string, dto: any) => void;
  onDeleteUsuario: (id: string) => void;
  onAddRol: (rol: Rol) => void;
  onUpdateRol: (rol: Rol) => void;
  onDeleteRol: (id: string) => void;
  onAddReglaAutorizacion: (regla: ReglaAutorizacion) => void;
  onUpdateReglaAutorizacion: (regla: ReglaAutorizacion) => void;
  onResolveSolicitudAutorizacion: (id: string, dto: { estado: "Aprobada" | "Rechazada"; comentarioResolucion?: string; resolutorId: string }) => void;
  onAddRegistroAuditoria: (registro: Omit<RegistroAuditoria, "id" | "createdAt">) => void;
}

type TabType = "empresa" | "tasas" | "usuarios" | "permisos" | "autorizaciones";

const MODULOS_CON_ACCIONES = Object.values(ProjectView).filter(v => ACCIONES_POR_MODULO[v]?.length > 0);

export default function ConfiguracionView({
  config, onUpdateConfig,
  customRates, onUpsertCustomRate, onDeleteCustomRate,
  usuarios, roles, reglasAutorizacion, solicitudesAutorizacion, registrosAuditoria,
  onAddUsuario, onUpdateUsuario, onDeleteUsuario, onAddRol, onUpdateRol, onDeleteRol,
  onAddReglaAutorizacion, onUpdateReglaAutorizacion, onResolveSolicitudAutorizacion, onAddRegistroAuditoria,
}: ConfiguracionViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("empresa");
  const [formData, setFormData] = useState<CompanyConfig>({ ...config });
  const [showToast, setShowToast] = useState(false);
  const { usuario: sesion } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nombreRol = (rolId: string) => roles.find(r => r.id === rolId)?.nombre || "Sin rol";

  return (
    <div className="space-y-6 font-sans relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>✓ Ajustes de la empresa guardados y propagados con éxito.</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Ajustes del Sistema</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure los parámetros generales, datos oficiales y accesos de administración del ERP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabs */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-lg p-4 space-y-2 shadow-xs">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block px-2 mb-2">Panel de Control</span>

          <button
            onClick={() => setActiveTab("empresa")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${activeTab === "empresa" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
          >
            <Building2 className="w-4.5 h-4.5" />
            <span className="text-xs">Datos de la Empresa</span>
          </button>

          <button
            onClick={() => setActiveTab("tasas")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${activeTab === "tasas" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span className="text-xs">Tasas de Cambio</span>
          </button>

          <button
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${activeTab === "usuarios" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="text-xs">Usuarios y Accesos</span>
          </button>

          <button
            onClick={() => setActiveTab("permisos")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${activeTab === "permisos" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span className="text-xs">Permisos y Roles</span>
          </button>

          <button
            onClick={() => setActiveTab("autorizaciones")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-semibold ${activeTab === "autorizaciones" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span className="text-xs">Autorizaciones</span>
          </button>

          <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 px-2 font-medium">
            Acceso exclusivo del rol Administrador. Los permisos que asigne acá determinan qué ve y qué puede hacer cada trabajador en el resto del sistema.
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-9">
          {activeTab === "empresa" && (
            <EmpresaTab formData={formData} onChange={handleInputChange} onSubmit={handleSubmit} />
          )}

          {activeTab === "tasas" && (
            <TasasTab
              customRates={customRates}
              onUpsertCustomRate={onUpsertCustomRate}
              onDeleteCustomRate={onDeleteCustomRate}
            />
          )}

          {activeTab === "usuarios" && (
            <div className="space-y-6">
              <AccesosMonitor usuarios={usuarios} roles={roles} />
              <UsuariosTab
                usuarios={usuarios}
                roles={roles}
                nombreRol={nombreRol}
                onAddUsuario={onAddUsuario}
                onUpdateUsuario={onUpdateUsuario}
                onDeleteUsuario={onDeleteUsuario}
                onAddRegistroAuditoria={onAddRegistroAuditoria}
                sesionUsuarioId={sesion?.id || ""}
              />
            </div>
          )}

          {activeTab === "permisos" && (
            <PermisosTab
              roles={roles}
              usuarios={usuarios}
              onAddRol={onAddRol}
              onUpdateRol={onUpdateRol}
              onDeleteRol={onDeleteRol}
              onAddRegistroAuditoria={onAddRegistroAuditoria}
              sesionUsuarioId={sesion?.id || ""}
              sesionUsuarioNombre={sesion?.nombre || ""}
            />
          )}

          {activeTab === "autorizaciones" && (
            <AutorizacionesTab
              roles={roles}
              reglasAutorizacion={reglasAutorizacion}
              solicitudesAutorizacion={solicitudesAutorizacion}
              registrosAuditoria={registrosAuditoria}
              onAddReglaAutorizacion={onAddReglaAutorizacion}
              onUpdateReglaAutorizacion={onUpdateReglaAutorizacion}
              onResolveSolicitudAutorizacion={onResolveSolicitudAutorizacion}
              onAddRegistroAuditoria={onAddRegistroAuditoria}
              sesion={sesion}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: TASAS DE CAMBIO PERSONALIZABLES ─────────────────────────────────────

const CURRENCY_OPTIONS = ["VES", "EUR", "COP", "PEN", "USD", "MXN", "CLP", "ARS", "BRL", "PAB"];

function TasasTab({ customRates, onUpsertCustomRate, onDeleteCustomRate }: {
  customRates: CustomRate[];
  onUpsertCustomRate: (rate: CustomRate) => void;
  onDeleteCustomRate: (id: string) => void;
}) {
  // Copia local editable; se re-sincroniza cuando cambian las tasas del backend/estado.
  const [rows, setRows] = useState<CustomRate[]>(customRates);
  useEffect(() => { setRows(customRates); }, [customRates]);

  const updateRow = (id: string, patch: Partial<CustomRate>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const addRow = () => {
    setRows(prev => [...prev, {
      id: "rate-" + Date.now().toString(36),
      label: "",
      fromCurrency: "USD",
      toCurrency: "VES",
      value: 0,
      showInHeader: true,
      sortOrder: prev.length,
    }]);
  };

  const visibles = rows.filter(r => r.showInHeader);

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-5">
      <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
        <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <Coins className="w-4 h-4 text-zinc-500" /> Tasas de Cambio Personalizables
        </h3>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar tasa
        </button>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Define tus propias tasas (BCV, Preferencial, Euro, etc.) como <b>1 origen = valor destino</b>
        (ej. 1 USD = 45,50 VES, o 1 EUR = 1,08 USD). Las marcadas con el ojo abierto se muestran en el
        header de toda la app. Se guardan en el backend.
      </p>

      {/* Vista previa del header */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Vista previa del header</span>
        {visibles.length === 0
          ? <span className="text-[11px] text-zinc-400 italic">Ninguna tasa visible</span>
          : visibles.map((r, i) => (
              <span key={r.id} className="font-mono text-[11px] text-zinc-700 flex items-center gap-1.5">
                {i > 0 && <span className="text-zinc-300 mr-2">|</span>}
                <span className="text-zinc-400 uppercase text-[9px]">{r.label || "—"}</span>
                1 {r.fromCurrency} = {getCurrencySymbol(r.toCurrency)} {(r.value || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </span>
            ))}
      </div>

      {/* Filas editables */}
      <div className="space-y-2.5">
        {rows.length === 0 && (
          <p className="text-[11px] text-zinc-400 italic py-4 text-center">Sin tasas. Agrega la primera con el botón de arriba.</p>
        )}
        {rows.map(rate => (
          <div key={rate.id} className="grid grid-cols-12 gap-2 items-end bg-zinc-50/60 border border-zinc-100 rounded-lg p-2.5">
            <div className="col-span-3">
              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block mb-0.5">Etiqueta</label>
              <input
                type="text"
                value={rate.label}
                placeholder="BCV, Preferencial..."
                onChange={e => updateRow(rate.id, { label: e.target.value })}
                className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block mb-0.5">1 (origen)</label>
              <select
                value={rate.fromCurrency}
                onChange={e => updateRow(rate.id, { fromCurrency: e.target.value })}
                className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500"
              >
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block mb-0.5">= Valor</label>
              <input
                type="number"
                step="0.0001"
                value={rate.value}
                onChange={e => updateRow(rate.id, { value: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block mb-0.5">Destino</label>
              <select
                value={rate.toCurrency}
                onChange={e => updateRow(rate.id, { toCurrency: e.target.value })}
                className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500"
              >
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-3 flex items-center justify-end gap-1.5">
              <button
                title={rate.showInHeader ? "Visible en header" : "Oculta del header"}
                onClick={() => updateRow(rate.id, { showInHeader: !rate.showInHeader })}
                className={`p-1.5 rounded cursor-pointer ${rate.showInHeader ? "text-emerald-600 bg-emerald-50" : "text-zinc-400 bg-zinc-100"}`}
              >
                {rate.showInHeader ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                title="Guardar"
                onClick={() => onUpsertCustomRate(rate)}
                className="p-1.5 rounded cursor-pointer text-white bg-zinc-900 hover:bg-zinc-800"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                title="Eliminar"
                onClick={() => onDeleteCustomRate(rate.id)}
                className="p-1.5 rounded cursor-pointer text-red-600 bg-red-50 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MONITOREO DE ACCESOS (movido desde Administración) ────────────────────────

function AccesosMonitor({ usuarios, roles }: { usuarios: Usuario[]; roles: Rol[] }) {
  const palette = ["bg-violet-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500", "bg-teal-500"];
  const grupos = roles
    .map((rol, idx) => {
      const delRol = usuarios.filter(u => u.rolId === rol.id);
      return { name: rol.nombre, active: delRol.filter(u => u.activo).length, total: delRol.length, color: palette[idx % palette.length] };
    })
    .filter(g => g.total > 0);
  const sinRol = usuarios.filter(u => !roles.some(r => r.id === u.rolId));
  if (sinRol.length > 0) {
    grupos.push({ name: "Sin rol asignado", active: sinRol.filter(u => u.activo).length, total: sinRol.length, color: "bg-zinc-400" });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-3">
      <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-100 pb-3">
        <Users className="w-4 h-4 text-zinc-500" /> Monitoreo de Accesos (Usuarios Activos)
      </h3>
      {grupos.length === 0 && (
        <p className="text-[11px] text-zinc-400 font-semibold italic">Sin usuarios registrados en el sistema.</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {grupos.map(g => (
          <div key={g.name} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-black text-zinc-600 leading-tight block">{g.name}</span>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-black text-zinc-900">
                <span className={`w-1.5 h-1.5 rounded-full ${g.color}`} /> {g.active} / {g.total}
              </span>
              <span className="text-[8px] bg-zinc-200 font-black px-1.5 py-0.5 text-zinc-500 rounded uppercase">Activos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: DATOS DE LA EMPRESA (sin cambios de comportamiento) ──────────────────

function EmpresaTab({ formData, onChange, onSubmit }: { formData: CompanyConfig; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
        <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-zinc-600" /> Datos de Identidad Corporativa
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-9">
              <label htmlFor="name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Nombre de la Empresa</label>
              <input type="text" id="name" name="name" required autoComplete="organization" value={formData.name} onChange={onChange}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="logoLetter" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Logo (Letra)</label>
              <input type="text" id="logoLetter" name="logoLetter" required maxLength={2} value={formData.logoLetter} onChange={onChange}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-bold text-center uppercase" />
            </div>
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Giro Comercial / Subtítulo</label>
            <input type="text" id="subtitle" name="subtitle" required value={formData.subtitle} onChange={onChange}
              className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
          </div>

          <div>
            <label htmlFor="tagline" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Descripción del Negocio (Documentos)</label>
            <input type="text" id="tagline" name="tagline" value={formData.tagline || ""} onChange={onChange}
              placeholder="Ej: Operador Mayorista de Turismo / Agencia de Viajes Minorista"
              className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
            <p className="text-[10px] text-zinc-400 mt-1">Frase que aparece bajo el nombre en cotizaciones, vouchers y boletos. Ajústala según tu rol real (mayorista o minorista) en cada etapa del negocio.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rif" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">RIF / Identificación Fiscal</label>
              <input type="text" id="rif" name="rif" required value={formData.rif} onChange={onChange}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Teléfono de Contacto</label>
              <input type="text" id="phone" name="phone" required autoComplete="tel" value={formData.phone} onChange={onChange}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Dirección Fiscal / Corporativa</label>
            <input type="text" id="address" name="address" required value={formData.address} onChange={onChange}
              className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
          </div>

          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Correo Electrónico de Facturación</label>
            <input type="email" id="email" name="email" required autoComplete="email" value={formData.email} onChange={onChange}
              className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold" />
          </div>

          <div>
            <label htmlFor="currency" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Moneda de Operación</label>
            <select id="currency" name="currency" value={formData.currency || "USD"} onChange={onChange as any}
              className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold">
              <option value="USD">Dólar estadounidense (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="VES">Bolívar (VES)</option>
              <option value="COP">Peso colombiano (COP)</option>
              <option value="PEN">Sol peruano (PEN)</option>
              <option value="MXN">Peso mexicano (MXN)</option>
              <option value="CLP">Peso chileno (CLP)</option>
              <option value="PAB">Balboa (PAB)</option>
            </select>
            <p className="text-[9px] text-zinc-400 mt-1">Moneda de las operaciones mayoristas. Lo fiscal local se deriva por tipo de cambio.</p>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full uppercase tracking-wider">
              <Save className="w-4 h-4 text-zinc-300" /> Guardar Ajustes
            </Button>
          </div>
        </form>
      </div>

      <div className="md:col-span-5 space-y-4">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block px-1">Previsualización en Documentos</span>

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
              <p className="text-[9px] text-zinc-500 font-medium mt-1 uppercase tracking-wider line-clamp-1">{formData.subtitle || "Wholesale Logistics"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: USUARIOS Y ACCESOS ────────────────────────────────────────────────

function UsuariosTab({
  usuarios, roles, nombreRol, onAddUsuario, onUpdateUsuario, onDeleteUsuario, onAddRegistroAuditoria, sesionUsuarioId,
}: {
  usuarios: Usuario[];
  roles: Rol[];
  nombreRol: (rolId: string) => string;
  onAddUsuario: (dto: { id: string; username: string; password: string; nombre: string; email: string; rolId: string }) => void;
  onUpdateUsuario: (id: string, dto: any) => void;
  onDeleteUsuario: (id: string) => void;
  onAddRegistroAuditoria: (registro: Omit<RegistroAuditoria, "id" | "createdAt">) => void;
  sesionUsuarioId: string;
}) {
  const { showConfirm } = useDialog();
  const emptyForm = { nombre: "", username: "", email: "", password: "", rolId: roles[0]?.id || "" };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, rolId: roles[0]?.id || "" });
    setShowForm(true);
  };

  const startEdit = (u: Usuario) => {
    setEditingId(u.id);
    setForm({ nombre: u.nombre, username: u.username, email: u.email, password: "", rolId: u.rolId });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const anterior = usuarios.find(u => u.id === editingId);
      const dto: any = { nombre: form.nombre, email: form.email, rolId: form.rolId };
      if (form.password) dto.password = form.password;
      onUpdateUsuario(editingId, dto);
      if (anterior && anterior.rolId !== form.rolId) {
        onAddRegistroAuditoria({
          tipo: "CambioRolUsuario",
          usuarioId: sesionUsuarioId,
          usuarioNombre: "Administrador",
          detalle: `Usuario "${form.nombre}" cambió de rol "${nombreRol(anterior.rolId)}" a "${nombreRol(form.rolId)}"`,
        });
      }
    } else {
      const id = nextSequentialId("USR", usuarios.map(u => u.id));
      onAddUsuario({ id, username: form.username, password: form.password || "cambiar123", nombre: form.nombre, email: form.email, rolId: form.rolId });
    }
    setShowForm(false);
  };

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
      <div className="2xl:col-span-7 bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-600" /> Usuarios del Sistema
          </h3>
          <Button onClick={startCreate} size="sm" className="uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> Nuevo Usuario
          </Button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100">
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Usuario</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-400 text-[11px]">Sin usuarios registrados todavía.</td></tr>
            )}
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-4 py-2.5 font-bold text-zinc-800">{u.nombre}</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">{u.username}</td>
                <td className="px-4 py-2.5 text-zinc-600 font-semibold">{nombreRol(u.rolId)}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onUpdateUsuario(u.id, { activo: !u.activo })}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-pointer ${u.activo ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => showConfirm({
                      title: "Eliminar Usuario",
                      message: `¿Estás seguro que deseas eliminar al usuario ${u.username}? Esta acción no se puede deshacer.`,
                      type: "danger",
                      confirmText: "Eliminar",
                      requireInputToConfirm: u.username,
                      onConfirm: () => onDeleteUsuario(u.id)
                    })}
                    className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="2xl:col-span-5 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs h-fit">
          <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4">
            {editingId ? "Editar Usuario" : "Nuevo Usuario"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
              <input type="text" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Usuario (login)</label>
              <input type="text" required disabled={!!editingId} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-mono disabled:bg-zinc-100 disabled:text-zinc-400" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Correo</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{editingId ? "Nueva Contraseña (opcional)" : "Contraseña Inicial"}</label>
              <input type="password" required={!editingId} placeholder={editingId ? "Dejar en blanco para no cambiarla" : ""} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Rol Asignado</label>
              <select required value={form.rolId} onChange={e => setForm(f => ({ ...f, rolId: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-semibold cursor-pointer">
                <option value="" disabled>-- Seleccione un rol --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1 uppercase tracking-wider">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 uppercase tracking-wider">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── TAB: PERMISOS Y ROLES ──────────────────────────────────────────────────

function PermisosTab({
  roles, usuarios, onAddRol, onUpdateRol, onDeleteRol, onAddRegistroAuditoria, sesionUsuarioId, sesionUsuarioNombre,
}: {
  roles: Rol[];
  usuarios: Usuario[];
  onAddRol: (rol: Rol) => void;
  onUpdateRol: (rol: Rol) => void;
  onDeleteRol: (id: string) => void;
  onAddRegistroAuditoria: (registro: Omit<RegistroAuditoria, "id" | "createdAt">) => void;
  sesionUsuarioId: string;
  sesionUsuarioNombre: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(roles[0]?.id || null);
  const [draft, setDraft] = useState<Rol | null>(null);

  const selectedRol = roles.find(r => r.id === selectedId) || null;
  const editing = draft || selectedRol;

  const selectRol = (r: Rol) => {
    setSelectedId(r.id);
    setDraft(null);
  };

  const startCreate = () => {
    const nuevo: Rol = { id: nextSequentialId("ROL", roles.map(r => r.id)), nombre: "", descripcion: "", esAdministrador: false, permisos: {} };
    setSelectedId(null);
    setDraft(nuevo);
  };

  const toggleAccion = (modulo: ProjectView, accion: AccionPermiso) => {
    if (!editing) return;
    const actuales = editing.permisos[modulo] || [];
    const nuevas = actuales.includes(accion) ? actuales.filter(a => a !== accion) : [...actuales, accion];
    setDraft({ ...editing, permisos: { ...editing.permisos, [modulo]: nuevas } });
  };

  const handleSave = () => {
    if (!editing || !editing.nombre.trim()) return;
    const yaExiste = roles.some(r => r.id === editing.id);
    if (yaExiste) {
      const anterior = roles.find(r => r.id === editing.id);
      onUpdateRol(editing);
      if (anterior && JSON.stringify(anterior.permisos) !== JSON.stringify(editing.permisos) || anterior?.esAdministrador !== editing.esAdministrador) {
        onAddRegistroAuditoria({
          tipo: "CambioPermisosRol",
          usuarioId: sesionUsuarioId,
          usuarioNombre: sesionUsuarioNombre,
          detalle: `Se actualizaron los permisos del rol "${editing.nombre}"`,
        });
      }
    } else {
      onAddRol(editing);
    }
    setSelectedId(editing.id);
    setDraft(null);
  };

  const handleDelete = (r: Rol) => {
    if (r.esAdministrador) return;
    if (usuarios.some(u => u.rolId === r.id)) return;
    onDeleteRol(r.id);
    if (selectedId === r.id) setSelectedId(roles.find(x => x.id !== r.id)?.id || null);
  };

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
      <div className="2xl:col-span-4 bg-white border border-zinc-200 rounded-lg shadow-xs p-4 space-y-2 h-fit">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest">Roles</h3>
          <Button onClick={startCreate} size="sm" className="uppercase tracking-wider">
            <Plus className="w-3 h-3" /> Nuevo
          </Button>
        </div>
        {roles.map(r => {
          const enUso = usuarios.some(u => u.rolId === r.id);
          return (
            <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${selectedId === r.id && !draft ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-700"}`} onClick={() => selectRol(r)}>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{r.nombre || "(Sin nombre)"}</p>
                {r.esAdministrador && <span className="text-[9px] uppercase tracking-wider opacity-70">Acceso total</span>}
              </div>
              {!r.esAdministrador && !enUso && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="p-1 rounded hover:bg-red-50 text-current hover:text-red-600 cursor-pointer flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {roles.length === 0 && !draft && <p className="text-[11px] text-zinc-400 px-2 py-3">Sin roles creados todavía.</p>}
      </div>

      <div className="2xl:col-span-8 bg-white border border-zinc-200 rounded-lg shadow-xs p-5">
        {!editing ? (
          <p className="text-xs text-zinc-400">Seleccione un rol de la lista o cree uno nuevo.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Nombre del Rol</label>
                <input type="text" value={editing.nombre} onChange={e => setDraft({ ...editing, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900 font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <input type="text" value={editing.descripcion || ""} onChange={e => setDraft({ ...editing, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-900" />
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
              <input type="checkbox" checked={editing.esAdministrador} onChange={e => setDraft({ ...editing, esAdministrador: e.target.checked })} className="w-4 h-4 cursor-pointer" />
              <span className="text-xs font-bold text-amber-800">Es Administrador (acceso irrestricto a todo, incluida esta pantalla)</span>
            </label>

            {!editing.esAdministrador && (
              <div className="border border-zinc-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-[9px] uppercase text-zinc-400 font-bold tracking-wider">
                      <th className="text-left px-3 py-2">Módulo</th>
                      {[AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR, AccionPermiso.APROBAR, AccionPermiso.ANULAR].map(a => (
                        <th key={a} className="text-center px-2 py-2">{NOMBRE_ACCION[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS_CON_ACCIONES.map(modulo => (
                      <tr key={modulo} className="border-t border-zinc-100">
                        <td className="px-3 py-2 font-semibold text-zinc-700">{NOMBRE_MODULO[modulo]}</td>
                        {[AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR, AccionPermiso.APROBAR, AccionPermiso.ANULAR].map(accion => {
                          const aplica = ACCIONES_POR_MODULO[modulo].includes(accion);
                          return (
                            <td key={accion} className="text-center px-2 py-2">
                              {aplica && (
                                <input
                                  type="checkbox"
                                  checked={editing.permisos[modulo]?.includes(accion) || false}
                                  onChange={() => toggleAccion(modulo, accion)}
                                  className="w-3.5 h-3.5 cursor-pointer"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              {draft && (
                <Button variant="secondary" onClick={() => setDraft(null)} className="uppercase tracking-wider">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} className="uppercase tracking-wider">
                <Save className="w-3.5 h-3.5" /> Guardar Rol
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB: AUTORIZACIONES ────────────────────────────────────────────────────

function AutorizacionesTab({
  roles, reglasAutorizacion, solicitudesAutorizacion, registrosAuditoria,
  onAddReglaAutorizacion, onUpdateReglaAutorizacion, onResolveSolicitudAutorizacion, onAddRegistroAuditoria,
  sesion,
}: {
  roles: Rol[];
  reglasAutorizacion: ReglaAutorizacion[];
  solicitudesAutorizacion: SolicitudAutorizacion[];
  registrosAuditoria: RegistroAuditoria[];
  onAddReglaAutorizacion: (regla: ReglaAutorizacion) => void;
  onUpdateReglaAutorizacion: (regla: ReglaAutorizacion) => void;
  onResolveSolicitudAutorizacion: (id: string, dto: { estado: "Aprobada" | "Rechazada"; comentarioResolucion?: string; resolutorId: string }) => void;
  onAddRegistroAuditoria: (registro: Omit<RegistroAuditoria, "id" | "createdAt">) => void;
  sesion: { id: string; nombre: string; rol: Rol } | null;
}) {
  const [nuevaRegla, setNuevaRegla] = useState<{ modulo: ProjectView | ""; accion: AccionPermiso | ""; rolAprobadorId: string }>({ modulo: "", accion: "", rolAprobadorId: roles.find(r => r.esAdministrador)?.id || roles[0]?.id || "" });

  const nombreRol = (id: string) => roles.find(r => r.id === id)?.nombre || "Sin rol";
  const nombreModulo = (m: ProjectView) => NOMBRE_MODULO[m];

  const handleCreateRegla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaRegla.modulo || !nuevaRegla.accion || !nuevaRegla.rolAprobadorId) return;
    onAddReglaAutorizacion({
      id: nextSequentialId("REGLA", reglasAutorizacion.map(r => r.id)),
      modulo: nuevaRegla.modulo,
      accion: nuevaRegla.accion,
      rolAprobadorId: nuevaRegla.rolAprobadorId,
      activa: true,
    });
    setNuevaRegla({ modulo: "", accion: "", rolAprobadorId: nuevaRegla.rolAprobadorId });
  };

  const pendientes = solicitudesAutorizacion.filter(s => s.estado === "Pendiente" && (sesion?.rol.esAdministrador || sesion?.rol.id === s.rolAprobadorId));

  const resolver = (s: SolicitudAutorizacion, estado: "Aprobada" | "Rechazada") => {
    if (!sesion) return;
    onResolveSolicitudAutorizacion(s.id, { estado, resolutorId: sesion.id });
    onAddRegistroAuditoria({
      tipo: "SolicitudResuelta",
      usuarioId: sesion.id,
      usuarioNombre: sesion.nombre,
      detalle: `${estado === "Aprobada" ? "Aprobó" : "Rechazó"} la solicitud de ${s.solicitanteNombre}: "${s.descripcion}"`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs p-5">
        <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-600" /> Reglas de Doble Aprobación
        </h3>
        <p className="text-[11px] text-zinc-400 mb-4">Defina qué acciones sensibles requieren aprobación de un rol superior cuando quien las intenta no tiene el permiso directo.</p>

        <form onSubmit={handleCreateRegla} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
          <select value={nuevaRegla.modulo} onChange={e => setNuevaRegla(f => ({ ...f, modulo: e.target.value as ProjectView, accion: "" }))} required
            className="px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none cursor-pointer">
            <option value="">-- Módulo --</option>
            {MODULOS_CON_ACCIONES.map(m => <option key={m} value={m}>{NOMBRE_MODULO[m]}</option>)}
          </select>
          <select value={nuevaRegla.accion} onChange={e => setNuevaRegla(f => ({ ...f, accion: e.target.value as AccionPermiso }))} required disabled={!nuevaRegla.modulo}
            className="px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none cursor-pointer disabled:bg-zinc-100">
            <option value="">-- Acción --</option>
            {nuevaRegla.modulo && ACCIONES_POR_MODULO[nuevaRegla.modulo].map(a => <option key={a} value={a}>{NOMBRE_ACCION[a]}</option>)}
          </select>
          <select value={nuevaRegla.rolAprobadorId} onChange={e => setNuevaRegla(f => ({ ...f, rolAprobadorId: e.target.value }))} required
            className="px-3 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none cursor-pointer">
            <option value="">-- Rol Aprobador --</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <Button type="submit" className="uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> Agregar Regla
          </Button>
        </form>

        <div className="space-y-2">
          {reglasAutorizacion.length === 0 && <p className="text-[11px] text-zinc-400">Sin reglas configuradas.</p>}
          {reglasAutorizacion.map(r => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <span className="font-semibold text-zinc-700">{nombreModulo(r.modulo)} → {NOMBRE_ACCION[r.accion]} <span className="text-zinc-400 font-normal">requiere aprobación de</span> {nombreRol(r.rolAprobadorId)}</span>
              <button
                onClick={() => onUpdateReglaAutorizacion({ ...r, activa: !r.activa })}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-pointer ${r.activa ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}
              >
                {r.activa ? "Activa" : "Inactiva"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs p-5">
        <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-600" /> Solicitudes Pendientes
        </h3>
        {pendientes.length === 0 && <p className="text-[11px] text-zinc-400">No hay solicitudes esperando su aprobación.</p>}
        <div className="space-y-2">
          {pendientes.map(s => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2.5 bg-amber-50/50 border border-amber-150 rounded-lg text-xs">
              <div>
                <p className="font-bold text-zinc-800">{s.descripcion}</p>
                <p className="text-[10px] text-zinc-400">Solicitado por {s.solicitanteNombre} — {new Date(s.createdAt).toLocaleString("es-ES")}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => resolver(s, "Rechazada")} className="p-1.5 rounded bg-white border border-zinc-200 hover:bg-red-50 hover:border-red-200 text-zinc-500 hover:text-red-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => resolver(s, "Aprobada")} className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs p-5">
        <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-600" /> Historial de Auditoría
        </h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100">
              <th className="text-left px-2 py-2">Tipo</th>
              <th className="text-left px-2 py-2">Usuario</th>
              <th className="text-left px-2 py-2">Detalle</th>
              <th className="text-left px-2 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {registrosAuditoria.length === 0 && (
              <tr><td colSpan={4} className="px-2 py-6 text-center text-zinc-400 text-[11px]">Sin actividad registrada todavía.</td></tr>
            )}
            {registrosAuditoria.map(r => (
              <tr key={r.id} className="border-b border-zinc-50">
                <td className="px-2 py-2 font-bold text-zinc-600">{r.tipo}</td>
                <td className="px-2 py-2 text-zinc-500">{r.usuarioNombre}</td>
                <td className="px-2 py-2 text-zinc-700">{r.detalle}</td>
                <td className="px-2 py-2 text-zinc-400 font-mono">{new Date(r.createdAt).toLocaleString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

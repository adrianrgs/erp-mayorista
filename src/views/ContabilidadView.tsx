import React, { useState } from "react";
import {
  Settings,
  TrendingUp,
  BookOpen,
  ShoppingCart,
  Scale,
  Percent,
  List,
  Plus,
  Save,
  X,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  TaxJurisdiction,
  JURISDICTION_PRESETS,
  DEFAULT_JURISDICTION,
  getOperatingCurrency,
  formatCurrency,
} from "../lib/taxEngine";
import { nextSequentialId } from "../lib/idGenerator";
import {
  ExchangeRate,
  WithholdingCertificate,
  JournalEntry,
  FinancialInvoice,
  PayableObligation,
} from "../types";

interface ContabilidadViewProps {
  jurisdiction: TaxJurisdiction;
  onSaveJurisdiction: (j: TaxJurisdiction) => void;
  exchangeRates: ExchangeRate[];
  onAddExchangeRate: (r: ExchangeRate) => void;
  withholdingCertificates: WithholdingCertificate[];
  journalEntries: JournalEntry[];
  invoices: FinancialInvoice[];
  payableObligations: PayableObligation[];
}

type TabId =
  | "config"
  | "exchange"
  | "sales"
  | "purchases"
  | "withholding"
  | "surcharge"
  | "journal";

const TABS: { id: TabId; label: string; icon: React.ReactNode; condition?: (j: TaxJurisdiction) => boolean }[] = [
  { id: "config",     label: "Configuración Fiscal", icon: <Settings className="w-3.5 h-3.5" /> },
  { id: "exchange",   label: "Tipo de Cambio",        icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "sales",      label: "Registro de Ventas",    icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "purchases",  label: "Registro de Compras",   icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { id: "withholding",label: "Retenciones",           icon: <Scale className="w-3.5 h-3.5" />, condition: j => j.hasWithholding },
  { id: "surcharge",  label: "Recargos",              icon: <Percent className="w-3.5 h-3.5" />, condition: j => j.hasSurcharge },
  { id: "journal",    label: "Libro Diario",          icon: <List className="w-3.5 h-3.5" /> },
];

const COUNTRY_LABELS: Record<string, string> = {
  VE: "Venezuela",
  CO: "Colombia",
  PE: "Perú",
  PA: "Panamá",
  MX: "México",
  ES: "España",
  CL: "Chile",
  US: "Estados Unidos",
};

export default function ContabilidadView({
  jurisdiction,
  onSaveJurisdiction,
  exchangeRates,
  onAddExchangeRate,
  withholdingCertificates,
  journalEntries,
  invoices,
  payableObligations,
}: ContabilidadViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("config");
  const [periodFilter, setPeriodFilter] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
  });

  // Config tab state
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<TaxJurisdiction>({ ...jurisdiction });

  // Exchange rate tab state
  const [rateForm, setRateForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    rate: "",
  });
  const [showRateForm, setShowRateForm] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRate = exchangeRates.find(
    r => r.date === todayStr && r.toCurrency === jurisdiction.localCurrency
  );

  const visibleTabs = TABS.filter(t => !t.condition || t.condition(jurisdiction));

  // Helpers
  const filterByPeriod = <T extends { date: string }>(list: T[]) => {
    if (!periodFilter) return list;
    const [month, year] = periodFilter.split("-");
    return list.filter(item => item.date?.startsWith(`${year}-${month}`));
  };

  const exportCSV = (rows: string[][], filename: string) => {
    const content = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-zinc-950">
              Contabilidad y Fiscal
            </h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {COUNTRY_LABELS[jurisdiction.country] ?? jurisdiction.country} ·{" "}
              {jurisdiction.taxName} {(jurisdiction.taxRate * 100).toFixed(0)}%
              {jurisdiction.hasSurcharge && ` · ${jurisdiction.surchargeName} ${((jurisdiction.surchargeRate ?? 0) * 100).toFixed(0)}%`}
              {jurisdiction.hasWithholding && ` · ${jurisdiction.withholdingLabel}`}
            </p>
          </div>
          {!todayRate && jurisdiction.localCurrency !== getOperatingCurrency() && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-[10px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Sin tasa {jurisdiction.exchangeRateLabel} hoy — facturas pendientes pueden no calcular monto en {jurisdiction.localCurrency}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ─── TAB: Configuración Fiscal ───────────────────────────────────── */}
        {activeTab === "config" && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-zinc-800">Configuración de Jurisdicción Fiscal</h2>
              {!editingConfig ? (
                <button
                  onClick={() => { setConfigForm({ ...jurisdiction }); setEditingConfig(true); }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[9px] font-bold uppercase"
                >
                  Editar Configuración
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onSaveJurisdiction(configForm); setEditingConfig(false); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded text-[9px] font-bold uppercase"
                  >
                    <Save className="w-3 h-3" /> Guardar
                  </button>
                  <button
                    onClick={() => setEditingConfig(false)}
                    className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded text-[9px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Preset selector */}
            {editingConfig && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="text-[10px] font-black uppercase text-indigo-700 block mb-2">
                  Cargar Preset por País
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JURISDICTION_PRESETS).map(([code, preset]) => (
                    <button
                      key={code}
                      onClick={() => setConfigForm({ ...configForm, ...preset, country: code })}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase border transition-all ${
                        configForm.country === code
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                      }`}
                    >
                      {COUNTRY_LABELS[code] ?? code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Config fields */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: "taxName", label: "Nombre del Impuesto", placeholder: "IVA / VAT / IGV" },
                  { field: "taxIdLabel", label: "Etiqueta ID Fiscal", placeholder: "RIF / NIT / RUC" },
                  { field: "fiscalDocLabel", label: "N° Documento Fiscal", placeholder: "N° Control / CUFE" },
                  { field: "localCurrency", label: "Moneda Local", placeholder: "VES / COP / PEN" },
                  { field: "exchangeRateLabel", label: "Fuente Tipo de Cambio", placeholder: "BCV / TRM / Manual" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">{label}</label>
                    {editingConfig ? (
                      <input
                        type="text"
                        value={(configForm as any)[field] ?? ""}
                        onChange={e => setConfigForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-zinc-800">{(jurisdiction as any)[field] || "—"}</p>
                    )}
                  </div>
                ))}

                {/* Tax rates */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Tasa General (%)</label>
                  {editingConfig ? (
                    <input
                      type="number"
                      value={configForm.taxRate * 100}
                      onChange={e => setConfigForm(f => ({ ...f, taxRate: Number(e.target.value) / 100 }))}
                      className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-zinc-800">{(jurisdiction.taxRate * 100).toFixed(1)}%</p>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Tasa Reducida / Exenta (%)</label>
                  {editingConfig ? (
                    <input
                      type="number"
                      value={configForm.reducedTaxRate * 100}
                      onChange={e => setConfigForm(f => ({ ...f, reducedTaxRate: Number(e.target.value) / 100 }))}
                      className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-zinc-800">{(jurisdiction.reducedTaxRate * 100).toFixed(1)}%</p>
                  )}
                </div>
              </div>

              {/* Feature flags */}
              <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { flag: "hasSurcharge", label: "Recargo por método de pago", sub: "surchargeName, surchargeRate" },
                  { flag: "hasWithholding", label: "Agentes de retención", sub: "withholdingLabel, vatWithholdingOptions" },
                  { flag: "hasExemptZone", label: "Zona exenta / Puerto Libre", sub: "exemptZoneLabel" },
                ].map(({ flag, label, sub }) => (
                  <div key={flag} className={`p-3 rounded-md border ${(editingConfig ? configForm : jurisdiction)[flag as keyof TaxJurisdiction] ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2">
                      {editingConfig ? (
                        <input
                          type="checkbox"
                          checked={!!(configForm as any)[flag]}
                          onChange={e => setConfigForm(f => ({ ...f, [flag]: e.target.checked }))}
                          className="rounded border-zinc-300"
                        />
                      ) : (
                        (jurisdiction as any)[flag]
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          : <X className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span className="text-[10px] font-bold text-zinc-700">{label}</span>
                    </div>
                    <p className="text-[8.5px] text-zinc-400 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Surcharge detail */}
              {(editingConfig ? configForm.hasSurcharge : jurisdiction.hasSurcharge) && (
                <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Nombre del Recargo</label>
                    {editingConfig ? (
                      <input type="text" value={configForm.surchargeName ?? ""} onChange={e => setConfigForm(f => ({ ...f, surchargeName: e.target.value }))} className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5" placeholder="IGTF" />
                    ) : (
                      <p className="text-xs font-semibold text-zinc-800">{jurisdiction.surchargeName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Tasa del Recargo (%)</label>
                    {editingConfig ? (
                      <input type="number" value={(configForm.surchargeRate ?? 0) * 100} onChange={e => setConfigForm(f => ({ ...f, surchargeRate: Number(e.target.value) / 100 }))} className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5" />
                    ) : (
                      <p className="text-xs font-semibold text-zinc-800">{((jurisdiction.surchargeRate ?? 0) * 100).toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: Tipo de Cambio ─────────────────────────────────────────── */}
        {activeTab === "exchange" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-zinc-800">
                Historial — Tasa {jurisdiction.exchangeRateLabel}
              </h2>
              <button
                onClick={() => setShowRateForm(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[9px] font-bold uppercase"
              >
                <Plus className="w-3 h-3" /> Registrar Tasa
              </button>
            </div>

            {showRateForm && (
              <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={rateForm.date}
                      onChange={e => setRateForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">
                      Tasa USD → {jurisdiction.localCurrency}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateForm.rate}
                      onChange={e => setRateForm(f => ({ ...f, rate: e.target.value }))}
                      placeholder="46.30"
                      className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!rateForm.rate) return;
                      const newRate: ExchangeRate = {
                        id: nextSequentialId("ER", exchangeRates.map(r => r.id)),
                        date: rateForm.date,
                        fromCurrency: getOperatingCurrency(),
                        toCurrency: jurisdiction.localCurrency,
                        rate: Number(rateForm.rate),
                        source: jurisdiction.exchangeRateLabel,
                        updatedAt: new Date().toISOString(),
                      };
                      onAddExchangeRate(newRate);
                      setShowRateForm(false);
                      setRateForm({ date: new Date().toISOString().slice(0, 10), rate: "" });
                    }}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded text-[9px] font-bold uppercase"
                  >
                    Guardar
                  </button>
                  <button onClick={() => setShowRateForm(false)} className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded text-[9px] font-bold uppercase">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Today highlight */}
            {todayRate && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-bold uppercase text-emerald-700 block">Tasa registrada hoy ({todayStr})</span>
                  <span className="font-black text-emerald-800 font-mono">
                    1 USD = {todayRate.rate.toLocaleString("es-ES", { minimumFractionDigits: 2 })} {jurisdiction.localCurrency}
                  </span>
                  <span className="text-[9px] text-emerald-600 ml-2">· Fuente: {todayRate.source}</span>
                </div>
              </div>
            )}

            {/* Rate history table */}
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Par</th>
                    <th className="px-4 py-3 text-right">Tasa</th>
                    <th className="px-4 py-3">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[...exchangeRates]
                    .filter(r => r.toCurrency === jurisdiction.localCurrency)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 60)
                    .map(r => (
                      <tr key={r.id} className={`hover:bg-zinc-50 ${r.date === todayStr ? "bg-emerald-50/60" : ""}`}>
                        <td className="px-4 py-2.5 font-mono text-zinc-700">{r.date}</td>
                        <td className="px-4 py-2.5 text-zinc-500">USD → {r.toCurrency}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-900">
                          {r.rate.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500">{r.source}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {exchangeRates.filter(r => r.toCurrency === jurisdiction.localCurrency).length === 0 && (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  No hay tasas registradas para {jurisdiction.localCurrency}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: Registro de Ventas ─────────────────────────────────────── */}
        {activeTab === "sales" && (() => {
          const filteredInvoices = filterByPeriod(
            invoices.filter(i => i.type === "Cobro" && i.amount > 0)
          );
          const totalBase = filteredInvoices.reduce((s, i) => s + (i.taxableBase ?? i.amount), 0);
          const totalVAT  = filteredInvoices.reduce((s, i) => s + (i.vatAmount ?? 0), 0);
          const totalSurcharge = filteredInvoices.reduce((s, i) => s + (i.surchargeAmount ?? 0), 0);
          const totalLocal = filteredInvoices.reduce((s, i) => s + (i.localCurrencyAmount ?? 0), 0);
          return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-zinc-800">
                {jurisdiction.country === "VE" ? "Libro de Ventas" : "Registro de Ventas"}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={periodFilter ? `${periodFilter.split("-")[1]}-${periodFilter.split("-")[0]}` : ""}
                  onChange={e => {
                    if (e.target.value) {
                      const [y, m] = e.target.value.split("-");
                      setPeriodFilter(`${m}-${y}`);
                    }
                  }}
                  className="text-xs border border-zinc-200 rounded px-2 py-1.5"
                />
                <button
                  onClick={() => {
                    const rows = filteredInvoices.map(inv => [
                      inv.date, inv.id, inv.clientName,
                      String(inv.taxableBase ?? inv.amount),
                      String(inv.vatAmount),
                      String(inv.surchargeAmount ?? 0),
                      String(inv.amount + inv.vatAmount),
                      jurisdiction.localCurrency !== getOperatingCurrency() ? String(inv.localCurrencyAmount ?? "") : "",
                    ]);
                    exportCSV(
                      [["Fecha", "N° Doc", "Cliente", `Base ${jurisdiction.taxName}`, jurisdiction.taxName, jurisdiction.surchargeName ?? "", "Total USD", `Total ${jurisdiction.localCurrency}`], ...rows],
                      `registro-ventas-${periodFilter}.csv`
                    );
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded text-[9px] font-bold uppercase"
                >
                  <Download className="w-3 h-3" /> Exportar CSV
                </button>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">{jurisdiction.fiscalDocLabel}</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3 text-right">Base {jurisdiction.taxName}</th>
                        <th className="px-4 py-3 text-right">{jurisdiction.taxName}</th>
                        {jurisdiction.hasSurcharge && <th className="px-4 py-3 text-right">{jurisdiction.surchargeName}</th>}
                        <th className="px-4 py-3 text-right">Total {getOperatingCurrency()}</th>
                        {jurisdiction.localCurrency !== getOperatingCurrency() && <th className="px-4 py-3 text-right">Total {jurisdiction.localCurrency}</th>}
                        <th className="px-4 py-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 font-mono text-zinc-700">{inv.date}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-600 text-[10px]">{inv.fiscalDocNumber ?? inv.id}</td>
                          <td className="px-4 py-2.5 text-zinc-800 max-w-[200px] truncate">{inv.clientName}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCurrency((inv.taxableBase ?? inv.amount), getOperatingCurrency())}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCurrency((inv.vatAmount ?? 0), getOperatingCurrency())}</td>
                          {jurisdiction.hasSurcharge && <td className="px-4 py-2.5 text-right font-mono">{formatCurrency((inv.surchargeAmount ?? 0), getOperatingCurrency())}</td>}
                          <td className="px-4 py-2.5 text-right font-mono font-bold">{formatCurrency(inv.amount, getOperatingCurrency())}</td>
                          {jurisdiction.localCurrency !== getOperatingCurrency() && (
                            <td className="px-4 py-2.5 text-right font-mono text-indigo-700">
                              {inv.localCurrencyAmount ? inv.localCurrencyAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 }) : "—"}
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              inv.status === "Pagado" ? "bg-emerald-100 text-emerald-700" :
                              inv.status === "Vencido" ? "bg-red-100 text-red-700" :
                              "bg-zinc-100 text-zinc-600"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-50 border-t-2 border-zinc-200 font-black text-xs">
                        <td colSpan={3} className="px-4 py-3 text-zinc-600 uppercase text-[9px] tracking-wider">
                          Totales del período {periodFilter}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalBase, getOperatingCurrency())}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalVAT, getOperatingCurrency())}</td>
                        {jurisdiction.hasSurcharge && <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalSurcharge, getOperatingCurrency())}</td>}
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency((totalBase + totalVAT + totalSurcharge), getOperatingCurrency())}</td>
                        {jurisdiction.localCurrency !== getOperatingCurrency() && (
                          <td className="px-4 py-3 text-right font-mono text-indigo-700">
                            {totalLocal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                          </td>
                        )}
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-10 text-zinc-400 text-xs">Sin facturas para el período {periodFilter}</div>
                  )}
                </div>
          </div>
          );
        })()}

        {/* ─── TAB: Registro de Compras ────────────────────────────────────── */}
        {activeTab === "purchases" && (() => {
          const filteredObligations = filterByPeriod(
            payableObligations
              .filter(o => o.status !== "Congelado")
              .map(o => ({ ...o, date: o.date ?? o.dueDate }))
          );
          const totalNeto = filteredObligations.reduce((s, o) => s + o.netCost, 0);
          const totalIVACredito = filteredObligations.reduce((s, o) => s + Math.round(o.netCost * jurisdiction.taxRate * 100) / 100, 0);
          return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-zinc-800">
                {jurisdiction.country === "VE" ? "Libro de Compras" : "Registro de Compras"}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={periodFilter ? `${periodFilter.split("-")[1]}-${periodFilter.split("-")[0]}` : ""}
                  onChange={e => {
                    if (e.target.value) {
                      const [y, m] = e.target.value.split("-");
                      setPeriodFilter(`${m}-${y}`);
                    }
                  }}
                  className="text-xs border border-zinc-200 rounded px-2 py-1.5"
                />
                <button
                  onClick={() => {
                    const rows = filteredObligations.map(o => [
                      o.date ?? o.dueDate, o.providerName, o.serviceDetail,
                      String(o.netCost),
                      String(Math.round(o.netCost * jurisdiction.taxRate * 100) / 100),
                      String(o.netCost + Math.round(o.netCost * jurisdiction.taxRate * 100) / 100),
                      o.status,
                    ]);
                    exportCSV(
                      [["Fecha", "Proveedor", "Concepto", `Neto USD`, `${jurisdiction.taxName} Crédito`, "Total USD", "Estado"], ...rows],
                      `registro-compras-${periodFilter}.csv`
                    );
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded text-[9px] font-bold uppercase"
                >
                  <Download className="w-3 h-3" /> Exportar CSV
                </button>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3">Concepto / Localizador</th>
                    <th className="px-4 py-3 text-right">Neto {getOperatingCurrency()}</th>
                    <th className="px-4 py-3 text-right">{jurisdiction.taxName} Crédito</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredObligations.map(o => {
                    const ivaCredito = Math.round(o.netCost * jurisdiction.taxRate * 100) / 100;
                    return (
                      <tr key={o.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2.5 font-mono text-zinc-700">{o.date ?? o.dueDate}</td>
                        <td className="px-4 py-2.5 text-zinc-800 font-semibold max-w-[140px] truncate">{o.providerName}</td>
                        <td className="px-4 py-2.5 text-zinc-500 max-w-[180px] truncate">
                          {o.serviceDetail}
                          {o.locatorId && <span className="ml-1 text-[9px] text-zinc-400 font-mono">· {o.locatorId}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(o.netCost, getOperatingCurrency())}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{formatCurrency(ivaCredito, getOperatingCurrency())}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">{formatCurrency((o.netCost + ivaCredito), getOperatingCurrency())}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            o.status === "Pagado Total" ? "bg-emerald-100 text-emerald-700" :
                            o.status === "Vencido" ? "bg-red-100 text-red-700" :
                            o.status === "Pagado Parcial" ? "bg-amber-100 text-amber-700" :
                            "bg-zinc-100 text-zinc-600"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 border-t-2 border-zinc-200 font-black text-xs">
                    <td colSpan={3} className="px-4 py-3 text-zinc-600 uppercase text-[9px] tracking-wider">
                      Totales del período {periodFilter}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalNeto, getOperatingCurrency())}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{formatCurrency(totalIVACredito, getOperatingCurrency())}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency((totalNeto + totalIVACredito), getOperatingCurrency())}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              {filteredObligations.length === 0 && (
                <div className="text-center py-10 text-zinc-400 text-xs">Sin obligaciones para el período {periodFilter}</div>
              )}
            </div>
            <p className="text-[10px] text-zinc-400">
              Datos sincronizados desde Tesorería → Obligaciones. El {jurisdiction.taxName} crédito es estimado ({(jurisdiction.taxRate * 100).toFixed(0)}%) — ajusta según la factura real del proveedor.
            </p>
          </div>
          );
        })()}

        {/* ─── TAB: Retenciones ────────────────────────────────────────────── */}
        {activeTab === "withholding" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-zinc-800">
                Registro de Retenciones — {jurisdiction.withholdingLabel}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={periodFilter ? `${periodFilter.split("-")[1]}-${periodFilter.split("-")[0]}` : ""}
                  onChange={e => {
                    if (e.target.value) {
                      const [y, m] = e.target.value.split("-");
                      setPeriodFilter(`${m}-${y}`);
                    }
                  }}
                  className="text-xs border border-zinc-200 rounded px-2 py-1.5"
                />
              </div>
            </div>

            {(() => {
              const certs = withholdingCertificates.filter(c => !periodFilter || c.period === periodFilter);
              const totalWithheld = certs.reduce((s, c) => s + c.amountWithheld, 0);

              return (
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                        <th className="px-4 py-3">N° Comprobante</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">{jurisdiction.taxIdLabel} Cliente</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right">%</th>
                        <th className="px-4 py-3 text-right">Base</th>
                        <th className="px-4 py-3 text-right">Retenido</th>
                        <th className="px-4 py-3">Factura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {certs.map(c => (
                        <tr key={c.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 font-mono text-indigo-700 font-bold">{c.number}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-600">{c.date}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-600">{c.clientTaxId}</td>
                          <td className="px-4 py-2.5 text-zinc-800">{c.clientName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${c.type === "VAT" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                              {c.type === "VAT" ? jurisdiction.taxName : jurisdiction.incomeTaxWithholdingLabel ?? "Renta"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">{c.percentage}%</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(c.taxableBase, getOperatingCurrency())}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-red-650">{formatCurrency(c.amountWithheld, getOperatingCurrency())}</td>
                          <td className="px-4 py-2.5 text-zinc-500 text-[10px]">{c.invoiceId ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    {certs.length > 0 && (
                      <tfoot>
                        <tr className="bg-zinc-50 border-t-2 border-zinc-200 font-black text-xs">
                          <td colSpan={7} className="px-4 py-3 text-zinc-600 uppercase text-[9px] tracking-wider">
                            Total retenido período {periodFilter}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-red-700">{formatCurrency(totalWithheld, getOperatingCurrency())}</td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {certs.length === 0 && (
                    <div className="text-center py-10 text-zinc-400 text-xs">Sin comprobantes de retención para el período {periodFilter}</div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── TAB: Recargos ───────────────────────────────────────────────── */}
        {activeTab === "surcharge" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-zinc-800">
                Relación de {jurisdiction.surchargeName} — {(((jurisdiction.surchargeRate ?? 0)) * 100).toFixed(0)}%
              </h2>
              <input
                type="month"
                value={periodFilter ? `${periodFilter.split("-")[1]}-${periodFilter.split("-")[0]}` : ""}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split("-");
                    setPeriodFilter(`${m}-${y}`);
                  }
                }}
                className="text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>

            {(() => {
              const withSurcharge = filterByPeriod(invoices.filter(i => (i.surchargeAmount ?? 0) > 0 && i.type === "Cobro"));
              const totalSurcharge = withSurcharge.reduce((s, i) => s + (i.surchargeAmount ?? 0), 0);

              return (
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Referencia</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Método de Pago</th>
                        <th className="px-4 py-3 text-right">Monto Operación</th>
                        <th className="px-4 py-3 text-right">{jurisdiction.surchargeName} {((jurisdiction.surchargeRate ?? 0) * 100).toFixed(0)}%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {withSurcharge.map(inv => (
                        <tr key={inv.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 font-mono text-zinc-700">{inv.date}</td>
                          <td className="px-4 py-2.5 font-mono text-zinc-600 text-[10px]">{inv.id}</td>
                          <td className="px-4 py-2.5 text-zinc-800 max-w-[180px] truncate">{inv.clientName}</td>
                          <td className="px-4 py-2.5 text-zinc-600">{inv.paymentMethod ?? "—"}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(inv.amount, getOperatingCurrency())}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700">{formatCurrency((inv.surchargeAmount ?? 0), getOperatingCurrency())}</td>
                        </tr>
                      ))}
                    </tbody>
                    {withSurcharge.length > 0 && (
                      <tfoot>
                        <tr className="bg-zinc-50 border-t-2 border-zinc-200 font-black text-xs">
                          <td colSpan={5} className="px-4 py-3 text-zinc-600 uppercase text-[9px] tracking-wider">
                            Total {jurisdiction.surchargeName} período {periodFilter}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-amber-700">{formatCurrency(totalSurcharge, getOperatingCurrency())}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {withSurcharge.length === 0 && (
                    <div className="text-center py-10 text-zinc-400 text-xs">
                      Sin operaciones con {jurisdiction.surchargeName} para el período {periodFilter}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── TAB: Libro Diario ───────────────────────────────────────────── */}
        {activeTab === "journal" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-zinc-800">Libro Diario — Asientos Contables</h2>
              <input
                type="month"
                value={periodFilter ? `${periodFilter.split("-")[1]}-${periodFilter.split("-")[0]}` : ""}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split("-");
                    setPeriodFilter(`${m}-${y}`);
                  }
                }}
                className="text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>

            {filterByPeriod(journalEntries).length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-400 text-xs">
                Sin asientos contables para el período {periodFilter}
              </div>
            ) : (
              <div className="space-y-3">
                {filterByPeriod(journalEntries)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(entry => (
                    <div key={entry.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                      <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-500">{entry.date}</span>
                          <span className="px-1.5 py-0.5 bg-zinc-200 rounded text-[8px] font-bold uppercase text-zinc-600">{entry.type}</span>
                          <span className="text-xs font-semibold text-zinc-800">{entry.description}</span>
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono">
                          Ref: {entry.reference} · TC: {entry.exchangeRate}
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100">
                            <th className="px-4 py-2">Cuenta</th>
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2 text-right">Débito {getOperatingCurrency()}</th>
                            <th className="px-4 py-2 text-right">Crédito {getOperatingCurrency()}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {entry.lines.map((line, i) => (
                            <tr key={i} className="hover:bg-zinc-50">
                              <td className="px-4 py-2 font-mono text-zinc-600">{line.account}</td>
                              <td className="px-4 py-2 text-zinc-800">{line.name}</td>
                              <td className="px-4 py-2 text-right font-mono">{line.debit > 0 ? `${formatCurrency(line.debit, getOperatingCurrency())}` : "—"}</td>
                              <td className="px-4 py-2 text-right font-mono">{line.credit > 0 ? `${formatCurrency(line.credit, getOperatingCurrency())}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

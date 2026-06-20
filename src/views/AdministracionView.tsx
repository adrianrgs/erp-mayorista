import React, { useState } from "react";
import { FinancialInvoice } from "../types";
import { 
  Calculator, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Download, 
  Search, 
  Check,
  FileText,
  Clock,
  TrendingUp
} from "lucide-react";

interface AdministracionViewProps {
  invoices: FinancialInvoice[];
  onUpdateInvoice: (updated: FinancialInvoice) => void;
}

export default function AdministracionView({ invoices, onUpdateInvoice }: AdministracionViewProps) {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<FinancialInvoice | null>(invoices[0] || null);
  const [calcUsd, setCalcUsd] = useState(100);
  const [calcRate, setCalcRate] = useState(0.92); // USD to EUR
  const [calcResult, setCalcResult] = useState(92);
  const [statusMessage, setStatusMessage] = useState("");

  const filtered = invoices.filter((i) => {
    return i.clientName.toLowerCase().includes(search.toLowerCase()) ||
           i.id.toLowerCase().includes(search.toLowerCase());
  });

  // KPI Calculations
  const accountsReceivable = invoices
    .filter((i) => i.type === "Cobro" && i.status !== "Pagado")
    .reduce((sum, item) => sum + item.amount, 0);

  const accountsPayable = invoices
    .filter((i) => i.type === "Pago Proveedor" && i.status !== "Pagado")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalInvoiced = invoices
    .filter((i) => i.status === "Pagado" || i.status === "Facturado")
    .reduce((sum, item) => sum + item.amount, 0);

  const handlePayInvoice = (inv: FinancialInvoice) => {
    const updated: FinancialInvoice = {
      ...inv,
      status: "Pagado"
    };
    onUpdateInvoice(updated);
    if (selectedInvoice?.id === inv.id) {
      setSelectedInvoice(updated);
    }
    setStatusMessage(`¡Factura ${inv.id} marcada como Pagada con éxito!`);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const calculateExchange = (usdVal: number, rateVal: number) => {
    setCalcUsd(usdVal);
    setCalcRate(rateVal);
    setCalcResult(Number((usdVal * rateVal).toFixed(2)));
  };

  const handleDownloadInvoice = () => {
    if (!selectedInvoice) return;
    setStatusMessage(`Simulación de descarga completada para el comprobante: ${selectedInvoice.id}`);
    setTimeout(() => setStatusMessage(""), 4050);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] overflow-y-auto pr-2 font-sans">
      
      {/* 3 KPIs principales en bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receivables */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Cuentas por Cobrar (Receivables)</span>
            <h3 className="font-extrabold text-xl text-zinc-900 mt-1">${accountsReceivable.toLocaleString()} USD</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold uppercase">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Retraso promedio: 14 días
            </p>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Cuentas por Pagar (Payables)</span>
            <h3 className="font-extrabold text-xl text-zinc-900 mt-1">${accountsPayable.toLocaleString()} USD</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold uppercase">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Próximo vencimiento: 25/06
            </p>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Movimientos Conciliados MTD</span>
            <h3 className="font-extrabold text-xl text-zinc-900 mt-1">${totalInvoiced.toLocaleString()} USD</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold uppercase">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              +14% vs mes anterior
            </p>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded text-xs flex items-center gap-2 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {statusMessage}
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Tabla de Facturas */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">Facturaciones & Pagos a Proveedores</h4>
              <p className="text-xs text-zinc-450 mt-1">Registro de conciliaciones y tesorería mayorista</p>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="invoice-search-input"
                type="text"
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-500 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-200">
              <thead>
                <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                  <th className="p-3">Código</th>
                  <th className="p-3">Destinatario</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Importe</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filtered.map((inv) => (
                  <tr 
                    key={inv.id} 
                    id={`invoice-row-${inv.id}`}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`hover:bg-zinc-50/50 cursor-pointer transition-colors ${selectedInvoice?.id === inv.id ? "bg-zinc-50 border-r-2 border-zinc-900" : ""}`}
                  >
                    <td className="p-3 font-mono font-bold text-zinc-600">{inv.id}</td>
                    <td className="p-3 text-zinc-900 font-bold">{inv.clientName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${inv.type === "Cobro" ? "bg-zinc-100 text-zinc-800" : "bg-zinc-200 text-zinc-700"}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-zinc-900">${inv.amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                        inv.status === "Pagado" ? "bg-zinc-50 text-zinc-900 border-zinc-250 font-bold" : 
                        inv.status === "Facturado" ? "bg-zinc-50 text-zinc-500 border-zinc-200" : 
                        inv.status === "Vencido" ? "bg-zinc-50 text-zinc-600 border-zinc-300 font-bold" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {inv.status !== "Pagado" ? (
                        <button
                          id={`pay-btn-${inv.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayInvoice(inv);
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Saldar
                        </button>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5 text-zinc-800" /> Conciliado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversor de Divisas & Utilidad DMC */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Calculadora */}
          <div className="bg-white border border-zinc-200 rounded p-5 space-y-4 shadow-xs">
            <h4 className="font-bold text-zinc-905 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4.5 h-4.5 text-zinc-650" />
              Calculadora Multidivisa DMC
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Ideal para cotizar contratos netos en moneda euro o regional convirtiendo a cuenta dólar (USD).
            </p>

            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Monto en USD</label>
                <input
                  id="calc-usd-input"
                  type="number"
                  value={calcUsd}
                  onChange={(e) => calculateExchange(Number(e.target.value), calcRate)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-500 bg-white font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tipo de Cambio (A Euro / Neto)</label>
                <input
                  id="calc-rate-input"
                  type="number"
                  step="0.01"
                  value={calcRate}
                  onChange={(e) => calculateExchange(calcUsd, Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-500 bg-white font-semibold"
                />
              </div>

              <div className="bg-zinc-50 p-3 rounded border border-zinc-200 text-center">
                <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider">Monto Convertido Neto</span>
                <p className="font-bold text-zinc-900 text-lg mt-1">€ {calcResult} EUR</p>
              </div>
            </div>
          </div>

          {/* Quick Invoice Info Card */}
          {selectedInvoice && (
            <div className="bg-zinc-950 text-white rounded p-5 space-y-4 relative overflow-hidden border border-zinc-900 shadow-sm">
              <div className="absolute right-[-10px] bottom-[-15px] opacity-10">
                <FileText className="w-24 h-24" />
              </div>
              <div className="relative">
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded inline-block">
                  Inspector de Transacción
                </span>
                <h4 className="font-bold text-sm mt-3 leading-tight tracking-tight">{selectedInvoice.clientName}</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Comprobante ID: {selectedInvoice.id}</p>
              </div>

              <div className="pt-2 flex justify-between items-center relative">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Fecha Límite</span>
                  <span className="text-xs font-semibold">{selectedInvoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Total Liquidación</span>
                  <span className="text-sm font-extrabold text-white">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex justify-between gap-2 relative">
                <button 
                  id="download-invoice-btn"
                  onClick={handleDownloadInvoice}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/5 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Despachar Copia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

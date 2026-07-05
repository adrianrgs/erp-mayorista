import React, { useState, useMemo } from "react";
import { PayableObligation, ProviderStatement } from "../types";
import { TaxJurisdiction, DEFAULT_JURISDICTION, formatCurrency, formatDualCurrency } from "../lib/taxEngine";
import { nextSequentialId } from "../lib/idGenerator";
import {
  TrendingDown,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  X,
  ChevronRight,
  FileText,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  UploadCloud,
  Check,
  Plus
} from "lucide-react";
import { useDialog } from "../components/ui/DialogProvider";

interface CuentasPorPagarViewProps {
  obligations: PayableObligation[];
  onUpdateObligation: (updated: PayableObligation) => void;
  onAddObligation?: (o: PayableObligation) => void;
  statements: ProviderStatement[];
  onAddStatement: (newDoc: ProviderStatement) => void;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}

export default function CuentasPorPagarView({
  obligations,
  onUpdateObligation,
  onAddObligation,
  statements,
  onAddStatement,
  jurisdiction,
  currentExchangeRate,
}: CuentasPorPagarViewProps) {
  const jur = jurisdiction ?? DEFAULT_JURISDICTION;
  const { showAlert } = useDialog();
  // Navigation inside view: "obligaciones" (Bandeja) or "proveedores" (Estados de Cuenta)
  const [activeTab, setActiveTab] = useState<"obligaciones" | "proveedores" | "pagadas">("obligaciones");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  // Selected provider for statement history
  const [selectedProvider, setSelectedProvider] = useState<string>(
    statements[0]?.providerName || "Hesperia World Wholesalers S.A."
  );

  // Drawer (Side-panel) State
  const [activeObligationForPayment, setActiveObligationForPayment] = useState<PayableObligation | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    method: "Transferencia Bancaria",
    currency: "USD",
    amount: "",
    reference: "",
    notes: "",
    attachedFile: ""
  });

  // Nueva obligación manual
  const [showNewObligationForm, setShowNewObligationForm] = useState(false);
  const [newObligationForm, setNewObligationForm] = useState({
    providerName: "",
    serviceDetail: "",
    locatorId: "",
    dueDate: new Date().toISOString().slice(0, 10),
    date: new Date().toISOString().slice(0, 10),
    netCost: "",
    currency: "USD",
    paymentMethod: "Transferencia Bancaria",
    notes: "",
    isExempt: false,
    vatWithheldPct: "",
  });

  const handleSubmitNewObligation = () => {
    const cost = parseFloat(newObligationForm.netCost);
    if (!newObligationForm.providerName.trim() || !newObligationForm.serviceDetail.trim() || isNaN(cost) || cost <= 0) {
      alert("Complete proveedor, concepto y monto válido.");
      return;
    }
    if (!onAddObligation) return;

    // Compute fiscal fields
    const vatRate = (!newObligationForm.isExempt && jur.taxRate > 0) ? jur.taxRate : 0;
    const vatAmt = vatRate > 0 ? parseFloat((cost * vatRate).toFixed(2)) : undefined;
    const withholdPct = (!newObligationForm.isExempt && jur.hasWithholding && newObligationForm.vatWithheldPct)
      ? parseFloat(newObligationForm.vatWithheldPct) : 0;
    const vatWithheld = (vatAmt && withholdPct > 0) ? parseFloat((vatAmt * withholdPct / 100).toFixed(2)) : undefined;

    const newObl: PayableObligation = {
      id: nextSequentialId("OBL-M", obligations.map(o => o.id)),
      dueDate: newObligationForm.dueDate,
      date: newObligationForm.date,
      providerName: newObligationForm.providerName.trim(),
      serviceDetail: newObligationForm.serviceDetail.trim(),
      locatorId: newObligationForm.locatorId.trim() || "-",
      netCost: cost,
      paidAmount: 0,
      status: "Pendiente",
      paymentMethod: newObligationForm.paymentMethod,
      currency: newObligationForm.currency,
      notes: newObligationForm.notes.trim() || undefined,
      isExempt: newObligationForm.isExempt || undefined,
      vatAmount: vatAmt,
      vatWithheldPct: withholdPct || undefined,
      vatWithheld,
    };
    onAddObligation(newObl);
    setShowNewObligationForm(false);
    setNewObligationForm({ providerName: "", serviceDetail: "", locatorId: "", dueDate: new Date().toISOString().slice(0, 10), date: new Date().toISOString().slice(0, 10), netCost: "", currency: "USD", paymentMethod: "Transferencia Bancaria", notes: "", isExempt: false, vatWithheldPct: "" });
  };

  // Frozen obligation resolution modal
  const [resolveObligation, setResolveObligation] = useState<PayableObligation | null>(null);
  const [resolveForm, setResolveForm] = useState({
    outcome: "full" as "full" | "partial" | "none",
    refundAmount: "",
    notes: ""
  });

  const handleResolveObligation = () => {
    if (!resolveObligation) return;
    const isOverpayment = resolveObligation.status === "Pagado Total" && resolveObligation.paidAmount > resolveObligation.netCost;
    // For overpayment: only the excess is at stake. For frozen: the full paidAmount is at stake.
    const base = isOverpayment
      ? resolveObligation.paidAmount - resolveObligation.netCost
      : resolveObligation.paidAmount;

    let refund = 0;
    let resolutionNote = "";

    if (resolveForm.outcome === "full") {
      refund = base;
      resolutionNote = isOverpayment
        ? `[Overpago Recuperado] Proveedor reembolsó $${refund.toFixed(2)} USD de excedente pagado.`
        : `[Resuelto] Proveedor reembolsó $${refund.toFixed(2)} USD completos.`;
    } else if (resolveForm.outcome === "partial") {
      refund = parseFloat(resolveForm.refundAmount) || 0;
      resolutionNote = isOverpayment
        ? `[Overpago Parcial] Proveedor reembolsó $${refund.toFixed(2)} de $${base.toFixed(2)} USD. Diferencia absorbida: $${(base - refund).toFixed(2)} USD.`
        : `[Resuelto Parcial] Proveedor reembolsó $${refund.toFixed(2)} de $${base.toFixed(2)} USD. Pérdida absorbida: $${(base - refund).toFixed(2)} USD.`;
    } else {
      // No refund: for overpayment we write off the excess (set paidAmount = netCost so obligation balances)
      refund = isOverpayment ? base : 0;
      resolutionNote = isOverpayment
        ? `[Overpago Absorbido] Excedente de $${base.toFixed(2)} USD dado de baja. Proveedor no reembolsará.`
        : `[Sin Reembolso] Proveedor no reembolsará. Pérdida absorbida: $${base.toFixed(2)} USD.`;
    }

    const resolved: PayableObligation = {
      ...resolveObligation,
      status: "Pagado Total",
      isFrozen: false,
      paidAmount: resolveObligation.paidAmount - refund,
      notes: `${resolveObligation.notes || ""}\n${resolveForm.notes ? resolveForm.notes + " — " : ""}${resolutionNote}`
    };
    onUpdateObligation(resolved);
    triggerNotification(`${isOverpayment ? "Overpago" : "Obligación"} ${resolveObligation.id} resuelto/a. ${resolutionNote}`);
    setResolveObligation(null);
    setResolveForm({ outcome: "full", refundAmount: "", notes: "" });
  };

  // Success notifications
  const [notification, setNotification] = useState("");

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4500);
  };

  // Helper date formatter
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // ─── CALCULATE KPIs ────────────────────────────────────────────────────────
  // Total Active Debt: Net cost - Paid Amount for pending/overdue/partial obligations
  const activeDebt = useMemo(() => {
    return obligations
      .filter(o => o.status !== "Pagado Total")
      .reduce((sum, o) => sum + (o.netCost - o.paidAmount), 0);
  }, [obligations]);

  // Weekly Due (Vencimientos de la semana): obligations with status 'Pendiente' or 'Pagado Parcial' that are due within the next 7 days (or already overdue).
  const weeklyDue = useMemo(() => {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split("T")[0];
    return obligations
      .filter(o => o.status !== "Pagado Total" && o.dueDate <= weekFromNowStr)
      .reduce((sum, o) => sum + (o.netCost - o.paidAmount), 0);
  }, [obligations]);

  // Processed Payments: Sum of paidAmount of all obligations
  const processedPayments = useMemo(() => {
    return obligations.reduce((sum, o) => sum + o.paidAmount, 0);
  }, [obligations]);

  // ─── FILTER OBLIGATIONS ────────────────────────────────────────────────────
  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      const isOverpaid = o.paidAmount > o.netCost;
      // Overpaid obligations need action even though status is "Pagado Total" — keep in obligaciones tab
      if (activeTab === "obligaciones" && o.status === "Pagado Total" && !isOverpaid) return false;
      if (activeTab === "pagadas" && o.status !== "Pagado Total") return false;
      
      const matchesSearch = 
        o.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.locatorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.serviceDetail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [obligations, searchQuery, statusFilter, activeTab]);

  // ─── PROVIDER HISTORIES (Libro Mayor) ──────────────────────────────────────
  // Strips reservation-specific passenger data from provider names, e.g.
  // "LIDOTEL (Hab 1: [ANGORA SI (ADT), 5 (ADT)])" → "LIDOTEL"
  const normalizeProviderName = (name: string) =>
    name.replace(/\s*\(Hab\s*\d+:.*$/i, '').trim();

  const uniqueProviders = useMemo(() => {
    const normalized = statements.map(s => normalizeProviderName(s.providerName));
    return Array.from(new Set(normalized)).sort();
  }, [statements]);

  const activeProviderStatements = useMemo(() => {
    return statements.filter(s => normalizeProviderName(s.providerName) === selectedProvider);
  }, [statements, selectedProvider]);

  const providerBalance = useMemo(() => {
    const received = activeProviderStatements
      .filter(s => s.type === "Factura Recibida")
      .reduce((sum, s) => sum + s.amount, 0);
    const paid = activeProviderStatements
      .filter(s => s.type === "Pago Emitido")
      .reduce((sum, s) => sum + s.amount, 0);
    return received - paid;
  }, [activeProviderStatements]);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const calcTotalToPay = (ob: PayableObligation) =>
    ob.netCost + (ob.vatAmount ?? 0) - (ob.vatWithheld ?? 0);

  const handleOpenPaymentDrawer = (obligation: PayableObligation) => {
    setActiveObligationForPayment(obligation);
    const remaining = calcTotalToPay(obligation) - obligation.paidAmount;
    setPaymentForm({
      method: "Transferencia Bancaria",
      currency: obligation.currency || "USD",
      amount: Math.max(0, remaining).toFixed(2),
      reference: "",
      notes: "",
      attachedFile: ""
    });
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObligationForPayment) return;

    const payVal = parseFloat(paymentForm.amount) || 0;
    const totalToPay = calcTotalToPay(activeObligationForPayment);
    const remaining = totalToPay - activeObligationForPayment.paidAmount;

    if (payVal <= 0) {
      showAlert({ title: "Monto inválido", message: "Por favor, ingrese un monto de liquidación válido.", type: "warning" });
      return;
    }

    if (payVal > remaining + 0.01) {
      showAlert({ title: "Monto excedido", message: `Monto excedido. El saldo pendiente de esta obligación es ${formatCurrency(remaining, activeObligationForPayment.currency || "USD")}.`, type: "danger" });
      return;
    }

    const nextPaid = activeObligationForPayment.paidAmount + payVal;
    let nextStatus: PayableObligation["status"] = "Pagado Parcial";
    if (Math.abs(totalToPay - nextPaid) < 0.05) {
      nextStatus = "Pagado Total";
    }

    // 1. Update global obligation state
    const updated: PayableObligation = {
      ...activeObligationForPayment,
      paidAmount: Number(nextPaid.toFixed(2)),
      status: nextStatus,
      paymentMethod: paymentForm.method,
      reference: paymentForm.reference || `REF-PAG-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: paymentForm.notes || undefined,
      attachedFile: paymentForm.attachedFile || activeObligationForPayment.attachedFile || undefined
    };
    onUpdateObligation(updated);

    // 2. Add Transaction to Provider Statement (Libro Mayor)
    const newDoc: ProviderStatement = {
      id: nextSequentialId("DOC-PAG", statements.map(s => s.id)),
      providerName: activeObligationForPayment.providerName,
      date: new Date().toISOString().split("T")[0],
      type: "Pago Emitido",
      amount: payVal,
      reference: updated.reference!,
      status: "Aplicado"
    };
    onAddStatement(newDoc);

    // 3. Clean up and notify
    setActiveObligationForPayment(null);
    if (nextStatus === "Pagado Total") {
      triggerNotification(`✓ ¡Pago total registrado con éxito! Obligación ${updated.id} saldada por completo.`);
    } else {
      const saldoRestante = calcTotalToPay(updated) - updated.paidAmount;
      triggerNotification(`✓ Pago parcial de ${formatCurrency(payVal, updated.currency || "USD")} registrado. Saldo restante: ${formatCurrency(Math.max(0, saldoRestante), updated.currency || "USD")}.`);
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* HUD Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 bg-zinc-900 border border-zinc-800 text-white px-5 py-4 rounded shadow-xl flex items-center gap-3 z-50 animate-bounce max-w-sm font-sans">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold leading-snug">{notification}</span>
        </div>
      )}

      {/* --- SECTION 1: HEADER & KPIs --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded border border-zinc-200 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 flex-shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-black block">Tesorería Mayorista</span>
            <h2 className="text-xl font-extrabold text-zinc-900 mt-0.5">Cuentas por Pagar</h2>
          </div>
        </div>

        {/* View Selection Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
        <div className="bg-zinc-100 p-1 rounded-md flex items-center border border-zinc-200">
          <button
            onClick={() => setActiveTab("obligaciones")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "obligaciones"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Obligaciones
          </button>
          <button
            onClick={() => setActiveTab("pagadas")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "pagadas"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pagadas
          </button>

          <button
            onClick={() => setActiveTab("proveedores")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "proveedores"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Estados de Cuenta
          </button>
        </div>

        {onAddObligation && (
          <>
            <div className="w-px h-8 bg-zinc-200 hidden sm:block" />
            <button
              onClick={() => setShowNewObligationForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded text-xs font-bold whitespace-nowrap hover:bg-zinc-700 transition-colors shadow-3xs"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Obligación
            </button>
          </>
        )}
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Active Debt */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-3xs">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">Deuda Total Activa</span>
            <h3 className="font-extrabold text-2xl text-zinc-900 mt-1">{formatDualCurrency(activeDebt, jur, currentExchangeRate)}</h3>
            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded font-bold inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" /> Costos netos acumulados
            </span>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Weekly Due */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-3xs">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">Vencimientos de la Semana</span>
            <h3 className="font-extrabold text-2xl text-zinc-900 mt-1">{formatDualCurrency(weeklyDue, jur, currentExchangeRate)}</h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded font-bold inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" /> Próximos 7 días
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* KPI 3: Processed Payments */}
        <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-3xs">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">Pagos Emitidos este Mes</span>
            <h3 className="font-extrabold text-2xl text-zinc-900 mt-1">{formatDualCurrency(processedPayments, jur, currentExchangeRate)}</h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-650" /> Egresos conciliados
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-650 rounded">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- VIEW CONTENT: BANDEJA DE OBLIGACIONES --- */}
      {(activeTab === "obligaciones" || activeTab === "pagadas") && (
        <div className="space-y-6">
          
          {/* Filters Bento Box */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 border border-zinc-200 rounded-lg shadow-3xs">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
              <input
                type="text"
                placeholder="Buscar por proveedor, ID, localizador..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-500 font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Select Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-zinc-450" />
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Estatus Pago:</span>
              <div className="flex gap-1.5 flex-wrap">
                {["Todos", "Pendiente", "Vencido", "Pagado Parcial", "Pagado Total"].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded border transition-colors cursor-pointer uppercase ${
                      statusFilter === st
                        ? "bg-zinc-950 text-white border-zinc-950"
                        : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Obligations Datatable */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="p-4 w-28">ID Costo</th>
                    <th className="p-4">Proveedor Receptivo</th>
                    <th className="p-4">Expediente / Reserva</th>
                    <th className="p-4">Detalle del Servicio Neto</th>
                    <th className="p-4 text-right">Monto Neto</th>
                    <th className="p-4 text-right">Abonado</th>
                    <th className="p-4 text-right">Saldo Deuda</th>
                    <th className="p-4 text-center">Límite Pago</th>
                    <th className="p-4 text-center">Estatus</th>
                    <th className="p-4 text-right">Operaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  {filteredObligations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-zinc-450 italic bg-zinc-50/10">
                        No se registran obligaciones de pago a proveedores para los filtros activos.
                      </td>
                    </tr>
                  ) : (
                    filteredObligations.map(ob => {
                      const remaining = ob.netCost - ob.paidAmount;
                      return (
                        <tr 
                          key={ob.id} 
                          className="hover:bg-zinc-50/60 transition-colors group"
                        >
                          <td className="p-4 font-mono font-bold text-zinc-900">{ob.id}</td>
                          <td className="p-4 font-bold text-zinc-900">{ob.providerName}</td>
                          <td className="p-4 font-bold font-mono text-zinc-700">{ob.locatorId}</td>
                          <td className="p-4 text-zinc-500 max-w-[220px]">
                            <div>
                              <p className={`font-semibold ${(ob.isFrozen || ob.status === "Congelado") ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{ob.serviceDetail}</p>
                              {ob.isExempt && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                                  Exento {jur.taxName}
                                </span>
                              )}
                              {!ob.isExempt && ob.vatAmount != null && ob.vatAmount > 0 && (
                                <div className="mt-1 text-[9px] font-mono text-zinc-500 space-y-0.5">
                                  <span className="block">{jur.taxName}: {formatCurrency(ob.vatAmount, ob.currency || "USD")}</span>
                                  {ob.vatWithheld != null && ob.vatWithheld > 0 && (
                                    <span className="block text-red-600">Ret. {ob.vatWithheldPct}%: -{formatCurrency(ob.vatWithheld, ob.currency || "USD")}</span>
                                  )}
                                </div>
                              )}
                              {(ob.isFrozen || ob.status === "Congelado") && (
                                <div className="mt-2 bg-amber-50 border border-amber-250 rounded p-2 text-left space-y-1">
                                  <p className="text-[10px] text-amber-800 font-bold leading-tight flex items-center gap-1">
                                    ⚠️ Pago Congelado Automáticamente
                                  </p>
                                  <p className="text-[9.5px] text-zinc-650 leading-normal font-semibold">
                                    El servicio fue cancelado o modificado en el expediente.
                                  </p>
                                  <p className="text-[9.5px] text-amber-705 font-extrabold leading-normal">
                                    Acción: Reclamar reembolso de ${(ob.netCost - ob.paidAmount).toFixed(2)} USD a {ob.providerName} o conciliar con Nota de Crédito.
                                  </p>
                                </div>
                              )}
                              {ob.notes && ob.notes.includes("[Bloqueado]") && (
                                <p className="text-[9.5px] text-zinc-500 font-medium italic mt-0.5 block max-w-[240px] truncate leading-normal" title={ob.notes}>
                                  {ob.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-zinc-900">
                            {formatCurrency(ob.netCost, ob.currency || "USD")}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-700">
                            {formatCurrency(ob.paidAmount, ob.currency || "USD")}
                          </td>
                          <td className={`p-4 text-right font-black font-mono ${remaining > 0 ? "text-red-650" : remaining < 0 ? "text-emerald-700" : "text-zinc-400"}`}>
                            {remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(remaining), ob.currency || "USD")}
                          </td>
                          <td className="p-4 text-center font-mono text-[10.5px] text-zinc-650">
                            {formatDate(ob.dueDate)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                              ob.isFrozen || ob.status === "Congelado" ? "bg-red-100 border border-red-300 text-red-800" :
                              ob.status === "Pagado Total" ? "bg-emerald-50 text-emerald-700 border-emerald-250" : 
                              ob.status === "Pagado Parcial" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                              ob.status === "Vencido" ? "bg-red-50 text-red-700 border-red-200 animate-pulse font-black" : 
                              "bg-amber-50 text-amber-700 border-amber-250"
                            }`}>
                              {ob.isFrozen || ob.status === "Congelado" ? "CONGELADO" : ob.status === "Pagado Total" ? "Pagado" : ob.status}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {(ob.isFrozen || ob.status === "Congelado") ? (
                              ob.paidAmount > 0 ? (
                                <button
                                  onClick={() => { setResolveObligation(ob); setResolveForm({ outcome: "full", refundAmount: ob.paidAmount.toFixed(2), notes: "" }); }}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs"
                                >
                                  Resolver
                                </button>
                              ) : (
                                <span className="text-[9.5px] text-red-600 font-bold uppercase flex items-center justify-end gap-1 pr-2">
                                  🔒 Bloqueado
                                </span>
                              )
                            ) : ob.status === "Pagado Total" && ob.paidAmount > ob.netCost ? (
                              <button
                                onClick={() => {
                                  const excess = ob.paidAmount - ob.netCost;
                                  setResolveObligation(ob);
                                  setResolveForm({ outcome: "full", refundAmount: excess.toFixed(2), notes: "" });
                                }}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs"
                              >
                                Recuperar ${(ob.paidAmount - ob.netCost).toFixed(2)}
                              </button>
                            ) : ob.status !== "Pagado Total" ? (
                              <button
                                onClick={() => handleOpenPaymentDrawer(ob)}
                                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs"
                              >
                                Pagar
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-400 font-bold uppercase flex items-center justify-end gap-1.5 pr-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conciliado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW CONTENT: ESTADO DE CUENTA POR PROVEEDOR --- */}
      {activeTab === "proveedores" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Providers Selection list */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-3xs">
            <div>
              <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest">Catálogo de Proveedores</h4>
              <p className="text-[10px] text-zinc-450 mt-1">Seleccione un proveedor para auditar su Libro Mayor de costos</p>
            </div>

            <div className="divide-y divide-zinc-100 max-h-[50vh] overflow-y-auto pr-1">
              {uniqueProviders.map((provider) => {
                const isSelected = provider === selectedProvider;
                return (
                  <div
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-md transition-all cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? "bg-zinc-950 text-white shadow-3xs" 
                        : "hover:bg-zinc-50/80 text-zinc-800"
                    }`}
                  >
                    <div className="space-y-0.5 max-w-full">
                      <p className="font-extrabold text-[11.5px] truncate">{provider}</p>
                      <p className={`text-[9.5px] font-medium ${isSelected ? "text-zinc-400" : "text-zinc-450"}`}>
                        Región: América & Caribe
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-zinc-300"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Statement Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Statement Header and calculated balance */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-3xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-150 pb-3 gap-3">
                <div>
                  <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-bold text-zinc-700 uppercase">
                    Libro Mayor Operativo
                  </span>
                  <h3 className="font-black text-base text-zinc-955 uppercase mt-1.5">{selectedProvider}</h3>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    providerBalance > 0 
                      ? "bg-red-50 border-red-200 text-red-650" 
                      : "bg-emerald-50 border-emerald-250 text-emerald-700"
                  }`}>
                    {providerBalance > 0 ? "● Saldo Deudor" : "● Cuentas al Día"}
                  </span>
                </div>
              </div>

              {/* Balances Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                  <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider block">Total Facturas Recibidas</span>
                  <p className="font-black text-zinc-900 text-base mt-1 font-mono">
                    {formatDualCurrency(
                      activeProviderStatements.filter(s => s.type === "Factura Recibida").reduce((sum, s) => sum + s.amount, 0),
                      jur, currentExchangeRate
                    )}
                  </p>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                  <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider block">Total Pagos Emitidos</span>
                  <p className="font-bold text-emerald-700 text-base mt-1 font-mono">
                    -{formatDualCurrency(
                      activeProviderStatements.filter(s => s.type === "Pago Emitido").reduce((sum, s) => sum + s.amount, 0),
                      jur, currentExchangeRate
                    )}
                  </p>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                  <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider block">Balance Neto Pendiente</span>
                  <p className={`font-black text-base mt-1 font-mono ${providerBalance > 0 ? "text-red-650" : "text-emerald-700"}`}>
                    {formatDualCurrency(providerBalance, jur, currentExchangeRate)}
                  </p>
                </div>
              </div>
            </div>

            {/* General Ledger Table */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-3xs space-y-4">
              <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                <FileText className="w-4 h-4 text-zinc-700" /> Registro Detallado de Facturas y Egresos
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-zinc-200">
                  <thead>
                    <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                      <th className="p-3">ID Interno</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Tipo Transacción</th>
                      <th className="p-3">Ref. Documento</th>
                      <th className="p-3 text-right">Importe</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {activeProviderStatements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-zinc-450 italic bg-zinc-50/10">
                          No se registran movimientos en el libro mayor de este proveedor.
                        </td>
                      </tr>
                    ) : (
                      activeProviderStatements.map((stm) => {
                        const isInvoice = stm.type === "Factura Recibida";
                        return (
                          <tr key={stm.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-zinc-500">{stm.id}</td>
                            <td className="p-3 text-zinc-500 font-mono">{formatDate(stm.date)}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                                isInvoice 
                                  ? "bg-red-50 border-red-200 text-red-750" 
                                  : "bg-emerald-50 border-emerald-255 text-emerald-700"
                              }`}>
                                {isInvoice ? "Factura Recibida" : "Pago Emitido"}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-zinc-900 font-semibold">{stm.reference}</td>
                            <td className={`p-3 text-right font-black font-mono text-xs ${isInvoice ? "text-red-650" : "text-emerald-700"}`}>
                              {isInvoice ? "+" : "-"}${stm.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                                stm.status === "Saldado" || stm.status === "Aplicado" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                                  : "bg-amber-50 text-amber-700 border-amber-250"
                              }`}>
                                {stm.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PANEL LATERAL DESLIZANTE (DRAWER) PARA REGISTRAR PAGO --- */}
      {activeObligationForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in font-sans">
          
          {/* Drawer Container */}
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl relative animate-slide-in">
            
            {/* Header */}
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Procesar Transacción</span>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mt-0.5">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-400" /> Registrar Liquidación Neto
                </h4>
              </div>
              <button 
                onClick={() => setActiveObligationForPayment(null)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Service & Debt Details Callout */}
            <div className="bg-zinc-50 border-b border-zinc-200 p-5 space-y-3 flex-shrink-0 text-left">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Proveedor Destinatario</span>
                <p className="font-extrabold text-xs text-zinc-900 uppercase">{activeObligationForPayment.providerName}</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded p-3 text-[11px] space-y-1.5 font-sans leading-relaxed">
                <div className="flex justify-between border-b border-zinc-100 pb-1 mb-1 font-bold text-zinc-700 uppercase text-[9px] tracking-wider">
                  <span>Detalle del Servicio</span>
                  <span className="font-mono">{activeObligationForPayment.locatorId}</span>
                </div>
                <p className="text-zinc-650 font-semibold">{activeObligationForPayment.serviceDetail}</p>
                {activeObligationForPayment.isExempt && (
                  <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                    Exento {jur.taxName}
                  </span>
                )}
                <div className="pt-1 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Costo base:</span>
                    <span className="font-bold text-zinc-900">{formatCurrency(activeObligationForPayment.netCost, activeObligationForPayment.currency || "USD")}</span>
                  </div>
                  {activeObligationForPayment.vatAmount != null && activeObligationForPayment.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">{jur.taxName}:</span>
                      <span className="font-bold text-zinc-700">+{formatCurrency(activeObligationForPayment.vatAmount, activeObligationForPayment.currency || "USD")}</span>
                    </div>
                  )}
                  {activeObligationForPayment.vatWithheld != null && activeObligationForPayment.vatWithheld > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Retención {activeObligationForPayment.vatWithheldPct}%:</span>
                      <span className="font-bold text-red-600">-{formatCurrency(activeObligationForPayment.vatWithheld, activeObligationForPayment.currency || "USD")}</span>
                    </div>
                  )}
                  {(activeObligationForPayment.vatAmount ?? 0) > 0 && (
                    <div className="flex justify-between border-t border-zinc-100 pt-1">
                      <span className="text-zinc-600 font-semibold">Total a pagar:</span>
                      <span className="font-bold text-zinc-900">{formatCurrency(calcTotalToPay(activeObligationForPayment), activeObligationForPayment.currency || "USD")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ya abonado:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(activeObligationForPayment.paidAmount, activeObligationForPayment.currency || "USD")}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-red-50 border border-red-200 text-red-750 px-3.5 py-2.5 rounded">
                <span className="text-[10px] font-bold uppercase tracking-wider">Saldo Pendiente</span>
                <span className="text-sm font-black font-mono">
                  {formatCurrency(Math.max(0, calcTotalToPay(activeObligationForPayment) - activeObligationForPayment.paidAmount), activeObligationForPayment.currency || "USD")}
                </span>
              </div>
            </div>

            {/* Payment Registration Form */}
            <form onSubmit={handleRegisterPaymentSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Method */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Método de Egreso</label>
                <select
                  className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Efectivo USD">Efectivo USD</option>
                  <option value="Cheque Corporativo">Cheque Corporativo</option>
                </select>
              </div>

              {/* ── Sección fiscal ── */}
              {jur.taxRate > 0 && (
                <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50 text-left">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Tratamiento Fiscal del Proveedor</span>

                  {/* Checkbox exento */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activeObligationForPayment.isExempt ?? false}
                      onChange={e => {
                        const isExempt = e.target.checked;
                        const vatAmount = isExempt
                          ? undefined
                          : parseFloat((activeObligationForPayment.netCost * jur.taxRate).toFixed(2));
                        const updated: PayableObligation = {
                          ...activeObligationForPayment,
                          isExempt: isExempt || undefined,
                          vatAmount,
                          vatWithheldPct: isExempt ? undefined : activeObligationForPayment.vatWithheldPct,
                          vatWithheld: isExempt ? undefined : activeObligationForPayment.vatWithheld,
                        };
                        setActiveObligationForPayment(updated);
                        setPaymentForm(prev => ({
                          ...prev,
                          amount: Math.max(0, calcTotalToPay(updated) - updated.paidAmount).toFixed(2),
                        }));
                      }}
                      className="w-4 h-4 rounded border-gray-300 accent-zinc-800 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">Exento de {jur.taxName}</span>
                      <span className="text-[10px] text-zinc-500">No aplica retención fiscal</span>
                    </div>
                  </label>

                  {/* Campos IVA cuando no es exento */}
                  {!activeObligationForPayment.isExempt && (() => {
                    const vatAmt = activeObligationForPayment.vatAmount
                      ?? parseFloat((activeObligationForPayment.netCost * jur.taxRate).toFixed(2));
                    const pct = activeObligationForPayment.vatWithheldPct ?? 0;
                    const withheld = parseFloat((vatAmt * pct / 100).toFixed(2));
                    const cur = activeObligationForPayment.currency || "USD";
                    return (
                      <div className="space-y-3 pt-2 border-t border-zinc-200">
                        {jur.hasWithholding && (
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              % Retención {jur.taxName}
                            </label>
                            <select
                              value={pct > 0 ? String(pct) : ""}
                              onChange={e => {
                                const newPct = parseFloat(e.target.value) || 0;
                                const computedVat = parseFloat((activeObligationForPayment.netCost * jur.taxRate).toFixed(2));
                                const newVatAmt = activeObligationForPayment.vatAmount ?? computedVat;
                                const newWithheld = parseFloat((newVatAmt * newPct / 100).toFixed(2));
                                const updated: PayableObligation = {
                                  ...activeObligationForPayment,
                                  vatAmount: newVatAmt,
                                  vatWithheldPct: newPct || undefined,
                                  vatWithheld: newWithheld || undefined,
                                };
                                setActiveObligationForPayment(updated);
                                setPaymentForm(prev => ({
                                  ...prev,
                                  amount: Math.max(0, calcTotalToPay(updated) - updated.paidAmount).toFixed(2),
                                }));
                              }}
                              className="w-full text-xs border border-zinc-200 rounded px-3 py-2 bg-white focus:outline-none"
                            >
                              <option value="">Sin retención</option>
                              {(jur.vatWithholdingOptions ?? []).map(opt => (
                                <option key={opt} value={String(opt)}>{opt}%</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Resumen fiscal */}
                        <div className="bg-white border border-zinc-200 rounded p-2.5 text-[10.5px] font-mono space-y-1">
                          <div className="flex justify-between text-zinc-600">
                            <span>Costo base:</span>
                            <span>{formatCurrency(activeObligationForPayment.netCost, cur)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>{jur.taxName} ({(jur.taxRate * 100).toFixed(0)}%):</span>
                            <span>+{formatCurrency(vatAmt, cur)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-zinc-800 border-t border-zinc-100 pt-1">
                            <span>Total Factura:</span>
                            <span>{formatCurrency(activeObligationForPayment.netCost + vatAmt, cur)}</span>
                          </div>
                          {withheld > 0 && (
                            <>
                              <div className="flex justify-between text-red-600">
                                <span>Retención {pct}%:</span>
                                <span>-{formatCurrency(withheld, cur)}</span>
                              </div>
                              <div className="flex justify-between font-black text-zinc-900 border-t border-zinc-100 pt-1">
                                <span>A Pagar al Proveedor:</span>
                                <span>{formatCurrency(activeObligationForPayment.netCost + vatAmt - withheld, cur)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Currency & Amount row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Moneda</label>
                  <select
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="VES">Bolívar (VES)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Monto a Liquidar</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none text-right"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Referencia Bancaria / Operación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TR-882710293"
                  className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              {/* Concept */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Observaciones Internas</label>
                <textarea
                  rows={2}
                  placeholder="Escriba aquí notas administrativas..."
                  className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs text-zinc-700 font-semibold focus:outline-none"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Upload Comprobante Mock */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Adjuntar Soporte de Egreso (PDF / JPG)</label>
                <div className="border border-dashed border-zinc-300 bg-zinc-50 rounded p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100/60 transition-colors relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPaymentForm(prev => ({ ...prev, attachedFile: file.name }));
                      }
                    }}
                  />
                  <UploadCloud className="w-6 h-6 text-zinc-400 mb-1" />
                  {paymentForm.attachedFile ? (
                    <p className="text-[10.5px] font-bold text-zinc-800">✓ Soporte: {paymentForm.attachedFile}</p>
                  ) : (
                    <>
                      <p className="text-[10.5px] font-bold text-zinc-700">Arrastre aquí o haga clic para subir recibo</p>
                      <p className="text-[9px] text-zinc-400">Archivos PDF, JPG, PNG hasta 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setActiveObligationForPayment(null)}
                  className="w-1/2 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Confirmar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE FROZEN OBLIGATION MODAL */}
      {resolveObligation && (() => {
        const isOverpayment = resolveObligation.status === "Pagado Total" && resolveObligation.paidAmount > resolveObligation.netCost;
        const excess = isOverpayment ? resolveObligation.paidAmount - resolveObligation.netCost : 0;
        const base = isOverpayment ? excess : resolveObligation.paidAmount;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
                    {isOverpayment ? "Recuperar Overpago al Proveedor" : "Resolver Obligación Congelada"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{resolveObligation.id} — {resolveObligation.providerName} — Exp. {resolveObligation.locatorId}</p>
                </div>
                <button onClick={() => setResolveObligation(null)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className={`${isOverpayment ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"} border rounded-lg p-3 text-xs space-y-1`}>
                  <div className="flex justify-between">
                    <span className={`${isOverpayment ? "text-emerald-700" : "text-amber-700"} font-bold`}>Monto neto del servicio:</span>
                    <span className="font-mono font-black">${resolveObligation.netCost.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isOverpayment ? "text-emerald-700" : "text-amber-700"} font-bold`}>Total abonado al proveedor:</span>
                    <span className="font-mono font-black">${resolveObligation.paidAmount.toFixed(2)} USD</span>
                  </div>
                  {isOverpayment && (
                    <div className="flex justify-between pt-1 border-t border-emerald-200">
                      <span className="text-emerald-800 font-black">Excedente a recuperar:</span>
                      <span className="font-mono font-black text-emerald-800">${excess.toFixed(2)} USD</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-600 font-semibold">
                  {isOverpayment
                    ? "¿El proveedor reembolsará el excedente de $" + excess.toFixed(2) + " USD?"
                    : "¿Qué resolución aplica con el proveedor?"}
                </p>

                <div className="space-y-2">
                  {[
                    {
                      value: "full",
                      label: isOverpayment
                        ? `Proveedor devuelve el excedente completo ($${excess.toFixed(2)} USD recuperados)`
                        : `Proveedor reembolsó completo ($${base.toFixed(2)} USD recuperados)`,
                      color: "emerald"
                    },
                    { value: "partial", label: "Reembolso parcial (ingresar monto recuperado)", color: "blue" },
                    {
                      value: "none",
                      label: isOverpayment
                        ? `Sin reembolso — excedente de $${excess.toFixed(2)} USD dado de baja`
                        : `Sin reembolso — pérdida absorbida ($${base.toFixed(2)} USD)`,
                      color: "red"
                    }
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${resolveForm.outcome === opt.value ? `border-${opt.color}-400 bg-${opt.color}-50` : "border-zinc-200 hover:border-zinc-300"}`}>
                      <input
                        type="radio"
                        name="outcome"
                        value={opt.value}
                        checked={resolveForm.outcome === opt.value}
                        onChange={() => setResolveForm(f => ({ ...f, outcome: opt.value as any }))}
                        className="mt-0.5"
                      />
                      <span className="text-xs font-semibold text-zinc-700">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {resolveForm.outcome === "partial" && (
                  <div>
                    <label className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Monto recuperado (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={base}
                      value={resolveForm.refundAmount}
                      onChange={e => setResolveForm(f => ({ ...f, refundAmount: e.target.value }))}
                      className="w-full p-2.5 border border-zinc-200 rounded text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Notas / evidencia (opcional)</label>
                  <textarea
                    value={resolveForm.notes}
                    onChange={e => setResolveForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Ej: Email confirmación reembolso, referencia transferencia..."
                    className="w-full p-2.5 border border-zinc-200 rounded text-sm text-zinc-700 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                <button
                  onClick={() => setResolveObligation(null)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResolveObligation}
                  className={`px-5 py-2 ${isOverpayment ? "bg-emerald-700 hover:bg-emerald-800" : "bg-zinc-900 hover:bg-zinc-800"} text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isOverpayment ? "Confirmar Recuperación" : "Confirmar Resolución"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: NUEVA OBLIGACIÓN MANUAL ─────────────────────────────── */}
      {showNewObligationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Nueva Obligación</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Registra una factura de proveedor o gasto a pagar</p>
              </div>
              <button onClick={() => setShowNewObligationForm(false)} className="p-1.5 rounded hover:bg-zinc-100">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Proveedor *</label>
                  <input
                    type="text"
                    value={newObligationForm.providerName}
                    onChange={e => setNewObligationForm(p => ({ ...p, providerName: e.target.value }))}
                    placeholder="Nombre del proveedor"
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Concepto / Descripción *</label>
                  <input
                    type="text"
                    value={newObligationForm.serviceDetail}
                    onChange={e => setNewObligationForm(p => ({ ...p, serviceDetail: e.target.value }))}
                    placeholder="Ej: Alquiler oficina Enero, Factura #001234"
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Fecha Factura</label>
                  <input
                    type="date"
                    value={newObligationForm.date}
                    onChange={e => setNewObligationForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={newObligationForm.dueDate}
                    onChange={e => setNewObligationForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Monto Neto *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newObligationForm.netCost}
                    onChange={e => setNewObligationForm(p => ({ ...p, netCost: e.target.value }))}
                    placeholder="0.00"
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Moneda</label>
                  <select
                    value={newObligationForm.currency}
                    onChange={e => setNewObligationForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>VES</option>
                    <option>COP</option>
                    <option>MXN</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Método de Pago</label>
                  <select
                    value={newObligationForm.paymentMethod}
                    onChange={e => setNewObligationForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  >
                    <option>Transferencia Bancaria</option>
                    <option>Zelle</option>
                    <option>Efectivo USD</option>
                    <option>Pago Móvil</option>
                    <option>Tarjeta de Crédito</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Referencia / Localizador</label>
                  <input
                    type="text"
                    value={newObligationForm.locatorId}
                    onChange={e => setNewObligationForm(p => ({ ...p, locatorId: e.target.value }))}
                    placeholder="Nº factura, referencia..."
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Notas</label>
                  <input
                    type="text"
                    value={newObligationForm.notes}
                    onChange={e => setNewObligationForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notas internas opcionales"
                    className="w-full text-xs border border-zinc-200 rounded px-3 py-2"
                  />
                </div>

                {/* ── Sección fiscal IVA proveedor ──────────────────────────── */}
                {jur.taxRate > 0 && (
                  <div className="col-span-2 border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newObligationForm.isExempt}
                        onChange={e => setNewObligationForm(p => ({ ...p, isExempt: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 accent-zinc-800 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">Proveedor exento de {jur.taxName}</span>
                        <span className="text-[10px] text-zinc-500">No genera retención fiscal</span>
                      </div>
                    </label>

                    {!newObligationForm.isExempt && (() => {
                      const base = parseFloat(newObligationForm.netCost || "0");
                      const vat = parseFloat((base * jur.taxRate).toFixed(2));
                      const total = base + vat;
                      const pct = parseFloat(newObligationForm.vatWithheldPct) || 0;
                      const withheld = parseFloat((vat * pct / 100).toFixed(2));
                      const toPay = total - withheld;
                      return (
                        <>
                          <div className={`grid gap-3 pt-2 border-t border-zinc-200 ${jur.hasWithholding ? "grid-cols-2" : "grid-cols-1"}`}>
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                                {jur.taxName} ({(jur.taxRate * 100).toFixed(0)}%)
                              </label>
                              <div className="text-xs font-mono font-bold text-zinc-700 bg-white border border-zinc-200 rounded px-3 py-2">
                                {base > 0 ? formatCurrency(vat, newObligationForm.currency) : "—"}
                              </div>
                            </div>
                            {jur.hasWithholding && (
                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                                  % Retención {jur.taxName}
                                </label>
                                <select
                                  value={newObligationForm.vatWithheldPct}
                                  onChange={e => setNewObligationForm(p => ({ ...p, vatWithheldPct: e.target.value }))}
                                  className="w-full text-xs border border-zinc-200 rounded px-3 py-2 bg-white"
                                >
                                  <option value="">Sin retención</option>
                                  {(jur.vatWithholdingOptions ?? []).map(opt => (
                                    <option key={opt} value={String(opt)}>{opt}%</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {base > 0 && (
                            <div className="bg-white border border-zinc-200 rounded p-2.5 text-[10.5px] font-mono space-y-1">
                              <div className="flex justify-between text-zinc-600">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(base, newObligationForm.currency)}</span>
                              </div>
                              <div className="flex justify-between text-zinc-600">
                                <span>{jur.taxName} ({(jur.taxRate * 100).toFixed(0)}%):</span>
                                <span>+{formatCurrency(vat, newObligationForm.currency)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-zinc-800 border-t border-zinc-100 pt-1">
                                <span>Total Factura Proveedor:</span>
                                <span>{formatCurrency(total, newObligationForm.currency)}</span>
                              </div>
                              {withheld > 0 && (
                                <>
                                  <div className="flex justify-between text-red-600">
                                    <span>Retención {pct}%:</span>
                                    <span>-{formatCurrency(withheld, newObligationForm.currency)}</span>
                                  </div>
                                  <div className="flex justify-between font-black text-zinc-900 border-t border-zinc-100 pt-1">
                                    <span>A Pagar al Proveedor:</span>
                                    <span>{formatCurrency(toPay, newObligationForm.currency)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setShowNewObligationForm(false)}
                className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitNewObligation}
                className="flex items-center gap-1.5 px-5 py-2 bg-zinc-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-700"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Obligación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

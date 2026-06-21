import React, { useState } from "react";
import { Reservation, FinancialInvoice, B2BClient, PaymentVoucher } from "../types";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  X,
  Edit2,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  CreditCard,
  Building,
  UploadCloud,
  Check,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Eye
} from "lucide-react";

interface CobranzasViewProps {
  clients: B2BClient[];
  onUpdateClient: (updated: B2BClient) => void;
  invoices: FinancialInvoice[];
  onUpdateInvoice: (updated: FinancialInvoice) => void;
  reservations: Reservation[];
  onAddInvoice?: (newInv: FinancialInvoice) => void;
}

export default function CobranzasView({ 
  clients, 
  onUpdateClient, 
  invoices, 
  onUpdateInvoice, 
  reservations,
  onAddInvoice 
}: CobranzasViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FinancialInvoice | null>(null);
  
  // Tab states for the client details card
  const [activeTab, setActiveTab] = useState<"facturas" | "comprobantes">("facturas");
  
  // Notification state
  const [statusMessage, setStatusMessage] = useState("");

  const [selectedVoucherForPreview, setSelectedVoucherForPreview] = useState<PaymentVoucher | null>(null);

  // Simulated Payment Voucher State initialized with high fidelity mock data
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([
    {
      id: "VOU-301",
      clientId: clients[0]?.id || "CLI-01",
      clientName: clients[0]?.nombre || "Viajes B2B América C.A.",
      invoiceId: "FAC-5231",
      locatorId: "LOC-8821",
      method: "Transferencia Bancaria",
      reference: "TR-99827392",
      amount: 1250.00,
      date: "2026-06-05",
      status: "Verificado",
      bankName: "Banesco Banco Universal",
      notes: "Pago correspondiente a la reserva de la familia Gonzalez.",
      attachedFile: "comprobante_banesco_99827392.pdf"
    },
    {
      id: "VOU-302",
      clientId: clients[1]?.id || "CLI-02",
      clientName: clients[1]?.nombre || "Destinos Satélite Internacional",
      invoiceId: "FAC-5232",
      locatorId: "LOC-1205",
      method: "Zelle",
      reference: "Z-102938475",
      amount: 850.00,
      date: "2026-06-08",
      status: "Pendiente",
      bankName: "Chase Bank",
      notes: "Abono para cotización pendiente de confirmación.",
      attachedFile: "zelle_receipt_102938475.jpg"
    },
    {
      id: "VOU-303",
      clientId: clients[2]?.id || "CLI-03",
      clientName: clients[2]?.nombre || "Freelance VIP Tours",
      invoiceId: "FAC-5233",
      locatorId: "LOC-4412",
      method: "Pago Móvil",
      reference: "PM-3829102",
      amount: 430.00,
      date: "2026-06-07",
      status: "Pendiente",
      bankName: "Banco Mercantil",
      notes: "Pago rápido de traslado privado.",
      attachedFile: "pago_movil_mercantil_3829102.png"
    }
  ]);

  // Payment Form States
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    method: "Transferencia Bancaria",
    reference: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    bankName: "",
    notes: "",
    attachedFile: ""
  });

  const activeClient = clients.find(c => c.id === selectedClientId);

  // Financial KPIs Calculations
  // Total outstanding accounts receivable
  const accountsReceivable = invoices
    .filter(i => i.type === "Cobro" && i.status !== "Pagado")
    .reduce((sum, item) => sum + item.amount, 0);

  // Total collections this month (conciliated payment invoices)
  const collectionsMtd = invoices
    .filter(i => i.type === "Cobro" && i.status === "Pagado")
    .reduce((sum, item) => sum + item.amount, 0);

  // Number of clients with active debt
  const debtorClientsCount = clients.filter(c => c.saldoDeber > 0).length;

  // Pending verification vouchers count
  const pendingVouchersCount = vouchers.filter(v => v.status === "Pendiente").length;

  // Filter clients list
  const filteredClients = clients.filter(c => {
    return c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.rif.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Handle audit verification of a pending voucher
  const handleVerifyVoucher = (voucher: PaymentVoucher, approve: boolean) => {
    // 1. Update Voucher status
    const newStatus = approve ? "Verificado" as const : "Rechazado" as const;
    setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, status: newStatus } : v));

    if (approve) {
      // 2. If it's linked to an invoice, mark it as paid or reduce its remaining balance (partial payment)
      if (voucher.invoiceId) {
        const targetInvoice = invoices.find(inv => inv.id === voucher.invoiceId);
        if (targetInvoice && targetInvoice.status !== "Pagado") {
          if (voucher.amount < targetInvoice.amount) {
            const nextAmount = Number((targetInvoice.amount - voucher.amount).toFixed(2));
            const nextVat = Number((nextAmount * 0.16).toFixed(2));
            onUpdateInvoice({
              ...targetInvoice,
              amount: nextAmount,
              vatAmount: nextVat
            });
          } else {
            const updatedInvoice = { ...targetInvoice, status: "Pagado" as const };
            onUpdateInvoice(updatedInvoice);
          }
        }
      }

      // 3. Update Client Balances
      const agencyRecord = clients.find(c => c.id === voucher.clientId);
      if (agencyRecord) {
        let nextSaldoFavor = agencyRecord.saldoFavor;
        let nextSaldoDeber = Math.max(0, agencyRecord.saldoDeber - voucher.amount);

        // If amount exceeds outstanding debt, add excess to saldoFavor
        if (voucher.amount > agencyRecord.saldoDeber) {
          const excess = voucher.amount - agencyRecord.saldoDeber;
          nextSaldoFavor += excess;
          nextSaldoDeber = 0;
        }

        onUpdateClient({
          ...agencyRecord,
          saldoDeber: nextSaldoDeber,
          saldoFavor: nextSaldoFavor
        });
      }

      setStatusMessage(`✓ Comprobante ${voucher.reference} verificado y conciliado con éxito.`);
    } else {
      setStatusMessage(`⚠ Comprobante ${voucher.reference} rechazado. Se notificará a la agencia.`);
    }

    setTimeout(() => setStatusMessage(""), 5050);
  };

  // Open payment registration form for specific invoice
  const openRegisterPaymentModal = (invoice: FinancialInvoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentForm({
      invoiceId: invoice.id,
      method: "Transferencia Bancaria",
      reference: "",
      amount: invoice.amount.toString(),
      date: new Date().toISOString().split("T")[0],
      bankName: "",
      notes: "",
      attachedFile: ""
    });
    setShowPaymentModal(true);
  };

  // Handle submit of payment registration form
  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    const amountPaid = parseFloat(paymentForm.amount) || 0;
    if (amountPaid <= 0) {
      alert("Por favor, ingrese un monto válido.");
      return;
    }

    // 1. Mark target invoice as "Pagado" or reduce its remaining balance (partial payment)
    let isPartialPayment = false;
    let remainingAmount = 0;
    if (paymentForm.invoiceId) {
      const targetInvoice = invoices.find(inv => inv.id === paymentForm.invoiceId);
      if (targetInvoice) {
        if (amountPaid < targetInvoice.amount) {
          isPartialPayment = true;
          remainingAmount = Number((targetInvoice.amount - amountPaid).toFixed(2));
          const nextVat = Number((remainingAmount * 0.16).toFixed(2));
          onUpdateInvoice({
            ...targetInvoice,
            amount: remainingAmount,
            vatAmount: nextVat
          });
        } else {
          onUpdateInvoice({
            ...targetInvoice,
            status: "Pagado"
          });
        }
      }
    }

    // 2. Adjust client balances
    let nextSaldoFavor = activeClient.saldoFavor;
    let nextSaldoDeber = Math.max(0, activeClient.saldoDeber - amountPaid);

    // Surplus goes to saldoFavor
    if (amountPaid > activeClient.saldoDeber) {
      const excess = amountPaid - activeClient.saldoDeber;
      nextSaldoFavor += excess;
      nextSaldoDeber = 0;
    }

    onUpdateClient({
      ...activeClient,
      saldoDeber: nextSaldoDeber,
      saldoFavor: nextSaldoFavor
    });

    // 3. Register a new verified PaymentVoucher
    const newVouId = `VOU-${Math.floor(304 + Math.random() * 200)}`;
    const newVoucher: PaymentVoucher = {
      id: newVouId,
      clientId: activeClient.id,
      clientName: activeClient.nombre,
      invoiceId: paymentForm.invoiceId || undefined,
      locatorId: paymentForm.invoiceId ? (invoices.find(i => i.id === paymentForm.invoiceId)?.clientName.match(/Localizador\s+(\w+-\d+)/)?.[1] || undefined) : undefined,
      method: paymentForm.method,
      reference: paymentForm.reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: amountPaid,
      date: paymentForm.date,
      status: "Verificado",
      bankName: paymentForm.bankName || undefined,
      notes: paymentForm.notes || undefined,
      attachedFile: paymentForm.attachedFile || "comprobante_registrado.jpg"
    };

    setVouchers(prev => [newVoucher, ...prev]);

    // 4. Create financial collection record invoice (ABO- / FAC- Recibo)
    if (onAddInvoice) {
      const paymentReceipt: FinancialInvoice = {
        id: `FAC-${Math.floor(5400 + Math.random() * 599)}`,
        clientName: `Recibo de Cobro: ${activeClient.nombre} - Factura Ref ${paymentForm.invoiceId || "General"}`,
        date: paymentForm.date,
        dueDate: paymentForm.date,
        amount: amountPaid,
        vatAmount: 0,
        type: "Cobro",
        status: "Pagado"
      };
      onAddInvoice(paymentReceipt);
    }

    setShowPaymentModal(false);
    if (isPartialPayment) {
      setStatusMessage(`✓ Pago parcial de $${amountPaid.toLocaleString("es-ES")} USD registrado. Saldo restante: $${remainingAmount.toLocaleString("es-ES")} USD.`);
    } else {
      setStatusMessage(`✓ Cobro de $${amountPaid.toLocaleString("es-ES")} USD registrado y conciliado exitosamente para ${activeClient.nombre}.`);
    }
    setTimeout(() => setStatusMessage(""), 5000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Outstanding Debt */}
        <div className="bg-white p-4.5 border border-zinc-200 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block">Cuentas por Cobrar (CXC)</span>
            <span className="text-2xl font-black block text-zinc-900">${accountsReceivable.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-zinc-400 font-semibold block">Deuda total activa de agencias B2B</span>
          </div>
          <div className="p-2.5 rounded-md border bg-red-50 border-red-100 text-red-650">
            <ArrowUpRight className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 2: Collections Month-to-Date */}
        <div className="bg-white p-4.5 border border-zinc-200 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block">Cobros Conciliados MTD</span>
            <span className="text-2xl font-black block text-emerald-700">${collectionsMtd.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            <span className="text-[9.5px] text-emerald-600 font-semibold block">Recaudación total conciliada</span>
          </div>
          <div className="p-2.5 rounded-md border bg-emerald-50 border-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 3: Debtors count */}
        <div className="bg-white p-4.5 border border-zinc-200 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block">Clientes con Saldo Deudor</span>
            <span className="text-2xl font-black block text-zinc-900">{debtorClientsCount} Agencia(s)</span>
            <span className="text-[9.5px] text-zinc-400 font-semibold block">Cuentas corrientes en mora</span>
          </div>
          <div className="p-2.5 rounded-md border bg-zinc-50 border-zinc-200 text-zinc-650">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 4: Pending audits */}
        <div className="bg-white p-4.5 border border-zinc-200 rounded-lg flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block">Comprobantes por Auditar</span>
            <span className="text-2xl font-black block text-amber-700 animate-pulse">{pendingVouchersCount} Pendiente(s)</span>
            <span className="text-[9.5px] text-amber-600 font-semibold block">Pendiente verificar en banco</span>
          </div>
          <div className="p-2.5 rounded-md border bg-amber-50 border-amber-100 text-amber-700">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-md shadow-md flex items-center gap-2 animate-bounce">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: B2B Clients List */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div>
            <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest">Cartera de Clientes B2B</h4>
            <p className="text-[10px] text-zinc-450 mt-1">Seleccione un cliente para gestionar sus cuentas corrientes</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-450" />
            <input
              type="text"
              placeholder="Buscar por nombre, RIF..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-500 font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clients List */}
          <div className="divide-y divide-zinc-100 max-h-[55vh] overflow-y-auto pr-1">
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              const hasDebt = client.saldoDeber > 0;
              return (
                <div
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setActiveTab("facturas");
                  }}
                  className={`p-3 rounded-md transition-all cursor-pointer flex justify-between items-center ${
                    isSelected 
                      ? "bg-zinc-950 text-white shadow-xs" 
                      : "hover:bg-zinc-50/80 text-zinc-800"
                  }`}
                >
                  <div className="space-y-0.5 max-w-[65%]">
                    <p className="font-extrabold text-[11.5px] truncate">{client.nombre}</p>
                    <p className={`text-[9.5px] font-mono ${isSelected ? "text-zinc-400" : "text-zinc-450"}`}>RIF: {client.rif}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11.5px] font-black block font-mono ${
                      isSelected 
                        ? "text-white" 
                        : hasDebt 
                          ? "text-red-650" 
                          : "text-zinc-450"
                    }`}>
                      ${client.saldoDeber.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[8.5px] font-bold uppercase tracking-wider block ${
                      isSelected 
                        ? "text-zinc-400" 
                        : hasDebt 
                          ? "text-red-500 font-extrabold animate-pulse" 
                          : "text-zinc-400"
                    }`}>
                      {hasDebt ? "Con Deuda" : "Saldado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Client details and accounts receivable cards */}
        <div className="lg:col-span-8 space-y-6">
          {activeClient ? (
            <>
              {/* Client standing info card */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-150 pb-3 gap-3">
                  <div>
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-bold text-zinc-700 uppercase">
                      ID: {activeClient.id}
                    </span>
                    <h3 className="font-black text-base text-zinc-955 uppercase mt-1.5">{activeClient.nombre}</h3>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      activeClient.moroso 
                        ? "bg-red-50 border-red-200 text-red-650 animate-pulse" 
                        : "bg-emerald-50 border-emerald-250 text-emerald-700"
                    }`}>
                      {activeClient.moroso ? "● Cuenta Morosa" : "● Estatus Normal"}
                    </span>
                  </div>
                </div>

                {/* Balances summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                    <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider block">Saldo Deudor Acumulado</span>
                    <p className="font-black text-red-650 text-base mt-1 font-mono">
                      ${activeClient.saldoDeber.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>
                  
                  <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                    <span className="text-[9px] text-zinc-455 uppercase font-bold tracking-wider block">Límite de Crédito Mayorista</span>
                    <p className="font-bold text-zinc-800 text-sm mt-1 font-mono">
                      ${(activeClient.limiteCredito || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>

                  <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 text-left">
                    <span className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider block">Saldo a Favor (Abonos)</span>
                    <p className="font-black text-emerald-700 text-sm mt-1 font-mono">
                      +${activeClient.saldoFavor.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>

                {/* Credit limit visual indicator */}
                {activeClient.limiteCredito && activeClient.limiteCredito > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-650">
                      <span>Uso de Línea de Crédito</span>
                      <span>
                        {Math.min(100, Math.round((activeClient.saldoDeber / activeClient.limiteCredito) * 100))}% Utilizado
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-505 ${
                          (activeClient.saldoDeber / activeClient.limiteCredito) > 0.8
                            ? "bg-red-500"
                            : (activeClient.saldoDeber / activeClient.limiteCredito) > 0.5
                              ? "bg-amber-500"
                              : "bg-zinc-800"
                        }`}
                        style={{ width: `${Math.min(100, (activeClient.saldoDeber / activeClient.limiteCredito) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs for managing invoices and checking vouchers */}
              <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
                {/* Tabs selection */}
                <div className="bg-zinc-50 border-b border-zinc-200 flex text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab("facturas")}
                    className={`px-5 py-3.5 border-r border-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "facturas" 
                        ? "bg-white text-zinc-950 border-b-2 border-b-zinc-950 font-black" 
                        : "text-zinc-450 hover:text-zinc-805"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Facturas Pendientes
                  </button>
                  <button
                    onClick={() => setActiveTab("comprobantes")}
                    className={`px-5 py-3.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "comprobantes" 
                        ? "bg-white text-zinc-955 border-b-2 border-b-zinc-955 font-black" 
                        : "text-zinc-450 hover:text-zinc-805"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Registro de Comprobantes
                    {pendingVouchersCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.25 bg-amber-600 text-white rounded-full text-[8.5px] font-extrabold animate-pulse">
                        {pendingVouchersCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab content */}
                <div className="p-5">
                  {activeTab === "facturas" ? (
                    (() => {
                      // Find active unpaid invoices for this client
                      // Matches the client's name or reservation holder that contains client Name as agencyName
                      const activeResIds = reservations
                        .filter(r => r.agenciaName && r.agenciaName.toLowerCase() === activeClient.nombre.toLowerCase())
                        .map(r => r.id);

                      const unpaidInvoices = invoices.filter(inv => {
                        const matchesClient = inv.clientName.toLowerCase().includes(activeClient.nombre.toLowerCase()) || 
                                              activeResIds.some(rid => inv.clientName.includes(rid));
                        const isUnpaid = inv.status === "Facturado" || inv.status === "Vencido";
                        const isCollection = inv.type === "Cobro";
                        return matchesClient && isUnpaid && isCollection;
                      });

                      return (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs divide-y divide-zinc-200">
                              <thead>
                                <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                                  <th className="p-3">Factura</th>
                                  <th className="p-3">Detalle / Localizador</th>
                                  <th className="p-3">Emisión / Vence</th>
                                  <th className="p-3 text-right">Monto Deuda</th>
                                  <th className="p-3 text-center">Estatus</th>
                                  <th className="p-3 text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                {unpaidInvoices.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-zinc-450 italic bg-zinc-50/20">
                                      Este cliente no posee facturas pendientes de cobro en cartera.
                                    </td>
                                  </tr>
                                ) : (
                                  unpaidInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                                      <td className="p-3 font-mono font-bold text-zinc-950">{inv.id}</td>
                                      <td className="p-3 text-zinc-800 leading-tight">
                                        <p className="font-bold truncate max-w-[200px]">{inv.clientName}</p>
                                      </td>
                                      <td className="p-3 font-mono text-[10.5px]">
                                        <p>{formatDate(inv.date)}</p>
                                        <p className="text-red-500 font-bold mt-0.5">Vence: {formatDate(inv.dueDate)}</p>
                                      </td>
                                      <td className="p-3 text-right font-mono font-black text-zinc-900">${inv.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3 text-center">
                                        <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                                          inv.status === "Vencido" 
                                            ? "bg-red-50 text-red-750 border-red-200 animate-pulse" 
                                            : "bg-amber-50 text-amber-700 border-amber-250"
                                        }`}>
                                          {inv.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <button
                                          onClick={() => openRegisterPaymentModal(inv)}
                                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                                        >
                                          Registrar Pago
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Payment Vouchers list and auditing panel
                    (() => {
                      const clientVouchers = vouchers.filter(v => v.clientId === activeClient.id);

                      return (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs divide-y divide-zinc-200">
                              <thead>
                                <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                                  <th className="p-3">Voucher</th>
                                  <th className="p-3">Ref / Canal</th>
                                  <th className="p-3 text-right">Monto</th>
                                  <th className="p-3">Fecha</th>
                                  <th className="p-3 text-center">Estatus</th>
                                  <th className="p-3 text-right">Auditoría / Archivo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                {clientVouchers.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-zinc-450 italic bg-zinc-50/20">
                                      No se registran comprobantes de pago reportados por esta agencia.
                                    </td>
                                  </tr>
                                ) : (
                                  clientVouchers.map((vou) => (
                                    <tr key={vou.id} className="hover:bg-zinc-50/50 transition-colors">
                                      <td className="p-3 font-mono font-bold text-zinc-650">
                                        <p>{vou.id}</p>
                                        {vou.invoiceId && <p className="text-[9px] text-zinc-400 font-normal">Factura: {vou.invoiceId}</p>}
                                      </td>
                                      <td className="p-3 text-zinc-800">
                                        <p className="font-bold font-mono">{vou.reference}</p>
                                        <p className="text-[9.5px] text-zinc-455">{vou.method} {vou.bankName ? `(${vou.bankName})` : ""}</p>
                                      </td>
                                      <td className="p-3 text-right font-mono font-black text-zinc-900">${vou.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3 font-mono text-[10.5px]">{formatDate(vou.date)}</td>
                                      <td className="p-3 text-center">
                                        <span className={`text-[8.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${
                                          vou.status === "Verificado" 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                                            : vou.status === "Rechazado" 
                                              ? "bg-red-50 text-red-750 border-red-200" 
                                              : "bg-amber-50 text-amber-700 border-amber-250"
                                        }`}>
                                          {vou.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                          <button
                                            onClick={() => setSelectedVoucherForPreview(vou)}
                                            className="text-[10px] text-zinc-500 hover:text-zinc-900 font-bold font-mono tracking-wider flex items-center justify-end gap-1 cursor-pointer underline decoration-dotted"
                                            title="Ver comprobante adjunto"
                                          >
                                            📄 {vou.attachedFile || "Ver archivo"}
                                          </button>
                                          {vou.status === "Pendiente" && (
                                            <div className="flex gap-1.5 justify-end">
                                              <button
                                                onClick={() => handleVerifyVoucher(vou, false)}
                                                className="p-1 hover:bg-red-50 hover:text-red-700 border border-zinc-200 text-zinc-450 rounded cursor-pointer transition-colors"
                                                title="Rechazar Comprobante"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleVerifyVoucher(vou, true)}
                                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
                                                title="Verificar y Conciliar en Banco"
                                              >
                                                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                                                <span>Validar</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center text-zinc-450 italic shadow-xs">
              No se ha seleccionado ninguna agencia B2B en la cartera.
            </div>
          )}
        </div>
      </div>

      {/* REGISTER PAYMENT MODAL */}
      {showPaymentModal && activeClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5" /> Conciliar Recibo de Cobro
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Ingrese los datos de la transferencia reportada por la agencia {activeClient.nombre}
                </p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterPaymentSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">ID Factura Asociada</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full p-2 border border-zinc-200 bg-zinc-50 rounded text-xs font-mono font-bold text-zinc-550 focus:outline-none"
                    value={paymentForm.invoiceId}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Monto a Cobrar ($ USD)</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Método de Pago</label>
                  <select
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Efectivo USD">Efectivo USD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Nº de Referencia / Aprobación</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PM-12984729"
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Banco Receptor (Si aplica)</label>
                  <input
                    type="text"
                    placeholder="Ej: Chase Bank, Banesco..."
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-800 focus:outline-none"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Fecha de Transacción</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Notas y Concepto Interno</label>
                <textarea
                  rows={2}
                  placeholder="Escriba aquí observaciones adicionales del cobro..."
                  className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs text-zinc-700 font-semibold focus:outline-none"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Upload Voucher mock element */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Adjuntar Recibo de Pago (Simulado)</label>
                <div className="border border-dashed border-zinc-300 bg-zinc-50 rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100/60 transition-colors relative">
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
                  <UploadCloud className="w-6 h-6 text-zinc-450 mb-1" />
                  {paymentForm.attachedFile ? (
                    <p className="text-[10.5px] font-bold text-zinc-800">✓ Archivo: {paymentForm.attachedFile}</p>
                  ) : (
                    <>
                      <p className="text-[10.5px] font-bold text-zinc-700">Arrastre aquí o haga clic para subir comprobante</p>
                      <p className="text-[9.5px] text-zinc-400">PDF, JPG, PNG hasta 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Saldar y Conciliar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER PREVIEW MODAL */}
      {selectedVoucherForPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4.5 h-4.5" /> Vista del Comprobante
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Visualización de soporte digital adjuntado
                </p>
              </div>
              <button 
                onClick={() => setSelectedVoucherForPreview(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview Representation */}
            <div className="p-6 space-y-6">
              {/* Simulated Paper Receipt */}
              <div className="border border-zinc-200 bg-linear-to-b from-zinc-50 to-white rounded-lg p-5 shadow-xs relative overflow-hidden font-mono text-xs text-zinc-800 space-y-4">
                
                {/* Stamp */}
                {selectedVoucherForPreview.status === "Verificado" && (
                  <div className="absolute right-4 top-4 border-2 border-dashed border-emerald-500 text-emerald-500 font-extrabold uppercase px-2 py-1 rounded text-[10px] tracking-wider rotate-12 bg-white/80 z-10">
                    ✓ Conciliado
                  </div>
                )}
                {selectedVoucherForPreview.status === "Rechazado" && (
                  <div className="absolute right-4 top-4 border-2 border-dashed border-red-500 text-red-500 font-extrabold uppercase px-2 py-1 rounded text-[10px] tracking-wider rotate-12 bg-white/80 z-10">
                    ✕ Rechazado
                  </div>
                )}

                {/* Receipt Title */}
                <div className="text-center border-b border-dashed border-zinc-300 pb-3 space-y-1 font-sans">
                  <h5 className="font-black text-xs uppercase tracking-wider text-zinc-900">
                    {selectedVoucherForPreview.method === "Zelle" ? "Receipt of Transaction" : "Comprobante de Pago"}
                  </h5>
                  <p className="text-[10px] text-zinc-500 font-semibold">
                    {selectedVoucherForPreview.bankName || "Plataforma Digital"}
                  </p>
                </div>

                {/* Receipt Fields */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">ID Voucher:</span>
                    <span className="font-bold">{selectedVoucherForPreview.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Cliente B2B:</span>
                    <span className="font-bold uppercase text-right max-w-[70%] truncate" title={selectedVoucherForPreview.clientName}>
                      {selectedVoucherForPreview.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Referencia:</span>
                    <span className="font-bold font-mono">{selectedVoucherForPreview.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Canal/Método:</span>
                    <span className="font-bold">{selectedVoucherForPreview.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Fecha Valor:</span>
                    <span className="font-bold font-mono">{selectedVoucherForPreview.date}</span>
                  </div>
                  {selectedVoucherForPreview.invoiceId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Factura Ref:</span>
                      <span className="font-bold font-mono">{selectedVoucherForPreview.invoiceId}</span>
                    </div>
                  )}
                  {selectedVoucherForPreview.locatorId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-450 uppercase text-[9px] font-bold font-sans">Expediente:</span>
                      <span className="font-bold font-mono text-zinc-900">{selectedVoucherForPreview.locatorId}</span>
                    </div>
                  )}
                </div>

                {/* Amount Section */}
                <div className="border-t border-b border-dashed border-zinc-300 py-3 flex justify-between items-center font-sans">
                  <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Monto Transferido</span>
                  <span className="text-base font-black text-zinc-950 font-mono">
                    ${selectedVoucherForPreview.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                  </span>
                </div>

                {/* Notes Section */}
                {selectedVoucherForPreview.notes && (
                  <div className="text-[10px] text-zinc-500 font-sans italic bg-zinc-100/50 p-2 rounded border border-zinc-200">
                    <span className="font-bold not-italic block uppercase text-[8px] text-zinc-400 tracking-wide mb-0.5">Observaciones:</span>
                    {selectedVoucherForPreview.notes}
                  </div>
                )}

                {/* File Attachment Details */}
                <div className="text-center font-sans text-[10px] text-zinc-400 font-semibold pt-1">
                  Archivo: <span className="font-mono underline text-zinc-500">{selectedVoucherForPreview.attachedFile}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 font-sans">
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForPreview(null)}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer text-center"
                >
                  Cerrar Vista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

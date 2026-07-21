import { FlightTicket } from "./types/aereos";
import React, { useState } from "react";
import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, DirectClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher, CompanyConfig, ExchangeRate, WithholdingCertificate, JournalEntry, CustomRate, WalletTransaction } from "./types";
import { TaxJurisdiction, DEFAULT_JURISDICTION, setOperatingCurrency, getCurrencySymbol } from "./lib/taxEngine";
import { Property, RoomType, RatePlan, StopSale, ExtraService, ServiceRate, Proveedor } from "./types/producto";

import {
  listReservations, insertReservation, updateReservation, deleteReservation,
  listClients, insertClient, deleteClient,
  listDirectClients, insertDirectClient, updateDirectClient, deleteDirectClient,
  listInvoices, insertInvoice, deleteInvoice,
  listDetailedProperties, insertDetailedProperty, updateDetailedProperty, deleteDetailedProperty,
  listRoomTypes, insertRoomType, updateRoomType, deleteRoomType,
  listRatePlans, insertRatePlan, updateRatePlan, deleteRatePlan,
  listStopSales, insertStopSale, updateStopSale, deleteStopSale,
  listFlightTickets, insertFlightTicket, updateFlightTicket, deleteFlightTicket,
  listTransferServices, insertTransferService, updateTransferService, deleteTransferService,
  listFleetVehicles, insertFleetVehicle, updateFleetVehicle, deleteFleetVehicle,
  listFleetDrivers, insertFleetDriver, updateFleetDriver, deleteFleetDriver,
  listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher, deletePaymentVoucher,
  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,
  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate,
  updateInvoice, updateClient,
  listPayableObligations, insertPayableObligation, updatePayableObligation, deletePayableObligation,
  listProviderStatements, insertProviderStatement, deleteProviderStatement,
  listProveedores, insertProveedor, updateProveedor, deleteProveedor,
  listTaxJurisdictions, listExchangeRates, listWithholdingCertificates, listJournalEntries,
  upsertTaxJurisdiction, insertExchangeRate, insertWithholdingCertificate,
  listCustomRates, upsertCustomRate, deleteCustomRate,
  listWalletTransactions, insertWalletTransaction,
  deleteWithholdingCertificate, insertJournalEntry,
  listUsuarios, insertUsuario, updateUsuario, deleteUsuario,
  listRoles, insertRol, updateRol, deleteRol,
  listReglasAutorizacion, insertReglaAutorizacion, updateReglaAutorizacion,
  listSolicitudesAutorizacion, insertSolicitudAutorizacion, resolveSolicitudAutorizacion,
  listRegistrosAuditoria, insertRegistroAuditoria, deleteRegistrosAuditoriaByEntidad,
} from "./lib/dataconnect-shim";
import { isAuthenticated } from "./lib/api";
import LoginScreen from "./components/LoginScreen";
import { useAuth } from "./context/AuthContext";
import { usePermissions } from "./hooks/usePermissions";
import { useDialog } from "./components/ui/DialogProvider";
import { Usuario, Rol, ReglaAutorizacion, SolicitudAutorizacion, RegistroAuditoria } from "./types/usuarios";
const dataConnect = null;

import { 
  initialProperties, 
  initialReservas, 
  initialFlights, 
  initialTransfers, 
  initialInvoices,
  initialClients,
  initialDetailedProperties,
  initialRoomTypes,
  initialRatePlans,
  initialStopSales,
  initialFleetVehicles,
  initialFleetDrivers,
  initialPayableObligations,
  initialProviderStatements
} from "./mockData";
import PropiedadesView from "./views/PropiedadesView";
import ReservasView from "./views/ReservasView";
import VuelosView from "./views/VuelosView";
import OperacionesView from "./views/OperacionesView";
import AdministracionView from "./views/AdministracionView";
import ClientesView from "./views/ClientesView";
import FacturacionView from "./views/FacturacionView";
import CobranzasView from "./views/CobranzasView";
import CuentasPorPagarView from "./views/CuentasPorPagarView";
import ConfiguracionView from "./views/ConfiguracionView";
import { reconcileDossierUpdate } from "./lib/financialReconciler";
import { resolveSaleClient } from "./lib/clientResolver";
import { nextSequentialId } from "./lib/idGenerator";
import { round2 } from "./lib/money";

import ServiciosView from "./views/ServiciosView";
import BuscadorGlobalView from "./views/BuscadorGlobalView";
import ProveedoresView from "./views/ProveedoresView";
import ContabilidadView from "./views/ContabilidadView";
import { ChevronDown, Search, Box, Activity, Receipt, CreditCard, ArrowDownRight, Briefcase } from "lucide-react";


import { 
  Building2, 
  Calendar, 
  Plane, 
  Route, 
  Wallet, 
  Compass, 
  Settings, 
  HelpCircle,
  Sparkles,
  LayoutDashboard,
  Bell,
  RefreshCw,
  Globe,
  Check,
  Eye,
  Users,
  FileText,
  ReceiptText,
  TrendingDown,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const { usuario, cerrarSesion } = useAuth();
  const { puedeVerModulo, esAdministrador } = usePermissions();
  const { showAlert } = useDialog();

  // Navigation Section — se recuerda entre recargas de página
  const [currentSection, setCurrentSectionState] = useState<ProjectView>(() => {
    const saved = localStorage.getItem("currentSection");
    return (saved && Object.values(ProjectView).includes(saved as ProjectView))
      ? (saved as ProjectView)
      : ProjectView.PROPIEDADES;
  });
  const setCurrentSection = (section: ProjectView) => {
    localStorage.setItem("currentSection", section);
    setCurrentSectionState(section);
  };

  // App state managers
  const [properties, setProperties] = useState<HotelProperty[]>(initialProperties);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservas);
  const [flights, setFlights] = useState<FlightLeg[]>(initialFlights);
  const [boletos, setBoletos] = useState<FlightTicket[]>([]);
  const [transfers, setTransfers] = useState<TransferService[]>(initialTransfers);
  const [invoices, setInvoices] = useState<FinancialInvoice[]>(initialInvoices);
  const [clients, setClients] = useState<B2BClient[]>(initialClients);
  const [directClients, setDirectClients] = useState<DirectClient[]>([]);
  // Tasas personalizables (BCV, Preferencial, Euro, ...) editables en Ajustes y persistidas en el
  // backend. Fallback a localStorage / defaults para que el header nunca quede vacío.
  const DEFAULT_CUSTOM_RATES: CustomRate[] = [
    { id: "rate-eur", label: "Euro", fromCurrency: "USD", toCurrency: "EUR", value: 0.92, showInHeader: true, sortOrder: 0 },
    { id: "rate-bcv", label: "BCV", fromCurrency: "USD", toCurrency: "VES", value: 45.50, showInHeader: true, sortOrder: 1 },
  ];
  const [customRates, setCustomRates] = useState<CustomRate[]>(() => {
    const saved = localStorage.getItem("custom_rates");
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return DEFAULT_CUSTOM_RATES;
  });

  const persistCustomRates = (next: CustomRate[]) => {
    setCustomRates(next);
    localStorage.setItem("custom_rates", JSON.stringify(next));
  };
  const handleUpsertCustomRate = async (rate: CustomRate) => {
    const exists = customRates.some(r => r.id === rate.id);
    persistCustomRates(exists ? customRates.map(r => r.id === rate.id ? rate : r) : [...customRates, rate]);
    try { await upsertCustomRate(dataConnect, rate); } catch (e) {}
  };
  const handleDeleteCustomRate = async (id: string) => {
    persistCustomRates(customRates.filter(r => r.id !== id));
    try { await deleteCustomRate(dataConnect, { id }); } catch (e) {}
  };

  // Billetera (wallet) de clientes: historial de movimientos. El saldo vigente sigue en
  // client.saldoFavor; esto es el ledger persistido.
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const handleAddWalletTransaction = async (tx: WalletTransaction) => {
    // Un abono en efectivo (Deposito) también queda registrado como voucher (VOU-) en el registro
    // de comprobantes del cliente. Guardamos su id en la tx (voucherId) para el comprobante. Sin
    // invoiceId + status Verificado: es un ingreso a saldo a favor, no altera el neteo de deuda.
    let finalTx = tx;
    if (tx.type === "Deposito") {
      const voucherId = nextSequentialId("VOU", vouchers.map(v => v.id));
      finalTx = { ...tx, voucherId };
      handleAddVoucher({
        id: voucherId,
        clientId: tx.clientId,
        clientName: tx.clientName,
        invoiceId: undefined,
        locatorId: tx.reservationId || undefined,
        method: tx.method || "Efectivo",
        reference: tx.reference || `WLT-${tx.id}`,
        amount: tx.amount,
        date: tx.date,
        status: "Verificado",
        bankName: tx.office ? `Oficina ${tx.office}` : undefined,
        notes: tx.notes ? `Abono a billetera. ${tx.notes}` : "Abono a billetera (saldo a favor)",
      });
    }
    setWalletTransactions(prev => [...prev, finalTx]);
    try { await insertWalletTransaction(dataConnect, finalTx); } catch (e) {}
  };

  // Accounting & Fiscal module state
  const [jurisdiction, setJurisdiction] = useState<TaxJurisdiction>(() => {
    const saved = localStorage.getItem("tax_jurisdiction");
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return DEFAULT_JURISDICTION;
  });
  const [fiscalExchangeRates, setFiscalExchangeRates] = useState<ExchangeRate[]>(() => {
    const saved = localStorage.getItem("fiscal_exchange_rates");
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });
  const [withholdingCertificates, setWithholdingCertificates] = useState<WithholdingCertificate[]>(() => {
    const saved = localStorage.getItem("withholding_certificates");
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("journal_entries");
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayExchangeRate = fiscalExchangeRates.find(
    r => r.date === todayStr && r.toCurrency === jurisdiction.localCurrency
  )?.rate;

  const handleSaveJurisdiction = async (j: TaxJurisdiction) => {
    setJurisdiction(j);
    localStorage.setItem("tax_jurisdiction", JSON.stringify(j));
    try {
      await upsertTaxJurisdiction(dataConnect, {
        ...j,
        surchargePaymentMethods: JSON.stringify(j.surchargePaymentMethods ?? []),
        vatWithholdingOptions: JSON.stringify(j.vatWithholdingOptions ?? []),
        incomeTaxWithholdingOptions: JSON.stringify(j.incomeTaxWithholdingOptions ?? []),
      });
    } catch (e) { console.error("Error persisting jurisdiction", e); }
  };

  const handleAddExchangeRate = async (r: ExchangeRate) => {
    setFiscalExchangeRates(prev => {
      const filtered = prev.filter(x => !(x.date === r.date && x.toCurrency === r.toCurrency));
      const next = [r, ...filtered];
      localStorage.setItem("fiscal_exchange_rates", JSON.stringify(next));
      return next;
    });
    try { await insertExchangeRate(dataConnect, r); } catch (e) {}
  };

  const handleAddWithholdingCertificate = async (cert: WithholdingCertificate) => {
    setWithholdingCertificates(prev => {
      const next = [cert, ...prev];
      localStorage.setItem("withholding_certificates", JSON.stringify(next));
      return next;
    });
    try { await insertWithholdingCertificate(dataConnect, cert); } catch (e) {}
  };

  const handleDeleteWithholdingCertificate = async (id: string) => {
    setWithholdingCertificates(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem("withholding_certificates", JSON.stringify(next));
      return next;
    });
    try { await deleteWithholdingCertificate(dataConnect, { id }); } catch (e) {}
  };

  const handleAddJournalEntry = async (entry: JournalEntry) => {
    setJournalEntries(prev => {
      const next = [entry, ...prev];
      localStorage.setItem("journal_entries", JSON.stringify(next));
      return next;
    });
    try {
      await insertJournalEntry(dataConnect, { ...entry, lines: JSON.stringify(entry.lines) });
    } catch (e) {}
  };

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem("company_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: "Foratour Wholesale",
      subtitle: "OPERADOR MAYORISTA DE TURISMO",
      tagline: "Operador Mayorista de Turismo",
      rif: "J-30495810-9",
      address: "Av. Francisco de Miranda, Edif. Parque Cristal, Piso 8",
      phone: "+58 (212) 285-4521",
      email: "administracion@foratour-erp.com",
      logoLetter: "F",
      currency: "USD"
    };
  });

  // Fija la moneda de operación (usada por getOperatingCurrency en las vistas) desde la config.
  React.useEffect(() => { setOperatingCurrency(companyConfig.currency); }, [companyConfig.currency]);

  const handleUpdateCompanyConfig = (updated: CompanyConfig) => {
    setCompanyConfig(updated);
    localStorage.setItem("company_config", JSON.stringify(updated));
  };

  const [detailedProperties, setDetailedProperties] = useState<Property[]>(initialDetailedProperties);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>(initialRatePlans);
  const [stopSales, setStopSales] = useState<StopSale[]>(initialStopSales);

  // Fleet state
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>(initialFleetVehicles);
  const [fleetDrivers, setFleetDrivers] = useState<FleetDriver[]>(initialFleetDrivers);

  // Accounts Payable state
  const [payableObligations, setPayableObligations] = useState<PayableObligation[]>(initialPayableObligations);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>([]);

  const [providerStatements, setProviderStatements] = useState<ProviderStatement[]>(initialProviderStatements);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const handleAddProveedor = async (p: Proveedor) => {
    setProveedores(prev => [...prev, p]);
    try {
      await insertProveedor(dataConnect, p);
    } catch (e) {
      console.error("Failed to insert proveedor", e);
    }
  };

  const handleUpdateProveedor = async (p: Proveedor) => {
    setProveedores(prev => prev.map(x => x.id === p.id ? p : x));
    try {
      await updateProveedor(dataConnect, p);
    } catch (e) {
      console.error("Failed to update proveedor", e);
    }
  };

  const handleDeleteProveedor = async (id: string) => {
    try {
      setProveedores(prev => prev.filter(p => p.id !== id));
      await deleteProveedor(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete proveedor", e);
    }
  };

  // ── Usuarios, Roles y Permisos ────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [reglasAutorizacion, setReglasAutorizacion] = useState<ReglaAutorizacion[]>([]);
  const [solicitudesAutorizacion, setSolicitudesAutorizacion] = useState<SolicitudAutorizacion[]>([]);
  const [registrosAuditoria, setRegistrosAuditoria] = useState<RegistroAuditoria[]>([]);

  const parseRol = (r: any): Rol => ({ ...r, permisos: r.permisosJson ? JSON.parse(r.permisosJson) : {} });

  const handleAddUsuario = async (dto: { id: string; username: string; password: string; nombre: string; email: string; rolId: string }) => {
    setUsuarios(prev => [...prev, { id: dto.id, username: dto.username, nombre: dto.nombre, email: dto.email, rolId: dto.rolId, activo: true }]);
    try {
      await insertUsuario(dataConnect, dto);
    } catch (e) {
      console.error("Failed to insert usuario", e);
    }
  };

  const handleUpdateUsuario = async (id: string, dto: any) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...dto } : u));
    try {
      await updateUsuario(dataConnect, { id, ...dto });
    } catch (e) {
      console.error("Failed to update usuario", e);
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (usuario?.id === id) {
      showAlert({ title: "Acción no permitida", message: "No puedes eliminar tu propio usuario.", type: "warning" });
      return;
    }
    const objetivo = usuarios.find(u => u.id === id);
    const rolObjetivo = objetivo ? roles.find(r => r.id === objetivo.rolId) : undefined;
    if (rolObjetivo?.esAdministrador) {
      const quedanOtrosAdminsActivos = usuarios.some(u =>
        u.id !== id && u.activo && roles.find(r => r.id === u.rolId)?.esAdministrador
      );
      if (!quedanOtrosAdminsActivos) {
        showAlert({ title: "Acción no permitida", message: "No puedes eliminar al último Administrador activo del sistema.", type: "warning" });
        return;
      }
    }
    try {
      setUsuarios(prev => prev.filter(u => u.id !== id));
      await deleteUsuario(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete usuario", e);
    }
  };

  const handleAddRol = async (rol: Rol) => {
    setRoles(prev => [...prev, rol]);
    try {
      // "permisos" es solo el objeto ya parseado para uso en el frontend — Data Connect
      // rechaza la mutación si se le manda una variable no declarada ($permisos), así
      // que solo se envía su versión serializada (permisosJson).
      const { permisos, ...rest } = rol;
      await insertRol(dataConnect, { ...rest, permisosJson: JSON.stringify(permisos) });
    } catch (e) {
      console.error("Failed to insert rol", e);
    }
  };

  const handleUpdateRol = async (rol: Rol) => {
    setRoles(prev => prev.map(r => r.id === rol.id ? rol : r));
    try {
      const { permisos, ...rest } = rol;
      await updateRol(dataConnect, { ...rest, permisosJson: JSON.stringify(permisos) });
    } catch (e) {
      console.error("Failed to update rol", e);
    }
  };

  const handleDeleteRol = async (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    try {
      await deleteRol(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete rol", e);
    }
  };

  const handleAddRegistroAuditoria = async (registro: Omit<RegistroAuditoria, "id" | "createdAt">) => {
    // El id se genera acá (no en cada call-site) porque este es el único lugar que tiene
    // la lista completa y actualizada de registros — generarlo con una lista parcial o
    // vacía produce el mismo id siempre y choca contra la unique key en el 2do insert.
    const full: RegistroAuditoria = {
      ...registro,
      id: nextSequentialId("AUD", registrosAuditoria.map(r => r.id)),
      createdAt: new Date().toISOString(),
    };
    setRegistrosAuditoria(prev => [full, ...prev]);
    try {
      await insertRegistroAuditoria(dataConnect, full);
    } catch (e) {
      console.error("Failed to insert registro de auditoría", e);
    }
  };

  // Registra un evento en el HISTORIAL de un expediente de reserva. Centraliza autoría
  // (usuario logueado) y el vínculo entidadTipo="Reserva"/entidadId=localizador, de modo
  // que todo cambio de la vida de una reserva —en cualquier departamento— quede atado a su
  // expediente y sea visible en la pestaña "Historial" (ReservasView). Si no hay expediente
  // al que atarlo (entidadId vacío), no registra.
  const logReserva = (
    entidadId: string | undefined | null,
    tipo: RegistroAuditoria["tipo"],
    detalle: string,
  ) => {
    if (!entidadId) return;
    handleAddRegistroAuditoria({
      tipo,
      detalle,
      entidadTipo: "Reserva",
      entidadId,
      usuarioId: usuario?.id ?? "sistema",
      usuarioNombre: usuario?.nombre ?? "Sistema",
    });
  };

  // Formato de importes para los detalles del historial (sin símbolo: el ERP es multimoneda)
  const fmtMonto = (n: any) =>
    Number(n ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAddReglaAutorizacion = async (regla: ReglaAutorizacion) => {
    setReglasAutorizacion(prev => [...prev, regla]);
    try {
      await insertReglaAutorizacion(dataConnect, regla);
    } catch (e) {
      console.error("Failed to insert regla de autorización", e);
    }
  };

  const handleUpdateReglaAutorizacion = async (regla: ReglaAutorizacion) => {
    setReglasAutorizacion(prev => prev.map(r => r.id === regla.id ? regla : r));
    try {
      await updateReglaAutorizacion(dataConnect, regla);
    } catch (e) {
      console.error("Failed to update regla de autorización", e);
    }
  };

  const handleCreateSolicitudAutorizacion = async (solicitud: Omit<SolicitudAutorizacion, "id">) => {
    const full: SolicitudAutorizacion = { ...solicitud, id: nextSequentialId("SOL", solicitudesAutorizacion.map(s => s.id)) };
    setSolicitudesAutorizacion(prev => [full, ...prev]);
    try {
      await insertSolicitudAutorizacion(dataConnect, full);
    } catch (e) {
      console.error("Failed to insert solicitud de autorización", e);
    }
  };

  const handleResolveSolicitudAutorizacion = async (id: string, dto: { estado: "Aprobada" | "Rechazada"; comentarioResolucion?: string; resolutorId: string }) => {
    const resolvedAt = new Date().toISOString();
    setSolicitudesAutorizacion(prev => prev.map(s => s.id === id ? { ...s, ...dto, resolvedAt } : s));
    try {
      await resolveSolicitudAutorizacion(dataConnect, { id, ...dto });
    } catch (e) {
      console.error("Failed to resolve solicitud de autorización", e);
    }
  };

  const handleUpdateObligation = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    if (typeof updated.netCost === "number") updated.netCost = round2(updated.netCost);
    if (typeof updated.paidAmount === "number") updated.paidAmount = round2(updated.paidAmount);
    setPayableObligations(prev => prev.map(o => o.id === updated.id ? updated : o));
    try {
      await updatePayableObligation(dataConnect, {
        id: updated.id,
        dueDate: updated.dueDate,
        providerName: updated.providerName,
        serviceDetail: updated.serviceDetail,
        locatorId: updated.locatorId,
        netCost: updated.netCost,
        paidAmount: updated.paidAmount,
        status: updated.status,
        paymentMethod: updated.paymentMethod,
        reference: updated.reference,
        notes: updated.notes,
        date: updated.date,
        currency: updated.currency,
        attachedFile: updated.attachedFile,
        updatedAt: updated.updatedAt
      });
    } catch (e) {
      console.error("Failed to update obligation", e);
      alert(`Error al actualizar la cuenta por pagar: ${(e as any)?.message || e}`);
    }
    logReserva(
      updated.locatorId,
      "PagoProveedor",
      `Cuenta por pagar ${updated.id} · ${updated.providerName ?? "proveedor"} → ${updated.status}${updated.paidAmount != null ? ` (pagado ${fmtMonto(updated.paidAmount)})` : ""}`,
    );

    // Si la obligación saldada corresponde a un BOLETO aéreo (locatorId = BOL-x), cerrar su
    // ciclo pasando el expediente a "PagadoAerolinea" (antes era un estado muerto/inalcanzable).
    if (updated.status === "Pagado Total") {
      // La obligación aérea puede estar enlazada por el id del boleto (BOL-x) o del expediente (AER-x).
      const boleto = boletos.find(b => (b.id === updated.locatorId || b.expedienteAereo?.id === updated.locatorId) && b.expedienteAereo);
      if (boleto?.expedienteAereo && boleto.expedienteAereo.status !== "PagadoAerolinea") {
        const nb: FlightTicket = { ...boleto, expedienteAereo: { ...boleto.expedienteAereo, status: "PagadoAerolinea" } };
        setBoletos(prev => prev.map(b => b.id === nb.id ? nb : b));
        try { await updateFlightTicket(dataConnect, { ...nb }); } catch (e) { console.error("Failed to close aereo cycle", e); }
      }
    }
  };

  const handleAddPayableObligation = async (newObligation: any) => {
    newObligation.updatedAt = new Date().toISOString();
    if (typeof newObligation.netCost === "number") newObligation.netCost = round2(newObligation.netCost);
    if (typeof newObligation.paidAmount === "number") newObligation.paidAmount = round2(newObligation.paidAmount);
    setPayableObligations(prev => [newObligation, ...prev]);
    try {
      await insertPayableObligation(dataConnect, {
        id: newObligation.id,
        dueDate: newObligation.dueDate,
        providerName: newObligation.providerName,
        serviceDetail: newObligation.serviceDetail,
        locatorId: newObligation.locatorId,
        netCost: newObligation.netCost,
        paidAmount: newObligation.paidAmount,
        status: newObligation.status,
        paymentMethod: newObligation.paymentMethod,
        reference: newObligation.reference,
        notes: newObligation.notes,
        date: newObligation.date,
        currency: newObligation.currency,
        attachedFile: newObligation.attachedFile,
        updatedAt: newObligation.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert obligation", e);
      alert(`Error al guardar la cuenta por pagar al proveedor: ${(e as any)?.message || e}. La obligación no quedó registrada, por favor reintente.`);
    }
    logReserva(
      newObligation.locatorId,
      "ObligacionCreada",
      `Cuenta por pagar a ${newObligation.providerName ?? "proveedor"} por ${fmtMonto(newObligation.netCost)}`,
    );
  };

  const handleAddStatement = async (newDoc: any) => {
    newDoc.updatedAt = new Date().toISOString();
    setProviderStatements(prev => [newDoc, ...prev]);
    try {
      await insertProviderStatement(dataConnect, {
        id: newDoc.id,
        providerName: newDoc.providerName,
        date: newDoc.date,
        type: newDoc.type,
        amount: newDoc.amount,
        reference: newDoc.reference,
        status: newDoc.status,
        updatedAt: newDoc.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert statement", e);
      alert(`Error al guardar el estado de cuenta del proveedor: ${(e as any)?.message || e}. Por favor reintente.`);
    }
  };



  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ comercial: true, operaciones: true, finanzas: true, directorio: true });
  const toggleMenu = (key: string) => setExpandedMenus(p => ({ ...p, [key]: !p[key] }));

  // Preferencia de sidebar colapsado, persistida para que sobreviva a recargas — en pantallas
  // chicas (ej. MacBook Air) colapsar el sidebar recupera ~220px de ancho útil de contenido.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem("erp-sidebar-collapsed") === "true");
  React.useEffect(() => {
    localStorage.setItem("erp-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);


  React.useEffect(() => {
    // No hay sesión todavía (recién montado, antes de loguear) — no tiene sentido pedir
    // datos que van a fallar con 401. Este efecto se vuelve a disparar en cuanto
    // `authenticated` pase a true (justo después del login), gracias a estar en las deps.
    if (!authenticated) return;
    async function loadData() {
      // Cada recurso se carga AISLADO: un fallo transitorio de un endpoint (p.ej. un 500
      // esporádico de Data Connect/Cloud SQL) no debe abortar la carga del resto. Antes,
      // un solo await que lanzara saltaba al catch general y dejaba sin cargar todo lo que
      // venía después — incluida la auditoría, por lo que el historial del expediente
      // "desaparecía" al recargar cada vez que un endpoint previo fallaba.
      const safe = async (label: string, fn: () => Promise<void>) => {
        try { await fn(); }
        catch (e) { console.error(`Failed to load ${label}`, e); }
      };
      try {
        await safe("reservations", async () => {
          const res = await listReservations(dataConnect);
          if (res.data.reservations.length > 0) setReservations(res.data.reservations);
        });
        await safe("clients", async () => {
          const cli = await listClients(dataConnect);
          if (cli.data.b2BClients.length > 0) setClients(cli.data.b2BClients);
        });
        await safe("direct-clients", async () => {
          const dcli = await listDirectClients(dataConnect);
          if (dcli.data.directClients.length > 0) setDirectClients(dcli.data.directClients);
        });
        await safe("invoices", async () => {
          const inv = await listInvoices(dataConnect);
          if (inv.data.financialInvoices.length > 0) setInvoices(inv.data.financialInvoices);
        });
        await safe("detailed-properties", async () => {
          const props = await listDetailedProperties(dataConnect);
          if (props.data.detailedProperties.length > 0) setDetailedProperties(props.data.detailedProperties);
        });
        await safe("room-types", async () => {
          const rooms = await listRoomTypes(dataConnect);
          if (rooms.data.roomTypes.length > 0) {
            setRoomTypes(rooms.data.roomTypes.map((r: any) => ({
              ...r,
              property_id: r.propertyId
            })));
          }
        });
        await safe("rate-plans", async () => {
          const rates = await listRatePlans(dataConnect);
          if (rates.data.ratePlans.length > 0) {
            setRatePlans(rates.data.ratePlans.map((rp: any) => ({
              ...rp,
              property_id: rp.propertyId,
              roomType_id: rp.roomTypeId
            })));
          }
        });
        await safe("stop-sales", async () => {
          const stops = await listStopSales(dataConnect);
          if (stops.data.stopSales.length > 0) {
            setStopSales(stops.data.stopSales.map((s: any) => ({
              ...s,
              property_id: s.propertyId
            })));
          }
        });
        await safe("flight-tickets", async () => {
          const tickets = await listFlightTickets(dataConnect);
          if (tickets.data.flightTickets.length > 0) setBoletos(tickets.data.flightTickets);
        });
        await safe("transfers", async () => {
          const trans = await listTransferServices(dataConnect);
          if (trans.data.transferServices.length > 0) setTransfers(trans.data.transferServices);
        });
        await safe("fleet-vehicles", async () => {
          const veh = await listFleetVehicles(dataConnect);
          if (veh.data.fleetVehicles.length > 0) setFleetVehicles(veh.data.fleetVehicles);
        });
        await safe("fleet-drivers", async () => {
          const dri = await listFleetDrivers(dataConnect);
          if (dri.data.fleetDrivers.length > 0) setFleetDrivers(dri.data.fleetDrivers);
        });
        await safe("vouchers", async () => {
          const vou = await listPaymentVouchers(dataConnect);
          if (vou.data.paymentVouchers.length > 0) setVouchers(vou.data.paymentVouchers);
        });
        await safe("extra-services", async () => {
          const ext = await listExtraServices(dataConnect);
          if (ext.data.extraServices.length > 0) setExtraServices(ext.data.extraServices);
        });
        await safe("service-rates", async () => {
          const srv = await listServiceRates(dataConnect);
          if (srv.data.serviceRates.length > 0) setServiceRates(srv.data.serviceRates);
        });
        await safe("payable-obligations", async () => {
          const obs = await listPayableObligations(dataConnect);
          if (obs.data.payableObligations.length > 0) setPayableObligations(obs.data.payableObligations);
        });
        await safe("provider-statements", async () => {
          const stm = await listProviderStatements(dataConnect);
          if (stm.data.providerStatements.length > 0) setProviderStatements(stm.data.providerStatements);
        });
        await safe("proveedores", async () => {
          const provs = await listProveedores(dataConnect);
          if (provs.data.proveedores.length > 0) setProveedores(provs.data.proveedores);
        });
        // Fiscal data — each in its own try so DB failures don't block localStorage state
        try {
          const jur = await listTaxJurisdictions();
          if (jur.data.taxJurisdictions.length > 0) {
            const j: any = jur.data.taxJurisdictions[0];
            if (typeof j.surchargePaymentMethods === 'string') j.surchargePaymentMethods = JSON.parse(j.surchargePaymentMethods);
            if (typeof j.vatWithholdingOptions === 'string') j.vatWithholdingOptions = JSON.parse(j.vatWithholdingOptions);
            if (typeof j.incomeTaxWithholdingOptions === 'string') j.incomeTaxWithholdingOptions = JSON.parse(j.incomeTaxWithholdingOptions);
            setJurisdiction(j);
            localStorage.setItem("tax_jurisdiction", JSON.stringify(j));
          }
        } catch (e) {}
        try {
          const er = await listExchangeRates();
          if (er.data.exchangeRates.length > 0) {
            setFiscalExchangeRates(er.data.exchangeRates);
            localStorage.setItem("fiscal_exchange_rates", JSON.stringify(er.data.exchangeRates));
          }
        } catch (e) {}
        try {
          const cr = await listCustomRates();
          if (cr.data.customRates.length > 0) {
            setCustomRates(cr.data.customRates);
            localStorage.setItem("custom_rates", JSON.stringify(cr.data.customRates));
          }
        } catch (e) {}
        try {
          const wt = await listWalletTransactions();
          if (wt.data.walletTransactions.length > 0) setWalletTransactions(wt.data.walletTransactions);
        } catch (e) {}
        try {
          const wh = await listWithholdingCertificates();
          if (wh.data.withholdingCertificates.length > 0) {
            setWithholdingCertificates(wh.data.withholdingCertificates);
            localStorage.setItem("withholding_certificates", JSON.stringify(wh.data.withholdingCertificates));
          }
        } catch (e) {}
        try {
          const je = await listJournalEntries();
          if (je.data.journalEntries.length > 0) {
            const entries = je.data.journalEntries.map((e: any) => ({
              ...e,
              lines: typeof e.lines === 'string' ? JSON.parse(e.lines) : e.lines,
            }));
            setJournalEntries(entries);
            localStorage.setItem("journal_entries", JSON.stringify(entries));
          }
        } catch (e) {}
        // Usuarios/Roles/Autorizaciones — cada uno en su propio try para no bloquear
        // el resto de la carga si el módulo aún no fue desplegado en el backend.
        try {
          const rls = await listRoles(dataConnect);
          if (rls.data.roles.length > 0) setRoles(rls.data.roles.map(parseRol));
        } catch (e) {}
        try {
          const usrs = await listUsuarios(dataConnect);
          if (usrs.data.usuarios.length > 0) setUsuarios(usrs.data.usuarios);
        } catch (e) {}
        try {
          const reglas = await listReglasAutorizacion(dataConnect);
          if (reglas.data.reglas.length > 0) setReglasAutorizacion(reglas.data.reglas);
        } catch (e) {}
        try {
          const solicitudes = await listSolicitudesAutorizacion(dataConnect);
          if (solicitudes.data.solicitudes.length > 0) setSolicitudesAutorizacion(solicitudes.data.solicitudes);
        } catch (e) {}
        try {
          const auditoria = await listRegistrosAuditoria(dataConnect);
          if (auditoria.data.registros.length > 0) setRegistrosAuditoria(auditoria.data.registros);
        } catch (e) {}
      } catch (err) {
        console.error("Failed to load Firebase data", err);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);


  // Trigger cross-view state propagation
  const handleUpdateProperty = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Arma los TransferService (traslado de ida + retorno si aplica) para un expediente que
  // vendió Traslado/Rent a Car — compartido entre handleAddReservation y handleUpdateReservation
  // para que agregar un traslado a un expediente YA EXISTENTE también alimente Operaciones
  // Receptivo (antes solo se generaba al crear el expediente). El proveedor se toma del
  // ServiceItem realmente guardado (transSupplier/carSupplier elegido en Reservas), no de un
  // valor fijo, para que Receptivo refleje el proveedor real de cada traslado.
  const buildTransferServicesForReservation = (
    res: any,
    existingTransferIds: string[],
    flightsList: FlightLeg[]
  ): TransferService[] => {
    const tServicio = res.servicios?.find((s: any) => s.tipo === "Traslado" || s.tipo === "Rent a Car");
    if (!tServicio) return [];
    const tDet = tServicio.detalles || {};
    const matchedFlight = flightsList.find(f => f.flightNo === res.flightNo);
    const defaultAirport = matchedFlight
      ? `Llegadas Aeropuerto (Vuelo ${matchedFlight.flightNo})`
      : "Aeropuerto Internacional Local";
    const provider = tServicio.proveedor || "Foratour Receptivo S.A.";
    const esOperacionPropia = !!tDet.transEsPropio;

    const idPool = [...existingTransferIds];
    const built: TransferService[] = [];

    const inTrans: TransferService = {
      id: nextSequentialId("TR", idPool),
      leadPassenger: res.holder,
      paxCount: Number(tDet.transPax || res.pax),
      pickupLocation: tDet.transPickup || defaultAirport,
      dropoffLocation: tDet.transDropoff || res.hotelName,
      date: tDet.transDate || res.checkIn,
      time: tDet.transTime || "14:00",
      provider,
      status: "No Asignado",
      vehicleType: tDet.transVehicle || (res.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"),
      tipoTraslado: tDet.transServiceType === "compartido" ? "Compartido" : "Privado",
      reservationId: res.id,
      direction: "IN",
      esOperacionPropia,
      updatedAt: new Date().toISOString(),
    };
    built.push(inTrans);
    idPool.push(inTrans.id);

    if (tDet.transTripType === "round-trip" && tDet.transReturnDate) {
      const returnTrans: TransferService = {
        id: nextSequentialId("TR", idPool),
        leadPassenger: res.holder,
        paxCount: Number(tDet.transPax || res.pax),
        pickupLocation: tDet.transReturnDropoff || tDet.transDropoff || res.hotelName,
        dropoffLocation: tDet.transPickup || "Aeropuerto Internacional Local",
        date: tDet.transReturnDate,
        time: tDet.transReturnTime || "10:00",
        provider,
        status: "No Asignado",
        vehicleType: tDet.transVehicle || (res.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"),
        tipoTraslado: tDet.transServiceType === "compartido" ? "Compartido" : "Privado",
        reservationId: res.id,
        direction: "OUT",
        esOperacionPropia,
        updatedAt: new Date().toISOString(),
      };
      built.push(returnTrans);
    }

    return built;
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      // ── CASCADA DE BORRADO ────────────────────────────────────────────────────
      // Los IDs de reserva son secuenciales y se REUTILIZAN (p.ej. tras borrar la última o
      // tras un wipe). Si no limpiamos los registros ligados al expediente, una futura reserva
      // con el mismo ID los heredaría (facturas, obligaciones, cobros, traslados). Se borran
      // todos aquí. Los boletos aéreos son billetes reales → se DESVINCULAN, no se borran.
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match del localizador en clientName con límite para no confundir RES-1 con RES-11, etc.
      const locatorRe = new RegExp(`Localizador ${escapeRegex(id)}(?!\\d)`);
      const relInvoices = invoices.filter(inv => (inv as any).reservationId === id || (inv.clientName ? locatorRe.test(inv.clientName) : false));
      const relObligations = payableObligations.filter(o => o.locatorId === id);
      const relVouchers = vouchers.filter(v => v.locatorId === id);
      const relTransfers = transfers.filter(t => t.reservationId === id);
      const relBoletos = boletos.filter(b => (b as any).expedienteId === id);

      // 1. Estado local (optimista).
      setReservations(prev => prev.filter(r => r.id !== id));
      setInvoices(prev => prev.filter(inv => !relInvoices.some(x => x.id === inv.id)));
      setPayableObligations(prev => prev.filter(o => o.locatorId !== id));
      setVouchers(prev => prev.filter(v => v.locatorId !== id));
      setTransfers(prev => prev.filter(t => t.reservationId !== id));
      setBoletos(prev => prev.map(b => (b as any).expedienteId === id ? ({ ...b, vinculadoAExpediente: false, expedienteId: "", facturarConjunto: false } as any) : b));

      // 2. Persistir borrados / desvinculaciones en la BD (cada uno aislado para no abortar el resto).
      await deleteReservation(dataConnect, { id });
      for (const inv of relInvoices) { try { await deleteInvoice(dataConnect, { id: inv.id }); } catch (e) { console.error("cascade delete invoice", e); } }
      for (const o of relObligations) { try { await deletePayableObligation(dataConnect, { id: o.id }); } catch (e) { console.error("cascade delete obligation", e); } }
      for (const v of relVouchers) { try { await deletePaymentVoucher(dataConnect, { id: v.id }); } catch (e) { console.error("cascade delete voucher", e); } }
      for (const t of relTransfers) { try { await deleteTransferService(dataConnect, { id: t.id }); } catch (e) { console.error("cascade delete transfer", e); } }
      for (const b of relBoletos) { try { await updateFlightTicket(dataConnect, { ...b, vinculadoAExpediente: false, expedienteId: "", facturarConjunto: false }); } catch (e) { console.error("cascade unlink boleto", e); } }

      // 3. Auditoría del expediente (cascada) + log GLOBAL de la eliminación (sin entidadId → no
      //    aparece en ningún expediente, pero sí en Configuración → Historial de Auditoría).
      await deleteRegistrosAuditoriaByEntidad(dataConnect, { entidadTipo: "Reserva", entidadId: id });
      setRegistrosAuditoria(prev => prev.filter(r => !(r.entidadTipo === "Reserva" && r.entidadId === id)));
      handleAddRegistroAuditoria({
        tipo: "ReservaEliminada",
        detalle: `Expediente ${id} eliminado — ${relInvoices.length} factura(s), ${relObligations.length} obligación(es), ${relVouchers.length} cobro(s), ${relTransfers.length} traslado(s) borrados; ${relBoletos.length} boleto(s) desvinculado(s).`,
        usuarioId: usuario?.id ?? "sistema",
        usuarioNombre: usuario?.nombre ?? "Sistema",
      });
    } catch (e) {
      console.error("Error in handleDeleteReservation:", e);
    }
  };
  const handleAddReservation = async (newRes: any) => {
    newRes.updatedAt = new Date().toISOString();
    setReservations(prev => [newRes, ...prev]);

    try {
      await insertReservation(dataConnect, {
        id: newRes.id,
        holder: newRes.holder,
        hotelName: newRes.hotelName,
        checkIn: newRes.checkIn,
        checkOut: newRes.checkOut,
        pax: newRes.pax,
        status: newRes.status,
        totalPrice: newRes.totalPrice,
        netPrice: newRes.netPrice,
        agenciaName: newRes.agenciaName,
        tipo: newRes.tipo,
        servicios: newRes.servicios ? JSON.parse(JSON.stringify(newRes.servicios)) : null,
        telefono: newRes.telefono,
        email: newRes.email,
        flightNo: newRes.flightNo,
        specialRequests: newRes.specialRequests,
        mercado: newRes.mercado,
        createdAt: newRes.createdAt,
        comprobanteRef: newRes.comprobanteRef,
        comprobanteMonto: newRes.comprobanteMonto,
        comprobanteMetodo: newRes.comprobanteMetodo,
        facturacionTipo: newRes.facturacionTipo,
        facturacionRechazoMotivo: newRes.facturacionRechazoMotivo,
        facturacionRechazoArchivos: newRes.facturacionRechazoArchivos,
        variaciones: newRes.variaciones ? JSON.parse(JSON.stringify(newRes.variaciones)) : null,
        pasajeros: newRes.pasajeros ? JSON.parse(JSON.stringify(newRes.pasajeros)) : null,
        canalVenta: newRes.canalVenta,
        clienteDirectoId: newRes.clienteDirectoId,
        localizadorProveedor: newRes.localizadorProveedor,
        updatedAt: newRes.updatedAt
      });
    } catch (e) {
      console.error("[DB] Failed to insert reservation:", e);
      alert(`Error al guardar expediente: ${(e as any)?.message || e}`);
    }

    logReserva(
      newRes.id,
      "ReservaCreada",
      `Expediente creado — ${newRes.holder ?? ""}${newRes.hotelName ? ` · ${newRes.hotelName}` : ""}`,
    );

    // Only run side-effects for Real Bookings (tipo is NOT "Cotización")
    if (newRes.tipo !== "Cotización") {
      // SIDE-EFFECT: Deduct hotel allotment automatically in real-time cross-module modeling!
      const matchedProp = properties.find(p => p.name === newRes.hotelName);
      if (matchedProp) {
        handleUpdateProperty({
          ...matchedProp,
          allotment: Math.max(0, matchedProp.allotment - 1)
        });
      }

      // SIDE-EFFECT: Auto-generate ground transfer task(s) ONLY if transfer service was sold!
      const newTransfers = buildTransferServicesForReservation(newRes, transfers.map(t => t.id), flights);
      if (newTransfers.length > 0) {
        setTransfers(prev => [...newTransfers, ...prev]);
        newTransfers.forEach(t => {
          insertTransferService(dataConnect, { ...t }).catch(e =>
            console.error("Failed to insert transfer service for reservation", newRes.id, e)
          );
        });
      }
    }
  };

  const handleUpdateReservation = async (updatedRes: any) => {
    updatedRes.updatedAt = new Date().toISOString();
    
    // Find the old reservation before update
    const oldRes = reservations.find(r => r.id === updatedRes.id);
    let finalRes = updatedRes;

    // Detect if this is a billing-only update (statusFacturacion change, no structural changes)
    // In that case, skip the reconciler to avoid duplicate financial side-effects
    const isBillingOnlyUpdate = updatedRes.__billingOnly === true;
    delete updatedRes.__billingOnly;

    if (oldRes && !isBillingOnlyUpdate) {
      // Run the financial lifecycle reconciler
      const result = reconcileDossierUpdate(oldRes, updatedRes, clients, directClients, payableObligations);
      finalRes = result.updatedRes;

      // 1. Update B2B or Direct client if changed
      if (result.updatedClient?.kind === "B2B") {
        const client = result.updatedClient.client;
        setClients(prev => prev.map(c => c.id === client.id ? client : c));
        try {
          await updateClient(dataConnect, {
            id: client.id,
            nombre: client.nombre,
            rif: client.rif,
            tipo: client.tipo,
            status: client.status,
            contactoNombre: client.contactoNombre,
            email: client.email,
            telefono: client.telefono,
            saldoFavor: client.saldoFavor,
            saldoDeber: client.saldoDeber,
            moroso: client.moroso,
            limiteCredito: client.limiteCredito,
            diasCredito: client.diasCredito,
            observaciones: client.observaciones,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Failed to sync client balances to DB", err);
        }
      } else if (result.updatedClient?.kind === "Directo") {
        await handleUpdateDirectClient(result.updatedClient.client);
      }

      // 2. Update/Insert Payable Obligations if changed
      if (result.updatedPayableObligations.length > 0) {
        setPayableObligations(result.updatedPayableObligations);
        
        // Find which obligations are new or updated
        for (const obl of result.updatedPayableObligations) {
          const oldObl = payableObligations.find(o => o.id === obl.id);
          if (!oldObl) {
            // It's a new obligation!
            try {
              await insertPayableObligation(dataConnect, {
                id: obl.id,
                dueDate: obl.dueDate,
                providerName: obl.providerName,
                serviceDetail: obl.serviceDetail,
                locatorId: obl.locatorId,
                netCost: obl.netCost,
                paidAmount: obl.paidAmount,
                status: obl.status,
                paymentMethod: obl.paymentMethod || undefined,
                reference: obl.reference || undefined,
                notes: obl.notes || undefined,
                date: obl.date || undefined,
                currency: obl.currency || undefined,
                attachedFile: obl.attachedFile || undefined,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Failed to insert new payable obligation to DB", err);
            }
          } else if (
            oldObl.status !== obl.status ||
            oldObl.netCost !== obl.netCost ||
            oldObl.notes !== obl.notes
          ) {
            // It was modified/frozen!
            try {
              await updatePayableObligation(dataConnect, {
                id: obl.id,
                dueDate: obl.dueDate,
                providerName: obl.providerName,
                serviceDetail: obl.serviceDetail,
                locatorId: obl.locatorId,
                netCost: obl.netCost,
                paidAmount: obl.paidAmount,
                status: obl.status,
                paymentMethod: obl.paymentMethod || undefined,
                reference: obl.reference || undefined,
                notes: obl.notes || undefined,
                date: obl.date || undefined,
                currency: obl.currency || undefined,
                attachedFile: obl.attachedFile || undefined,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Failed to update payable obligation in DB", err);
            }
          }
        }
      }

      // 3. Apply credit variation balance impact using invoice + voucher context
      // The reconciler cannot compute the correct split between debt clearance and overpayment
      // refund without invoice/voucher data, so we handle it here.
      // Supplements are handled exclusively by FacturacionView ("Facturar Suplemento" button).
      // Credits still in "Borrador" (price-modification-sourced, pending manual send from Reservas
      // Administración) are excluded here too — their balance impact is deferred to FacturacionView
      // ("Emitir Nota de Crédito") once approved. Cancellation/annulment credits have no status
      // field and keep applying immediately, as before.
      if (result.newVariations.some(v => v.type === "Credito" && v.status !== "Borrador")) {
        const totalCredit = result.newVariations
          .filter(v => v.type === "Credito" && v.status !== "Borrador")
          .reduce((sum, v) => sum + Math.abs(v.amountSale), 0);

        const saleClient = resolveSaleClient(finalRes, clients, directClients);
        const clientObj = saleClient.client;

        if (clientObj && totalCredit > 0) {
          const isCreditClient =
            clientObj.tipo === "A Crédito" || (finalRes as any).facturacionTipo === "Crédito";

          // Invoices linked to this reservation. FAC- (original billing) and SUP- (suplementos
          // facturados vía "Facturar Suplemento") both represent real charges to the client — NC-
          // (credit notes) and ABO- (wallet transfers) are excluded. Status must NOT be restricted to
          // "Facturado": once the client pays, the invoice flips to "Pagado" and would otherwise drop
          // out of this list right when it matters most (that's exactly when totalPaid needs counting).
          const relatedInvoices = invoices.filter(inv =>
            inv.clientName?.includes(finalRes.id) &&
            inv.status !== "Borrador" &&
            (inv.id?.startsWith("FAC-") || inv.id?.startsWith("SUP-"))
          );

          const totalInvoiced = relatedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
          const totalPaid = relatedInvoices.reduce((sum, inv) => {
            return sum + vouchers
              .filter(v => v.invoiceId === inv.id && v.status === "Verificado")
              .reduce((s, v) => s + v.amount, 0);
          }, 0);

          // What the client still owed on those invoices before this modification
          const invoiceRemaining = Math.max(0, totalInvoiced - totalPaid);
          const newTotalDue = finalRes.totalPrice;

          let newSaldoDeber = clientObj.saldoDeber;
          let newSaldoFavor = clientObj.saldoFavor;

          if (isCreditClient) {
            if (totalPaid >= newTotalDue) {
              // Client has already paid more than the new reservation amount → overpaid
              // Clear the invoice's outstanding debt from the global account and give back the excess
              const excess = totalPaid - newTotalDue; // e.g. $200 paid − $90 new = $110
              newSaldoDeber = Math.max(0, newSaldoDeber - invoiceRemaining); // clear $160 debt
              if (excess > 0) newSaldoFavor += excess; // credit $110 to saldoFavor
              for (const inv of relatedInvoices) {
                await handleUpdateInvoice({ ...inv, status: "Pagado" });
              }
            } else {
              // Client still owes more than what they paid → reduce saldoDeber by credit amount
              newSaldoDeber = Math.max(0, newSaldoDeber - totalCredit);
            }
          } else {
            // Contado client: any overpayment beyond the new amount goes to saldoFavor
            const excess = Math.max(0, totalPaid - newTotalDue);
            if (excess > 0) {
              newSaldoFavor += excess;
              for (const inv of relatedInvoices) {
                await handleUpdateInvoice({ ...inv, status: "Pagado" });
              }
            }
          }

          if (newSaldoDeber !== clientObj.saldoDeber || newSaldoFavor !== clientObj.saldoFavor) {
            if (saleClient.kind === "B2B") {
              await handleUpdateClient({ ...saleClient.client, saldoDeber: newSaldoDeber, saldoFavor: newSaldoFavor });
            } else if (saleClient.kind === "Directo") {
              await handleUpdateDirectClient({ ...saleClient.client, saldoDeber: newSaldoDeber, saldoFavor: newSaldoFavor });
            }
          }
        }
      }

    }

    setReservations(prev => prev.map(r => r.id === finalRes.id ? finalRes : r));

    try {
      await updateReservation(dataConnect, {
        id: finalRes.id,
        holder: finalRes.holder,
        hotelName: finalRes.hotelName,
        checkIn: finalRes.checkIn,
        checkOut: finalRes.checkOut,
        pax: finalRes.pax,
        status: finalRes.status,
        totalPrice: finalRes.totalPrice,
        netPrice: finalRes.netPrice,
        agenciaName: finalRes.agenciaName,
        tipo: finalRes.tipo,
        servicios: finalRes.servicios ? JSON.parse(JSON.stringify(finalRes.servicios)) : null,
        telefono: finalRes.telefono,
        email: finalRes.email,
        flightNo: finalRes.flightNo,
        specialRequests: finalRes.specialRequests,
        mercado: finalRes.mercado,
        createdAt: finalRes.createdAt,
        comprobanteRef: finalRes.comprobanteRef,
        comprobanteMonto: finalRes.comprobanteMonto,
        comprobanteMetodo: finalRes.comprobanteMetodo,
        facturacionTipo: finalRes.facturacionTipo,
        facturacionRechazoMotivo: finalRes.facturacionRechazoMotivo,
        facturacionRechazoArchivos: finalRes.facturacionRechazoArchivos,
        variaciones: finalRes.variaciones ? JSON.parse(JSON.stringify(finalRes.variaciones)) : null,
        pasajeros: finalRes.pasajeros ? JSON.parse(JSON.stringify(finalRes.pasajeros)) : null,
        canalVenta: finalRes.canalVenta,
        clienteDirectoId: finalRes.clienteDirectoId,
        localizadorProveedor: finalRes.localizadorProveedor,
        updatedAt: finalRes.updatedAt
      });
    } catch (e) {
      console.error("[DB] Failed to update reservation:", e);
      alert(`Error al guardar expediente: ${(e as any)?.message || e}`);
    }

    // Historial del expediente: registrar solo cambios materiales hechos por el usuario.
    // Las actualizaciones internas "billing-only" (adjuntar invoiceId a una variación) no
    // son cambios visibles del expediente → se omiten para no ensuciar el historial.
    if (oldRes && !isBillingOnlyUpdate) {
      const cambios: string[] = [];
      if (oldRes.status !== finalRes.status) cambios.push(`Estado: ${oldRes.status} → ${finalRes.status}`);
      if (oldRes.totalPrice !== finalRes.totalPrice) cambios.push(`Precio venta: ${fmtMonto(oldRes.totalPrice)} → ${fmtMonto(finalRes.totalPrice)}`);
      if (oldRes.netPrice !== finalRes.netPrice) cambios.push(`Precio neto: ${fmtMonto(oldRes.netPrice)} → ${fmtMonto(finalRes.netPrice)}`);
      if (oldRes.checkIn !== finalRes.checkIn) cambios.push(`Check-in: ${oldRes.checkIn} → ${finalRes.checkIn}`);
      if (oldRes.checkOut !== finalRes.checkOut) cambios.push(`Check-out: ${oldRes.checkOut} → ${finalRes.checkOut}`);
      if (oldRes.hotelName !== finalRes.hotelName) cambios.push(`Hotel: ${oldRes.hotelName} → ${finalRes.hotelName}`);
      if (oldRes.holder !== finalRes.holder) cambios.push(`Titular: ${oldRes.holder} → ${finalRes.holder}`);
      if ((oldRes.pax ?? 0) !== (finalRes.pax ?? 0)) cambios.push(`Pax: ${oldRes.pax} → ${finalRes.pax}`);
      const oldServ = (oldRes.servicios || []).length;
      const newServ = (finalRes.servicios || []).length;
      if (oldServ !== newServ) cambios.push(`Servicios: ${oldServ} → ${newServ}`);

      if (cambios.length > 0) {
        const esCancelacion = finalRes.status === "Cancelada" && oldRes.status !== "Cancelada";
        logReserva(finalRes.id, esCancelacion ? "ReservaCancelada" : "ReservaModificada", cambios.join(" · "));
      }
    }

    // Propagar cambios a Traslados asociados
    setTransfers(prev => prev.map(t => {
      const oldResVal = reservations.find(r => r.id === finalRes.id);
      if (oldResVal && (t.leadPassenger === oldResVal.holder || t.dropoffLocation === oldResVal.hotelName)) {
        return {
          ...t,
          leadPassenger: finalRes.holder,
          paxCount: finalRes.pax,
          date: finalRes.checkIn,
          dropoffLocation: finalRes.hotelName,
          vehicleType: finalRes.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"
        };
      }
      return t;
    }));

    // SIDE-EFFECT: Auto-generate ground transfer task(s) if a Traslado/Rent a Car was added to
    // an expediente que YA EXISTÍA y todavía no tenía ninguno — antes esto solo pasaba al crear
    // el expediente, por lo que agregar un traslado después nunca aparecía en Operaciones
    // Receptivo. Se guarda por reservationId, no por el emparejamiento aproximado de arriba.
    if (finalRes.tipo !== "Cotización" && !transfers.some(t => t.reservationId === finalRes.id)) {
      const newTransfers = buildTransferServicesForReservation(finalRes, transfers.map(t => t.id), flights);
      if (newTransfers.length > 0) {
        setTransfers(prev => [...newTransfers, ...prev]);
        newTransfers.forEach(t => {
          insertTransferService(dataConnect, { ...t }).catch(e =>
            console.error("Failed to insert transfer service for reservation", finalRes.id, e)
          );
        });
      }
    }
  };

  
  const operacionesTraslados = transfers.map(t => mapToOperationalTransfer(t));

  const handleUpdateTransfer = async (updated: OperationalTransfer) => {
    const ts = mapToTransferService(updated);
    const existing = transfers.find(t => t.id === updated.id);
    if (existing) {
      setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));
      try { await updateTransferService(dataConnect, { ...ts }); } catch (e) { console.error("Failed to update transfer service", ts.id, e); }
    } else {
      setTransfers(prev => [...prev, ts]);
      try { await insertTransferService(dataConnect, { ...ts }); } catch (e) { console.error("Failed to insert transfer service", ts.id, e); }
    }
    logReserva((ts as any).reservationId, "TrasladoAsignado", `Traslado ${updated.id} actualizado (operaciones)`);
  };

  const handleUpdateVehicle = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    setFleetVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
    try {
      await updateFleetVehicle(dataConnect, {
        id: updated.id,
        placa: updated.placa,
        tipo: updated.tipo,
        marca: updated.marca,
        modelo: updated.modelo,
        capacidad: updated.capacidad,
        proveedor: updated.proveedor,
        status: updated.status,
        conductorAsignadoId: updated.conductorAsignadoId,
        observaciones: updated.observaciones,
        updatedAt: updated.updatedAt
      });
    } catch (e) {
      console.error("Failed to update vehicle", e);
    }
  };

  const handleAddVehicle = async (newV: any) => {
    newV.updatedAt = new Date().toISOString();
    setFleetVehicles(prev => [newV, ...prev]);
    try {
      await insertFleetVehicle(dataConnect, {
        id: newV.id,
        placa: newV.placa,
        tipo: newV.tipo,
        marca: newV.marca,
        modelo: newV.modelo,
        capacidad: newV.capacidad,
        proveedor: newV.proveedor,
        status: newV.status,
        conductorAsignadoId: newV.conductorAsignadoId,
        observaciones: newV.observaciones,
        updatedAt: newV.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert vehicle", e);
    }
  };

  const handleUpdateDriver = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    setFleetDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
    try {
      await updateFleetDriver(dataConnect, {
        id: updated.id,
        nombre: updated.nombre,
        telefono: updated.telefono,
        licencia: updated.licencia,
        vehiculoAsignadoId: updated.vehiculoAsignadoId,
        status: updated.status,
        observaciones: updated.observaciones,
        updatedAt: updated.updatedAt
      });
    } catch (e) {
      console.error("Failed to update driver", e);
    }
  };

  const handleAddDriver = async (newD: any) => {
    newD.updatedAt = new Date().toISOString();
    setFleetDrivers(prev => [newD, ...prev]);
    try {
      await insertFleetDriver(dataConnect, {
        id: newD.id,
        nombre: newD.nombre,
        telefono: newD.telefono,
        licencia: newD.licencia,
        vehiculoAsignadoId: newD.vehiculoAsignadoId,
        status: newD.status,
        observaciones: newD.observaciones,
        updatedAt: newD.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert driver", e);
    }
  };

  const handleUpdateInvoice = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    for (const f of ["amount", "vatAmount", "taxableBase", "surchargeAmount", "vatWithheld", "incomeTaxWithheld", "localCurrencyAmount"]) {
      if (typeof updated[f] === "number") updated[f] = round2(updated[f]);
    }
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    try {
      await updateInvoice(dataConnect, {
        id: updated.id,
        amount: updated.amount,
        vatAmount: updated.vatAmount,
        status: updated.status,
        updatedAt: updated.updatedAt
      });
    } catch (e) {
      console.error("Failed to update invoice", e);
    }
    const invResUpd = reservations.find(r => updated.clientName?.includes(r.id));
    logReserva(invResUpd?.id, "FacturaModificada", `Factura ${updated.id} → ${updated.status}`);
  };

  const handleAddInvoice = async (newInv: any) => {
    newInv.updatedAt = new Date().toISOString();
    // Redondeo a 2 decimales de todo monto fiscal antes de persistir.
    for (const f of ["amount", "vatAmount", "taxableBase", "surchargeAmount", "vatWithheld", "incomeTaxWithheld", "localCurrencyAmount"]) {
      if (typeof newInv[f] === "number") newInv[f] = round2(newInv[f]);
    }
    setInvoices(prev => [newInv, ...prev]);
    try {
      await insertInvoice(dataConnect, {
        id: newInv.id,
        clientName: newInv.clientName,
        // Persistir la asociación (antes se perdía al recargar): clientId (Cobranzas) y
        // reservationId (expediente / boleto aéreo AER-x), más los campos fiscales.
        clientId: newInv.clientId,
        reservationId: newInv.reservationId,
        date: newInv.date,
        dueDate: newInv.dueDate,
        amount: newInv.amount,
        vatAmount: newInv.vatAmount,
        type: newInv.type,
        status: newInv.status,
        taxableBase: newInv.taxableBase,
        surchargeAmount: newInv.surchargeAmount,
        vatWithheld: newInv.vatWithheld,
        incomeTaxWithheld: newInv.incomeTaxWithheld,
        exchangeRate: newInv.exchangeRate,
        localCurrencyAmount: newInv.localCurrencyAmount,
        fiscalDocNumber: newInv.fiscalDocNumber,
        isExempt: newInv.isExempt,
        paymentMethod: newInv.paymentMethod,
        updatedAt: newInv.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert invoice", e);
    }
    const invResNew = reservations.find(r => newInv.clientName?.includes(r.id));
    const docTipo = newInv.id?.startsWith("NC")
      ? "Nota de crédito"
      : newInv.id?.startsWith("SUP")
      ? "Suplemento facturado"
      : newInv.id?.startsWith("ABO")
      ? "Abono"
      : "Factura";
    logReserva(invResNew?.id, "FacturaEmitida", `${docTipo} ${newInv.id} emitida por ${fmtMonto(newInv.amount)}`);
  };

  const handleUpdateClient = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    updated.saldoFavor = round2(updated.saldoFavor || 0);
    updated.saldoDeber = round2(updated.saldoDeber || 0);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    try {
      await updateClient(dataConnect, {
        id: updated.id,
        saldoFavor: updated.saldoFavor,
        saldoDeber: updated.saldoDeber,
        status: updated.status,
        moroso: updated.moroso,
        updatedAt: updated.updatedAt
      });
    } catch (e) {
      console.error("Failed to update client", e);
    }
  };

  const handleAddClient = async (newClient: any) => {
    newClient.updatedAt = new Date().toISOString();
    setClients(prev => [newClient, ...prev]);
    try {
      await insertClient(dataConnect, {
        id: newClient.id,
        nombre: newClient.nombre,
        rif: newClient.rif,
        tipo: newClient.tipo,
        status: newClient.status,
        contactoNombre: newClient.contactoNombre,
        email: newClient.email,
        telefono: newClient.telefono,
        saldoFavor: newClient.saldoFavor,
        saldoDeber: newClient.saldoDeber,
        moroso: newClient.moroso,
        limiteCredito: newClient.limiteCredito,
        diasCredito: newClient.diasCredito,
        observaciones: newClient.observaciones,
        updatedAt: newClient.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert client", e);
    }
  };

  // A diferencia de handleUpdateClient (B2B), UpdateDirectClient acepta el set completo de
  // campos editables — se persiste el objeto completo, no solo saldo/status/moroso.
  const handleUpdateDirectClient = async (updated: DirectClient) => {
    updated.updatedAt = new Date().toISOString();
    updated.saldoFavor = round2(updated.saldoFavor || 0);
    updated.saldoDeber = round2(updated.saldoDeber || 0);
    setDirectClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    try {
      await updateDirectClient(dataConnect, { ...updated });
    } catch (e) {
      console.error("Failed to update direct client", e);
    }
  };

  const handleAddDirectClient = async (newClient: DirectClient) => {
    newClient.updatedAt = new Date().toISOString();
    setDirectClients(prev => [newClient, ...prev]);
    try {
      await insertDirectClient(dataConnect, { ...newClient });
    } catch (e) {
      console.error("Failed to insert direct client", e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      setClients(prev => prev.filter(c => c.id !== id));
      await deleteClient(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete client", e);
    }
  };

  const handleDeleteDirectClient = async (id: string) => {
    try {
      setDirectClients(prev => prev.filter(c => c.id !== id));
      await deleteDirectClient(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete direct client", e);
    }
  };

  // --- FLIGHT TICKETS (Boletos) ---
  const handleAddBoleto = async (newBol: FlightTicket): Promise<FlightTicket> => {
    // El id principal del boleto ES el del expediente aéreo (AER-N): antes había un BOL-N
    // redundante 1:1. Ahora "BOL-" se reusa por tramo (BOL-[nºAER]-[k]).
    const nuevoId = nextSequentialId("AER", boletos.flatMap(b => [b.id, b.expedienteAereo?.id]));
    const nAer = nuevoId.replace(/^AER-/, ""); // número para los BOL-[n]-[k]
    const segmentos = (newBol.segmentos || []).map((s, i) => ({ ...s, boletoId: `BOL-${nAer}-${i + 1}` }));
    const finalBol: FlightTicket = {
      ...newBol,
      id: nuevoId,
      costoNeto: round2(newBol.costoNeto || 0),
      precioVenta: round2(newBol.precioVenta || 0),
      precioPvp: newBol.precioPvp != null ? round2(newBol.precioPvp) : newBol.precioPvp,
      segmentos,
      // Expediente aéreo creado eager con el MISMO id (antes se creaba lazy en la vista).
      expedienteAereo: newBol.expedienteAereo
        ? { ...newBol.expedienteAereo, id: nuevoId }
        : { id: nuevoId, status: "Borrador", titular: newBol.pasajeros?.[0]?.nombre || "", createdAt: new Date().toISOString() },
    };
    setBoletos(prev => [...prev, finalBol]);
    try {
      await insertFlightTicket(dataConnect, { ...finalBol });
      logReserva(
        (finalBol as any).expedienteId,
        "BoletoEmitido",
        `Boleto aéreo ${finalBol.id} emitido${(finalBol as any).agenteNombre ? ` (agente ${(finalBol as any).agenteNombre})` : ""}`,
      );
    } catch (e) { console.error("Failed to insert flight ticket", e); }
    return finalBol;
  };
  const handleUpdateBoleto = async (updated: FlightTicket) => {
    try {
      setBoletos(prev => prev.map(b => b.id === updated.id ? updated : b));
      await updateFlightTicket(dataConnect, { ...updated });
      logReserva((updated as any).expedienteId, "BoletoModificado", `Boleto aéreo ${updated.id} actualizado`);
    } catch (e) {
      console.error("Failed to update flight ticket", e);
      alert(`Error al guardar el boleto aéreo: ${(e as any)?.message || e}. Por favor reintente.`);
    }
  };
  const handleDeleteBoleto = async (id: string) => {
    try {
      // Cascada: borrar también la cuenta por pagar a la aerolínea (locatorId = id del boleto),
      // porque los ids de boleto son secuenciales y se reutilizan (evita obligaciones huérfanas).
      const relObl = payableObligations.filter(o => o.locatorId === id);
      setBoletos(prev => prev.filter(b => b.id !== id));
      setPayableObligations(prev => prev.filter(o => o.locatorId !== id));
      await deleteFlightTicket(dataConnect, { id });
      for (const o of relObl) { try { await deletePayableObligation(dataConnect, { id: o.id }); } catch (e) { console.error("cascade delete aereo obligation", e); } }
    } catch (e) { console.error("Error in handleDeleteBoleto:", e); }
  };

  // --- PAYMENT VOUCHERS ---
  const handleAddVoucher = async (newVoucher: PaymentVoucher) => {
    setVouchers(prev => [...prev, newVoucher]);
    try {
      await insertPaymentVoucher(dataConnect, { ...newVoucher });
    } catch (e) {
      console.error("Failed to insert payment voucher", e);
    }
    logReserva(
      (newVoucher as any).locatorId,
      "CobroRegistrado",
      `Cobro de ${fmtMonto(newVoucher.amount)}${(newVoucher as any).method ? ` (${(newVoucher as any).method})` : ""} registrado${(newVoucher as any).invoiceId ? ` sobre ${(newVoucher as any).invoiceId}` : ""}`,
    );
  };
  const handleUpdateVoucher = async (updated: PaymentVoucher) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
    try {
      await updatePaymentVoucher(dataConnect, { id: updated.id, status: updated.status });
    } catch (e) {
      console.error("Failed to update payment voucher", e);
    }
    logReserva((updated as any).locatorId, "CobroModificado", `Cobro ${updated.id} → ${updated.status}`);
  };

  // --- EXTRA SERVICES & RATES ---
  const handleAddExtraService = async (newSrv: ExtraService) => {
    try {
      setExtraServices(prev => [...prev, newSrv]);
      await insertExtraService(dataConnect, { ...newSrv });
    } catch (e) {
      console.error("Failed to insert extra service", e);
      alert("Error al guardar el servicio. Es posible que no se haya persistido — recarga la página para confirmar.");
    }
  };
  const handleUpdateExtraService = async (updated: ExtraService) => {
    try {
      setExtraServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      await updateExtraService(dataConnect, { ...updated });
    } catch (e) {
      console.error("Failed to update extra service", e);
      alert("Error al actualizar el servicio. Es posible que no se haya persistido — recarga la página para confirmar.");
    }
  };
  const handleDeleteExtraService = async (id: string) => {
    try {
      setExtraServices(prev => prev.filter(s => s.id !== id));
      await deleteExtraService(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete extra service", e);
      alert("Error al eliminar el servicio. Es posible que no se haya eliminado en el servidor — recarga la página para confirmar.");
    }
  };
  const handleAddServiceRate = async (newRate: ServiceRate) => {
    try {
      setServiceRates(prev => [...prev, newRate]);
      await insertServiceRate(dataConnect, { ...newRate });
    } catch (e) {
      console.error("Failed to insert service rate", e);
      alert("Error al guardar la tarifa. Es posible que no se haya persistido — recarga la página para confirmar.");
    }
  };
  const handleUpdateServiceRate = async (updated: ServiceRate) => {
    try {
      setServiceRates(prev => prev.map(r => r.id === updated.id ? updated : r));
      await updateServiceRate(dataConnect, { ...updated });
    } catch (e) {
      console.error("Failed to update service rate", e);
      alert("Error al actualizar la tarifa. Es posible que no se haya persistido — recarga la página para confirmar.");
    }
  };
  const handleDeleteServiceRate = async (id: string) => {
    try {
      setServiceRates(prev => prev.filter(r => r.id !== id));
      await deleteServiceRate(dataConnect, { id });
    } catch (e) {
      console.error("Failed to delete service rate", e);
      alert("Error al eliminar la tarifa. Es posible que no se haya eliminado en el servidor — recarga la página para confirmar.");
    }
  };
  const handleDeleteRatePlanGroup = async (planName: string, propertyId: string) => {
    try {
      const plansToDelete = ratePlans.filter(rp => rp.property_id === propertyId && rp.nombrePromocion === planName);
      setRatePlans(prev => prev.filter(rp => !(rp.property_id === propertyId && rp.nombrePromocion === planName)));
      for (const p of plansToDelete) {
        await deleteRatePlan(dataConnect, { id: p.id });
      }
    } catch (e) {
      console.error("Error in handleDeleteRatePlanGroup:", e);
    }
  };

  // --- PROPIEDADES HANDLERS ---
  const handleAddDetailedProperty = async (newProp: Property) => {
    try {
      setDetailedProperties(prev => [...prev, newProp]);
      await insertDetailedProperty(dataConnect, { ...newProp });
    } catch (e) {
      console.error("Error in handleAddDetailedProperty:", e);
    }
  };
  const handleUpdateDetailedProperty = async (updatedProp: Property) => {
    try {
      setDetailedProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
      await updateDetailedProperty(dataConnect, { ...updatedProp });
    } catch (e) {
      console.error("Error in handleUpdateDetailedProperty:", e);
    }
  };
  const handleDeleteDetailedProperty = async (id: string) => {
    try {
      setDetailedProperties(prev => prev.filter(p => p.id !== id));
      await deleteDetailedProperty(dataConnect, { id });
    } catch (e) {
      console.error("Error in handleDeleteDetailedProperty:", e);
    }
  };
  const handleAddRoomType = async (newRoom: RoomType) => {
    try {
      setRoomTypes(prev => [...prev, newRoom]);
      await insertRoomType(dataConnect, {
        id: newRoom.id,
        propertyId: newRoom.property_id,
        nombre: newRoom.nombre,
        regimenAlimentacion: newRoom.regimenAlimentacion,
        capacidadMax: newRoom.capacidadMax,
        ocupacionBase: newRoom.ocupacionBase
      });
    } catch (e) {
      console.error("Error in handleAddRoomType:", e);
    }
  };
  const handleUpdateRoomType = async (updatedRoom: RoomType) => {
    try {
      setRoomTypes(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      await updateRoomType(dataConnect, {
        id: updatedRoom.id,
        propertyId: updatedRoom.property_id,
        nombre: updatedRoom.nombre,
        regimenAlimentacion: updatedRoom.regimenAlimentacion,
        capacidadMax: updatedRoom.capacidadMax,
        ocupacionBase: updatedRoom.ocupacionBase
      });
    } catch (e) {
      console.error("Error in handleUpdateRoomType:", e);
    }
  };
  const handleDeleteRoomType = async (id: string) => {
    try {
      setRoomTypes(prev => prev.filter(r => r.id !== id));
      await deleteRoomType(dataConnect, { id });
    } catch (e) {
      console.error("Error in handleDeleteRoomType:", e);
    }
  };
  const handleAddRatePlan = async (newRate: RatePlan) => {
    try {
      setRatePlans(prev => [...prev, newRate]);
      await insertRatePlan(dataConnect, {
        id: newRate.id,
        propertyId: newRate.property_id,
        roomTypeId: newRate.roomType_id,
        nombrePromocion: newRate.nombrePromocion,
        fechaInicio: newRate.fechaInicio,
        fechaFin: newRate.fechaFin,
        tipoCobro: newRate.tipoCobro,
        tarifaBase: newRate.tarifaBase,
        tarifaExtraAdulto: newRate.tarifaExtraAdulto,
        tarifaExtraNino: newRate.tarifaExtraNino,
        politicasCancelacion: newRate.politicasCancelacion,
        mercado: newRate.mercado,
        comisionCedidaB2B: newRate.comisionCedidaB2B
      });
    } catch (e) {
      console.error("Error in handleAddRatePlan:", e);
    }
  };
  const handleUpdateRatePlan = async (updatedRate: RatePlan) => {
    try {
      setRatePlans(prev => prev.map(r => r.id === updatedRate.id ? updatedRate : r));
      await updateRatePlan(dataConnect, {
        id: updatedRate.id,
        propertyId: updatedRate.property_id,
        roomTypeId: updatedRate.roomType_id,
        nombrePromocion: updatedRate.nombrePromocion,
        fechaInicio: updatedRate.fechaInicio,
        fechaFin: updatedRate.fechaFin,
        tipoCobro: updatedRate.tipoCobro,
        tarifaBase: updatedRate.tarifaBase,
        tarifaExtraAdulto: updatedRate.tarifaExtraAdulto,
        tarifaExtraNino: updatedRate.tarifaExtraNino,
        politicasCancelacion: updatedRate.politicasCancelacion,
        mercado: updatedRate.mercado,
        comisionCedidaB2B: updatedRate.comisionCedidaB2B
      });
    } catch (e) {
      console.error("Error in handleUpdateRatePlan:", e);
    }
  };
  const handleDeleteRatePlan = async (id: string) => {
    try {
      setRatePlans(prev => prev.filter(r => r.id !== id));
      await deleteRatePlan(dataConnect, { id });
    } catch (e) {
      console.error("Error in handleDeleteRatePlan:", e);
    }
  };
  const handleAddStopSale = async (newStop: StopSale) => {
    try {
      setStopSales(prev => [...prev, newStop]);
      await insertStopSale(dataConnect, {
        id: newStop.id,
        propertyId: newStop.property_id,
        fechaInicio: newStop.fechaInicio,
        fechaFin: newStop.fechaFin,
        motivo: newStop.motivo,
        tipo: newStop.tipo
      });
    } catch (e) {
      console.error("Error in handleAddStopSale:", e);
    }
  };
  const handleUpdateStopSale = async (updatedStop: StopSale) => {
    try {
      setStopSales(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
      await updateStopSale(dataConnect, {
        id: updatedStop.id,
        propertyId: updatedStop.property_id,
        fechaInicio: updatedStop.fechaInicio,
        fechaFin: updatedStop.fechaFin,
        motivo: updatedStop.motivo,
        tipo: updatedStop.tipo
      });
    } catch (e) {
      console.error("Error in handleUpdateStopSale:", e);
    }
  };
  const handleDeleteStopSale = async (id: string) => {
    try {
      setStopSales(prev => prev.filter(s => s.id !== id));
      await deleteStopSale(dataConnect, { id });
    } catch (e) {
      console.error("Error in handleDeleteStopSale:", e);
    }
  };

  // Botón de navegación del sidebar: si el rol del usuario no tiene "ver" sobre
  // este módulo, se muestra bloqueado con candado en vez de navegar — mismo
  // patrón visual que ya usan las pestañas bloqueadas de ConfiguracionView.
  const renderNavButton = (view: ProjectView, Icon: React.ComponentType<{ className?: string }>, label: string, id: string) => {
    if (!puedeVerModulo(view)) {
      return (
        <button
          key={id}
          disabled
          title={sidebarCollapsed ? `${label} — sin permiso de acceso` : "Sin permiso de acceso a este módulo"}
          className={`w-full flex items-center rounded-lg text-zinc-600 cursor-not-allowed opacity-60 ${sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"}`}
        >
          <span className="flex items-center gap-3">
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-semibold">{label}</span>}
          </span>
          {!sidebarCollapsed && <Lock className="w-3 h-3 text-zinc-500 flex-shrink-0" />}
        </button>
      );
    }
    return (
      <button
        key={id}
        id={id}
        onClick={() => setCurrentSection(view)}
        title={sidebarCollapsed ? label : undefined}
        className={`w-full flex items-center rounded-lg transition-all cursor-pointer ${sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"} ${currentSection === view ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && <span className="text-xs font-semibold">{label}</span>}
      </button>
    );
  };

  // El chequeo de sesión va acá (justo antes del JSX final) y no como return temprano al
  // inicio del componente: todos los hooks de arriba deben llamarse siempre, en el mismo
  // orden, en cada render — devolver antes de declararlos hace que React llame menos hooks
  // en el render sin sesión que en el que sigue justo después del login, lo que revienta
  // con "Rendered more hooks than during the previous render" y deja la pantalla en blanco.
  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans antialiased">

      {/* SIDEBAR PERSISTENTE IZQUIERDO */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-72"} bg-zinc-950 flex flex-col h-screen fixed left-0 top-0 text-white p-5 border-r border-zinc-900 z-20 font-sans transition-[width] duration-200 overflow-hidden`}>

        {/* Brand Header */}
        <button
          onClick={() => esAdministrador && setCurrentSection(ProjectView.CONFIGURACION)}
          className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} mb-4 px-2 py-1.5 rounded-lg transition-all w-full text-left focus:outline-none ${esAdministrador ? "hover:bg-zinc-900/40 cursor-pointer" : "cursor-default"}`}
          title={esAdministrador ? "Configuración de Empresa" : companyConfig.name}
        >
          <div className="w-10 h-10 rounded-md bg-white text-zinc-950 flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
            {companyConfig.logoLetter}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-sans">
                <h1 className="font-bold text-sm tracking-tight leading-none text-white truncate max-w-[120px]" title={companyConfig.name}>{companyConfig.name}</h1>
                <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-1 py-0.5 rounded-sm flex-shrink-0">V0</span>
              </div>
              <p className="text-[9px] text-zinc-500 font-medium mt-1 uppercase tracking-wider truncate" title={companyConfig.subtitle}>{companyConfig.subtitle}</p>
            </div>
          )}
        </button>

        {/* Toggle de colapso: recupera ancho de contenido en pantallas chicas */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          className="w-full flex items-center justify-center gap-2 mb-5 py-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900/40 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 flex-shrink-0" /> : (
            <>
              <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Colapsar menú</span>
            </>
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pb-6">

          {/* BUSCADOR GLOBAL — botón principal arriba */}
          <button
            id="nav-buscador"
            onClick={() => setCurrentSection(ProjectView.BUSCADOR)}
            title={sidebarCollapsed ? "Buscador Global" : undefined}
            className={`w-full flex items-center rounded-lg transition-all cursor-pointer mb-3 ${sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} ${currentSection === ProjectView.BUSCADOR ? 'bg-white/10 text-white font-semibold border border-white/10' : 'text-zinc-300 hover:text-white hover:bg-zinc-900/60 border border-transparent'}`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-bold tracking-wide">Buscador Global</span>}
          </button>

          <div className="h-px bg-zinc-800 mb-3" />

          {/* COMERCIAL */}
          <div className={sidebarCollapsed ? "" : "px-1"}>
            {!sidebarCollapsed && (
              <button onClick={() => toggleMenu('comercial')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
                <span>Comercial</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.comercial ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(sidebarCollapsed || expandedMenus.comercial) && (
              <div className={sidebarCollapsed ? "space-y-1" : "space-y-1 mt-1 pl-1"}>
                {renderNavButton(ProjectView.PROPIEDADES, Building2, "Propiedades y Tarifas", "nav-propiedades")}
                {renderNavButton(ProjectView.SERVICIOS_VARIOS, Box, "Servicios Varios", "nav-servicios")}
              </div>
            )}
          </div>

          {/* OPERACIONES */}
          <div className={sidebarCollapsed ? "mt-2" : "px-1 mt-2"}>
            {!sidebarCollapsed && (
              <button onClick={() => toggleMenu('operaciones')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
                <span>Operaciones & Tráfico</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.operaciones ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(sidebarCollapsed || expandedMenus.operaciones) && (
              <div className={sidebarCollapsed ? "space-y-1" : "space-y-1 mt-1 pl-1"}>
                {renderNavButton(ProjectView.RESERVAS, Calendar, "Reservas (Booking)", "nav-reservas")}
                {renderNavButton(ProjectView.VUELOS, Plane, "Vuelos (Air Control)", "nav-vuelos")}
                {renderNavButton(ProjectView.OPERACIONES, Activity, "Ops. Receptivo", "nav-operaciones")}
              </div>
            )}
          </div>

          {/* DIRECTORIO */}
          <div className={sidebarCollapsed ? "mt-2" : "px-1 mt-2"}>
            {!sidebarCollapsed && (
              <button onClick={() => toggleMenu('directorio')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
                <span>Directorio</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.directorio ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(sidebarCollapsed || expandedMenus.directorio) && (
              <div className={sidebarCollapsed ? "space-y-1" : "space-y-1 mt-1 pl-1"}>
                {renderNavButton(ProjectView.CLIENTES, Users, "Clientes", "nav-clientes")}
                {renderNavButton(ProjectView.PROVEEDORES, Briefcase, "Proveedores", "nav-proveedores")}
              </div>
            )}
          </div>

          {/* ADMIN & FINANZAS */}
          <div className={sidebarCollapsed ? "mt-2" : "px-1 mt-2"}>
            {!sidebarCollapsed && (
              <button onClick={() => toggleMenu('finanzas')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
                <span>Admin & Finanzas</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.finanzas ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(sidebarCollapsed || expandedMenus.finanzas) && (
              <div className={sidebarCollapsed ? "space-y-1" : "space-y-1 mt-1 pl-1"}>
                {renderNavButton(ProjectView.ADMINISTRACION, Wallet, "Administración / BI", "nav-admin")}
                {renderNavButton(ProjectView.FACTURACION, Receipt, "Dpto. Facturación", "nav-facturacion")}
                {renderNavButton(ProjectView.COBRANZAS, CreditCard, "Cuentas por Cobrar", "nav-cobranzas")}
                {renderNavButton(ProjectView.CUENTAS_PAGAR, ArrowDownRight, "Cuentas por Pagar", "nav-pagos")}
                {renderNavButton(ProjectView.CONTABILIDAD, ReceiptText, "Contabilidad / Fiscal", "nav-contabilidad")}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* CONTINENTE DE CONTENIDO PRINCIPAL (COLUMNA DERECHA) */}
      <div className={`flex-1 ${sidebarCollapsed ? "pl-16" : "pl-72"} flex flex-col min-h-screen transition-[padding] duration-200`}>
        
        {/* TOP GENERAL BAR */}
        <header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-8 sticky top-0 z-10">
          
          {/* Left indicator showing daily exchange rates */}
          <div className="flex items-center gap-5 text-xs text-zinc-500 font-sans font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-700 font-bold">
              💵 Tipo de Cambio del Día
            </span>
            {[...customRates].filter(r => r.showInHeader).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((r, i, arr) => (
              <React.Fragment key={r.id}>
                <span className="font-mono text-zinc-800">
                  <span className="text-zinc-400 font-bold uppercase text-[10px] mr-1.5">{r.label}</span>
                  1 {r.fromCurrency} = {getCurrencySymbol(r.toCurrency)} {r.value.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </span>
                {i < arr.length - 1 && <span className="text-zinc-300">|</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 font-sans">
            <div className="w-8.5 h-8.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-xs">
              {(usuario?.nombre || "?").trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-zinc-800 leading-tight">{usuario?.nombre || "Invitado"}</p>
              <p className="text-[10px] text-zinc-400 leading-none">{usuario?.rol.nombre || "Sin rol"}</p>
            </div>
            <button
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="flex-1 p-8 space-y-6">

          {/* DYNAMIC COMPONENT LOADER */}
          <div className="transition-all duration-300">
            <div className="animate-fade-in">
                 {currentSection === ProjectView.PROPIEDADES && (
                   <PropiedadesView 
                     properties={properties} 
                     onUpdateProperty={handleUpdateProperty} 
                     detailedProperties={detailedProperties}
                     onAddDetailedProperty={handleAddDetailedProperty}
onUpdateDetailedProperty={handleUpdateDetailedProperty}
onDeleteDetailedProperty={handleDeleteDetailedProperty}
                     roomTypes={roomTypes}
                     onAddRoomType={handleAddRoomType}
onUpdateRoomType={handleUpdateRoomType}
onDeleteRoomType={handleDeleteRoomType}
                     ratePlans={ratePlans}
                     onAddRatePlan={handleAddRatePlan}
onUpdateRatePlan={handleUpdateRatePlan}
onDeleteRatePlan={handleDeleteRatePlan}
onDeleteRatePlanGroup={handleDeleteRatePlanGroup}
                     stopSales={stopSales}
                     onAddStopSale={handleAddStopSale}
onUpdateStopSale={handleUpdateStopSale}
onDeleteStopSale={handleDeleteStopSale}
                   />
                 )}
                  
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
                      proveedores={proveedores}
                    />
                  )}
                  {currentSection === ProjectView.BUSCADOR && (
                    <BuscadorGlobalView
                      reservations={reservations}
                      invoices={invoices}
                      boletos={boletos}
                      payableObligations={payableObligations}
                      onNavigate={setCurrentSection}
                    />
                  )}
                  {currentSection === ProjectView.PROVEEDORES && (
                    <ProveedoresView
                      proveedores={proveedores}
                      onAddProveedor={handleAddProveedor}
                      onUpdateProveedor={handleUpdateProveedor}
                      onDeleteProveedor={handleDeleteProveedor}
                    />
                  )}
                  {currentSection === ProjectView.RESERVAS && (
                    <ReservasView
                      reservations={reservations}
                      properties={properties}
                      clients={clients}
                      directClients={directClients}
                      onAddDirectClient={handleAddDirectClient}
                      onAddReservation={handleAddReservation}
                      onUpdateReservation={handleUpdateReservation}
                      onAddInvoice={handleAddInvoice}
                      detailedProperties={detailedProperties}
                      roomTypes={roomTypes}
                      ratePlans={ratePlans}
                      stopSales={stopSales}
                      invoices={invoices}
                      payableObligations={payableObligations}
                      vouchers={vouchers}
                      boletos={boletos}
                      onBoletosChange={setBoletos}
                      onUpdateBoleto={handleUpdateBoleto}
                      extraServices={extraServices}
                      serviceRates={serviceRates}
                      proveedores={proveedores}
                      companyConfig={companyConfig}
                      jurisdiction={jurisdiction}
                      currentExchangeRate={todayExchangeRate}
                      reglasAutorizacion={reglasAutorizacion}
                      onCreateSolicitudAutorizacion={handleCreateSolicitudAutorizacion}
                      onAddRegistroAuditoria={handleAddRegistroAuditoria}
                      onDeleteReservation={handleDeleteReservation}
                      registrosAuditoria={registrosAuditoria}
                    />
                  )}
                  {currentSection === ProjectView.FACTURACION && (
                     <FacturacionView
                       reservations={reservations}
                       invoices={invoices}
                       onUpdateReservation={handleUpdateReservation}
                       onAddInvoice={handleAddInvoice}
                       onUpdateInvoice={handleUpdateInvoice}
                       clients={clients}
                       directClients={directClients}
                       roomTypes={roomTypes}
                       ratePlans={ratePlans}
                       detailedProperties={detailedProperties}
                       onUpdateClient={handleUpdateClient}
                       onUpdateDirectClient={handleUpdateDirectClient}
                       payableObligations={payableObligations}
                       onAddPayableObligation={handleAddPayableObligation}
                       onUpdateObligation={handleUpdateObligation}
                       providerStatements={providerStatements}
                       onAddProviderStatement={handleAddStatement}
                       vouchers={vouchers}
                       boletos={boletos}
                       onBoletosChange={setBoletos}
                       onUpdateBoleto={handleUpdateBoleto}
                       companyConfig={companyConfig}
                       jurisdiction={jurisdiction}
                       currentExchangeRate={todayExchangeRate}
                       reglasAutorizacion={reglasAutorizacion}
                       onCreateSolicitudAutorizacion={handleCreateSolicitudAutorizacion}
                       onAddRegistroAuditoria={handleAddRegistroAuditoria}
                     />
                   )}
                {currentSection === ProjectView.VUELOS && (
                  <VuelosView
                    flights={flights}
                    boletos={boletos}
                    onAddBoleto={handleAddBoleto}
                    onUpdateBoleto={handleUpdateBoleto}
                    onDeleteBoleto={handleDeleteBoleto}
                    clients={clients}
                    directClients={directClients}
                    payableObligations={payableObligations}
                    onAddObligation={handleAddPayableObligation}
                    onUpdateObligation={handleUpdateObligation}
                    invoices={invoices}
                    onAddInvoice={handleAddInvoice}
                    vouchers={vouchers}
                    onUpdateClient={handleUpdateClient}
                    onUpdateDirectClient={handleUpdateDirectClient}
                    companyConfig={companyConfig}
                    jurisdiction={jurisdiction}
                    currentExchangeRate={todayExchangeRate}
                  />
                )}

                {currentSection === ProjectView.OPERACIONES && (
                  <OperacionesView
                    transfers={operacionesTraslados}
                    onUpdateTransfer={handleUpdateTransfer}
                    fleetVehicles={fleetVehicles}
                    onUpdateVehicle={handleUpdateVehicle}
                    onAddVehicle={handleAddVehicle}
                    fleetDrivers={fleetDrivers}
                    onUpdateDriver={handleUpdateDriver}
                    onAddDriver={handleAddDriver}
                  />
                )}
                {currentSection === ProjectView.ADMINISTRACION && (
                  <AdministracionView
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    reservations={reservations}
                    boletos={boletos}
                    clients={clients}
                    detailedProperties={detailedProperties}
                    payableObligations={payableObligations}
                  />
                )}
                {currentSection === ProjectView.CLIENTES && (
                  <ClientesView
                    clients={clients}
                    onUpdateClient={handleUpdateClient}
                    onAddClient={handleAddClient}
                    onDeleteClient={handleDeleteClient}
                    directClients={directClients}
                    onUpdateDirectClient={handleUpdateDirectClient}
                    onAddDirectClient={handleAddDirectClient}
                    onDeleteDirectClient={handleDeleteDirectClient}
                    invoices={invoices}
                    reservations={reservations}
                    boletos={boletos}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    detailedProperties={detailedProperties}
                    walletTransactions={walletTransactions}
                    onAddWalletTransaction={handleAddWalletTransaction}
                    companyConfig={companyConfig}
                  />
                )}
                {currentSection === ProjectView.COBRANZAS && (
                  <CobranzasView
                    clients={clients}
                    onUpdateClient={handleUpdateClient}
                    directClients={directClients}
                    onUpdateDirectClient={handleUpdateDirectClient}
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    reservations={reservations}
                    boletos={boletos}
                    onAddInvoice={handleAddInvoice}
                    vouchers={vouchers}
                    onAddVoucher={handleAddVoucher}
                    onUpdateVoucher={handleUpdateVoucher}
                    companyConfig={companyConfig}
                    jurisdiction={jurisdiction}
                    withholdingCertificates={withholdingCertificates}
                    onAddWithholdingCertificate={handleAddWithholdingCertificate}
                    onDeleteWithholdingCertificate={handleDeleteWithholdingCertificate}
                    walletTransactions={walletTransactions}
                    onAddWalletTransaction={handleAddWalletTransaction}
                  />
                )}
                {currentSection === ProjectView.CONTABILIDAD && (
                  <ContabilidadView
                    jurisdiction={jurisdiction}
                    onSaveJurisdiction={handleSaveJurisdiction}
                    exchangeRates={fiscalExchangeRates}
                    onAddExchangeRate={handleAddExchangeRate}
                    withholdingCertificates={withholdingCertificates}
                    journalEntries={journalEntries}
                    invoices={invoices}
                    payableObligations={payableObligations}
                  />
                )}
                {currentSection === ProjectView.CUENTAS_PAGAR && (
                  <CuentasPorPagarView
                    obligations={payableObligations}
                    onUpdateObligation={handleUpdateObligation}
                    onAddObligation={handleAddPayableObligation}
                    statements={providerStatements}
                    onAddStatement={handleAddStatement}
                    jurisdiction={jurisdiction}
                    currentExchangeRate={todayExchangeRate}
                  />
                )}
                {currentSection === ProjectView.CONFIGURACION && esAdministrador && (
                  <ConfiguracionView
                    config={companyConfig}
                    onUpdateConfig={handleUpdateCompanyConfig}
                    customRates={customRates}
                    onUpsertCustomRate={handleUpsertCustomRate}
                    onDeleteCustomRate={handleDeleteCustomRate}
                    usuarios={usuarios}
                    roles={roles}
                    reglasAutorizacion={reglasAutorizacion}
                    solicitudesAutorizacion={solicitudesAutorizacion}
                    registrosAuditoria={registrosAuditoria}
                    onAddUsuario={handleAddUsuario}
                    onUpdateUsuario={handleUpdateUsuario}
                    onDeleteUsuario={handleDeleteUsuario}
                    onAddRol={handleAddRol}
                    onUpdateRol={handleUpdateRol}
                    onDeleteRol={handleDeleteRol}
                    onAddReglaAutorizacion={handleAddReglaAutorizacion}
                    onUpdateReglaAutorizacion={handleUpdateReglaAutorizacion}
                    onResolveSolicitudAutorizacion={handleResolveSolicitudAutorizacion}
                    onAddRegistroAuditoria={handleAddRegistroAuditoria}
                    payableObligations={payableObligations}
                    onUpdateObligation={handleUpdateObligation}
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                  />
                )}
              </div>
          </div>

        </main>
      </div>

    </div>
  );
}

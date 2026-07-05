import { FlightTicket } from "./types/aereos";
import React, { useState } from "react";
import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, DirectClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher, CompanyConfig, ExchangeRate, WithholdingCertificate, JournalEntry } from "./types";
import { TaxJurisdiction, DEFAULT_JURISDICTION } from "./lib/taxEngine";
import { Property, RoomType, RatePlan, StopSale, ExtraService, ServiceRate, Proveedor } from "./types/producto";

import {
  listReservations, insertReservation, updateReservation, deleteReservation,
  listClients, insertClient,
  listDirectClients, insertDirectClient, updateDirectClient,
  listInvoices, insertInvoice,
  listDetailedProperties, insertDetailedProperty, updateDetailedProperty, deleteDetailedProperty,
  listRoomTypes, insertRoomType, updateRoomType, deleteRoomType,
  listRatePlans, insertRatePlan, updateRatePlan, deleteRatePlan,
  listStopSales, insertStopSale, updateStopSale, deleteStopSale,
  listFlightTickets, insertFlightTicket, updateFlightTicket, deleteFlightTicket,
  listTransferServices, insertTransferService, updateTransferService, deleteTransferService,
  listFleetVehicles, insertFleetVehicle, updateFleetVehicle, deleteFleetVehicle,
  listFleetDrivers, insertFleetDriver, updateFleetDriver, deleteFleetDriver,
  listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher,
  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,
  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate,
  updateInvoice, updateClient,
  listPayableObligations, insertPayableObligation, updatePayableObligation, deletePayableObligation,
  listProviderStatements, insertProviderStatement, deleteProviderStatement,
  listProveedores, insertProveedor, updateProveedor,
  listTaxJurisdictions, listExchangeRates, listWithholdingCertificates, listJournalEntries,
  upsertTaxJurisdiction, insertExchangeRate, insertWithholdingCertificate,
  deleteWithholdingCertificate, insertJournalEntry,
} from "./lib/dataconnect-shim";
import { isAuthenticated, logout } from "./lib/api";
import LoginScreen from "./components/LoginScreen";
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
  TrendingDown
} from "lucide-react";

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

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
  const [exchangeRates, setExchangeRates] = useState({ usdToEur: 0.92, usdToVes: 45.50 });

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
      logoLetter: "F"
    };
  });

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

  const handleUpdateObligation = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
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
  };

  const handleAddPayableObligation = async (newObligation: any) => {
    newObligation.updatedAt = new Date().toISOString();
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


  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await listReservations(dataConnect);
        if (res.data.reservations.length > 0) setReservations(res.data.reservations);
        const cli = await listClients(dataConnect);
        if (cli.data.b2BClients.length > 0) setClients(cli.data.b2BClients);
        // Aislado en su propio try: un fallo aquí (p.ej. backend sin reiniciar tras agregar
        // el módulo direct-clients) no debe abortar la carga del resto de los datos.
        try {
          const dcli = await listDirectClients(dataConnect);
          if (dcli.data.directClients.length > 0) setDirectClients(dcli.data.directClients);
        } catch (e) {
          console.error("Failed to load direct clients", e);
        }
        const inv = await listInvoices(dataConnect);
        if (inv.data.financialInvoices.length > 0) setInvoices(inv.data.financialInvoices);
        const props = await listDetailedProperties(dataConnect);
        if (props.data.detailedProperties.length > 0) setDetailedProperties(props.data.detailedProperties);
        const rooms = await listRoomTypes(dataConnect);
        if (rooms.data.roomTypes.length > 0) {
          setRoomTypes(rooms.data.roomTypes.map((r: any) => ({
            ...r,
            property_id: r.propertyId
          })));
        }
        const rates = await listRatePlans(dataConnect);
        if (rates.data.ratePlans.length > 0) {
          setRatePlans(rates.data.ratePlans.map((rp: any) => ({
            ...rp,
            property_id: rp.propertyId,
            roomType_id: rp.roomTypeId
          })));
        }
        const stops = await listStopSales(dataConnect);
        if (stops.data.stopSales.length > 0) {
          setStopSales(stops.data.stopSales.map((s: any) => ({
            ...s,
            property_id: s.propertyId
          })));
        }
        const tickets = await listFlightTickets(dataConnect);
        if (tickets.data.flightTickets.length > 0) setBoletos(tickets.data.flightTickets);
        const trans = await listTransferServices(dataConnect);
        if (trans.data.transferServices.length > 0) setTransfers(trans.data.transferServices);
        const veh = await listFleetVehicles(dataConnect);
        if (veh.data.fleetVehicles.length > 0) setFleetVehicles(veh.data.fleetVehicles);
        const dri = await listFleetDrivers(dataConnect);
        if (dri.data.fleetDrivers.length > 0) setFleetDrivers(dri.data.fleetDrivers);
        const vou = await listPaymentVouchers(dataConnect);
        if (vou.data.paymentVouchers.length > 0) setVouchers(vou.data.paymentVouchers);
        const ext = await listExtraServices(dataConnect);
        if (ext.data.extraServices.length > 0) setExtraServices(ext.data.extraServices);
        const srv = await listServiceRates(dataConnect);
        if (srv.data.serviceRates.length > 0) setServiceRates(srv.data.serviceRates);
        const obs = await listPayableObligations(dataConnect);
        if (obs.data.payableObligations.length > 0) setPayableObligations(obs.data.payableObligations);
        const stm = await listProviderStatements(dataConnect);
        if (stm.data.providerStatements.length > 0) setProviderStatements(stm.data.providerStatements);
        const provs = await listProveedores(dataConnect);
        if (provs.data.proveedores.length > 0) setProveedores(provs.data.proveedores);
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
      } catch (err) {
        console.error("Failed to load Firebase data", err);
      }
    }
    loadData();
  }, []);


  // Trigger cross-view state propagation
  const handleUpdateProperty = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteReservation = async (id: string) => { setReservations(prev => prev.filter(r => r.id !== id)); try { await deleteReservation(dataConnect, { id }); } catch (e) {} };
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

      // SIDE-EFFECT: Auto-generate ground transfer task ONLY if transfer service was sold!
      const hasTransfer = newRes.servicios?.some(s => s.tipo === "Traslado" || s.tipo === "Rent a Car");
      if (hasTransfer) {
        const matchedFlight = flights.find(f => f.flightNo === newRes.flightNo);
        const tServicio = newRes.servicios?.find(s => s.tipo === "Traslado" || s.tipo === "Rent a Car");
        const tDet = tServicio?.detalles || {};
        const defaultAirport = matchedFlight
          ? `Llegadas Aeropuerto (Vuelo ${matchedFlight.flightNo})`
          : "Aeropuerto Internacional Local";

        const newTrans: TransferService = {
          id: nextSequentialId("TR", transfers.map(t => t.id)),
          leadPassenger: newRes.holder,
          paxCount: Number(tDet.transPax || newRes.pax),
          pickupLocation: tDet.transPickup || defaultAirport,
          dropoffLocation: tDet.transDropoff || newRes.hotelName,
          date: tDet.transDate || newRes.checkIn,
          time: tDet.transTime || "14:00",
          provider: "Foratour Receptivo S.A.",
          status: "No Asignado",
          vehicleType: tDet.transVehicle || (newRes.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"),
          tipoTraslado: tDet.transServiceType === "compartido" ? "Compartido" : "Privado",
          reservationId: newRes.id,
          direction: "IN",
          updatedAt: new Date().toISOString(),
        };
        setTransfers(prev => [newTrans, ...prev]);
        insertTransferService(dataConnect, { ...newTrans }).catch(e =>
          console.error("Failed to insert transfer service for reservation", newRes.id, e)
        );

        // Si es ida y vuelta, generar también el traslado de retorno
        if (tDet.transTripType === "round-trip" && tDet.transReturnDate) {
          const returnTrans: TransferService = {
            id: nextSequentialId("TR", [...transfers.map(t => t.id), newTrans.id]),
            leadPassenger: newRes.holder,
            paxCount: Number(tDet.transPax || newRes.pax),
            pickupLocation: tDet.transReturnDropoff || tDet.transDropoff || newRes.hotelName,
            dropoffLocation: tDet.transPickup || "Aeropuerto Internacional Local",
            date: tDet.transReturnDate,
            time: tDet.transReturnTime || "10:00",
            provider: "Foratour Receptivo S.A.",
            status: "No Asignado",
            vehicleType: tDet.transVehicle || (newRes.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"),
            tipoTraslado: tDet.transServiceType === "compartido" ? "Compartido" : "Privado",
            reservationId: newRes.id,
            direction: "OUT",
            updatedAt: new Date().toISOString(),
          };
          setTransfers(prev => [returnTrans, ...prev]);
          insertTransferService(dataConnect, { ...returnTrans }).catch(e =>
            console.error("Failed to insert return transfer service for reservation", newRes.id, e)
          );
        }
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

      // Print reconciler logs for audit trail
      if (result.log.length > 0) {
        console.log("--- HISTORIAL DE CONCILIACIÓN FINANCIERA ---");
        result.log.forEach(l => console.log(l));
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
      console.log(`[DB] Reservation ${finalRes.id} saved. facturacionTipo=${finalRes.facturacionTipo}, servicios statusList=[${(finalRes.servicios||[]).map((s:any)=>s.statusFacturacion).join(',')}]`);
    } catch (e) {
      console.error("[DB] Failed to update reservation:", e);
      alert(`Error al guardar expediente: ${(e as any)?.message || e}`);
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
  };

  const handleAddInvoice = async (newInv: any) => {
    newInv.updatedAt = new Date().toISOString();
    setInvoices(prev => [newInv, ...prev]);
    try {
      await insertInvoice(dataConnect, {
        id: newInv.id,
        clientName: newInv.clientName,
        date: newInv.date,
        dueDate: newInv.dueDate,
        amount: newInv.amount,
        vatAmount: newInv.vatAmount,
        type: newInv.type,
        status: newInv.status,
        updatedAt: newInv.updatedAt
      });
    } catch (e) {
      console.error("Failed to insert invoice", e);
    }
  };

  const handleUpdateClient = async (updated: any) => {
    updated.updatedAt = new Date().toISOString();
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



  // --- FLIGHT TICKETS (Boletos) ---
  const handleAddBoleto = async (newBol: FlightTicket) => {
    try {
      const finalBol = { ...newBol, id: nextSequentialId("BOL", boletos.map(b => b.id)) };
      setBoletos(prev => [...prev, finalBol]);
      await insertFlightTicket(dataConnect, { ...finalBol });
    } catch (e) {}
  };
  const handleUpdateBoleto = async (updated: FlightTicket) => {
    try {
      setBoletos(prev => prev.map(b => b.id === updated.id ? updated : b));
      await updateFlightTicket(dataConnect, { ...updated });
    } catch (e) {
      console.error("Failed to update flight ticket", e);
      alert(`Error al guardar el boleto aéreo: ${(e as any)?.message || e}. Por favor reintente.`);
    }
  };
  const handleDeleteBoleto = async (id: string) => {
    try {
      setBoletos(prev => prev.filter(b => b.id !== id));
      await deleteFlightTicket(dataConnect, { id });
    } catch (e) {}
  };

  // --- PAYMENT VOUCHERS ---
  const handleAddVoucher = async (newVoucher: PaymentVoucher) => {
    setVouchers(prev => [...prev, newVoucher]);
    try {
      await insertPaymentVoucher(dataConnect, { ...newVoucher });
    } catch (e) {
      console.error("Failed to insert payment voucher", e);
    }
  };
  const handleUpdateVoucher = async (updated: PaymentVoucher) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
    try {
      await updatePaymentVoucher(dataConnect, { id: updated.id, status: updated.status });
    } catch (e) {
      console.error("Failed to update payment voucher", e);
    }
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
        mercado: newRate.mercado
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
        mercado: updatedRate.mercado
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
        motivo: newStop.motivo
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
        motivo: updatedStop.motivo
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans antialiased">
      
      {/* SIDEBAR PERSISTENTE IZQUIERDO */}
      <aside className="w-72 bg-zinc-950 flex flex-col h-screen fixed left-0 top-0 text-white p-5 border-r border-zinc-900 z-20 font-sans">
        
        {/* Brand Header */}
        <button 
          onClick={() => setCurrentSection(ProjectView.CONFIGURACION)}
          className="flex items-center gap-3 mb-9 px-2 py-1.5 hover:bg-zinc-900/40 rounded-lg cursor-pointer transition-all w-full text-left focus:outline-none"
          title="Configuración de Empresa"
        >
          <div className="w-10 h-10 rounded-md bg-white text-zinc-950 flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
            {companyConfig.logoLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-sans">
              <h1 className="font-bold text-sm tracking-tight leading-none text-white truncate max-w-[120px]" title={companyConfig.name}>{companyConfig.name}</h1>
              <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-1 py-0.5 rounded-sm flex-shrink-0">V0</span>
            </div>
            <p className="text-[9px] text-zinc-550 font-medium mt-1 uppercase tracking-wider truncate" title={companyConfig.subtitle}>{companyConfig.subtitle}</p>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pb-6">

          {/* BUSCADOR GLOBAL — botón principal arriba */}
          <button
            id="nav-buscador"
            onClick={() => setCurrentSection(ProjectView.BUSCADOR)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer mb-3 ${currentSection === ProjectView.BUSCADOR ? 'bg-white/10 text-white font-semibold border border-white/10' : 'text-zinc-300 hover:text-white hover:bg-zinc-900/60 border border-transparent'}`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-bold tracking-wide">Buscador Global</span>
          </button>

          <div className="h-px bg-zinc-800 mb-3" />

          {/* COMERCIAL */}
          <div className="px-1">
            <button onClick={() => toggleMenu('comercial')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Comercial</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.comercial ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.comercial && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-propiedades" onClick={() => setCurrentSection(ProjectView.PROPIEDADES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.PROPIEDADES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Propiedades y Tarifas</span>
                </button>
                <button id="nav-servicios" onClick={() => setCurrentSection(ProjectView.SERVICIOS_VARIOS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.SERVICIOS_VARIOS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Box className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Servicios Varios</span>
                </button>
              </div>
            )}
          </div>

          {/* OPERACIONES */}
          <div className="px-1 mt-2">
            <button onClick={() => toggleMenu('operaciones')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Operaciones & Tráfico</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.operaciones ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.operaciones && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-reservas" onClick={() => setCurrentSection(ProjectView.RESERVAS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.RESERVAS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Reservas (Booking)</span>
                </button>
                <button id="nav-vuelos" onClick={() => setCurrentSection(ProjectView.VUELOS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.VUELOS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Plane className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Vuelos (Air Control)</span>
                </button>
                <button id="nav-operaciones" onClick={() => setCurrentSection(ProjectView.OPERACIONES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.OPERACIONES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Ops. Receptivo</span>
                </button>
              </div>
            )}
          </div>

          {/* DIRECTORIO */}
          <div className="px-1 mt-2">
            <button onClick={() => toggleMenu('directorio')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Directorio</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.directorio ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.directorio && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-clientes" onClick={() => setCurrentSection(ProjectView.CLIENTES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.CLIENTES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Clientes</span>
                </button>
                <button id="nav-proveedores" onClick={() => setCurrentSection(ProjectView.PROVEEDORES)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.PROVEEDORES ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Proveedores</span>
                </button>
              </div>
            )}
          </div>

          {/* ADMIN & FINANZAS */}
          <div className="px-1 mt-2">
            <button onClick={() => toggleMenu('finanzas')} className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hover:text-white transition-colors">
              <span>Admin & Finanzas</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedMenus.finanzas ? '' : '-rotate-90'}`} />
            </button>
            {expandedMenus.finanzas && (
              <div className="space-y-1 mt-1 pl-1">
                <button id="nav-admin" onClick={() => setCurrentSection(ProjectView.ADMINISTRACION)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.ADMINISTRACION ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Wallet className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Administración / BI</span>
                </button>
                <button id="nav-facturacion" onClick={() => setCurrentSection(ProjectView.FACTURACION)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.FACTURACION ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <Receipt className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Dpto. Facturación</span>
                </button>
                <button id="nav-cobranzas" onClick={() => setCurrentSection(ProjectView.COBRANZAS)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.COBRANZAS ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Cuentas por Cobrar</span>
                </button>
                <button id="nav-pagos" onClick={() => setCurrentSection(ProjectView.CUENTAS_PAGAR)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.CUENTAS_PAGAR ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <ArrowDownRight className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Cuentas por Pagar</span>
                </button>
                <button id="nav-contabilidad" onClick={() => setCurrentSection(ProjectView.CONTABILIDAD)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${currentSection === ProjectView.CONTABILIDAD ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}>
                  <ReceiptText className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">Contabilidad / Fiscal</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* CONTINENTE DE CONTENIDO PRINCIPAL (COLUMNA DERECHA) */}
      <div className="flex-1 pl-72 flex flex-col min-h-screen">
        
        {/* TOP GENERAL BAR */}
        <header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-8 sticky top-0 z-10">
          
          {/* Left indicator showing daily exchange rates */}
          <div className="flex items-center gap-5 text-xs text-zinc-500 font-sans font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-700 font-bold">
              💵 Tipo de Cambio del Día
            </span>
            <span className="font-mono text-zinc-800">
              1 USD = €{exchangeRates.usdToEur.toLocaleString("es-ES", { minimumFractionDigits: 2 })} EUR
            </span>
            <span className="text-zinc-300">|</span>
            <span className="font-mono text-zinc-800">
              1 USD = Bs. {exchangeRates.usdToVes.toLocaleString("es-ES", { minimumFractionDigits: 2 })} VES
            </span>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 font-sans">
            <div className="w-8.5 h-8.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-xs">
              JD
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-zinc-800 leading-tight">Juan Delgado</p>
              <p className="text-[10px] text-zinc-400 leading-none">Administrador Senior</p>
            </div>
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
                      serviceRates={serviceRates}
                      onAddServiceRate={handleAddServiceRate}
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
                      companyConfig={companyConfig}
                      jurisdiction={jurisdiction}
                      currentExchangeRate={todayExchangeRate}
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
                       providerStatements={providerStatements}
                       onAddProviderStatement={handleAddStatement}
                       vouchers={vouchers}
                       boletos={boletos}
                       onBoletosChange={setBoletos}
                       onUpdateBoleto={handleUpdateBoleto}
                       companyConfig={companyConfig}
                       jurisdiction={jurisdiction}
                       currentExchangeRate={todayExchangeRate}
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
                    exchangeRates={exchangeRates}
                    onExchangeRatesChange={setExchangeRates}
                    payableObligations={payableObligations}
                  />
                )}
                {currentSection === ProjectView.CLIENTES && (
                  <ClientesView
                    clients={clients}
                    onUpdateClient={handleUpdateClient}
                    onAddClient={handleAddClient}
                    directClients={directClients}
                    onUpdateDirectClient={handleUpdateDirectClient}
                    onAddDirectClient={handleAddDirectClient}
                    invoices={invoices}
                    reservations={reservations}
                    boletos={boletos}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    detailedProperties={detailedProperties}
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
                {currentSection === ProjectView.CONFIGURACION && (
                  <ConfiguracionView 
                    config={companyConfig}
                    onUpdateConfig={handleUpdateCompanyConfig}
                  />
                )}
              </div>
          </div>

        </main>
      </div>

    </div>
  );
}

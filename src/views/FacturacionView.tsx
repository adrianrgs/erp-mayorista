import React, { useState } from "react";
import { Reservation, FinancialInvoice, ServiceItem, B2BClient, ServiceType, PayableObligation, ProviderStatement, CompanyConfig, PaymentVoucher } from "../types";
import { RoomType, RatePlan, Property, TipoCobro } from "../types/producto";
import type { FlightTicket } from "../types/aereos";
import { calculateTaxes, TaxJurisdiction, DEFAULT_JURISDICTION, ClientTaxProfile } from "../lib/taxEngine";
import { nextSequentialId } from "../lib/idGenerator";
import { formatGDSDate } from "../lib/parsers/pnrParser";
import { 
  FileCheck, 
  Clock, 
  Search, 
  Printer, 
  Send, 
  FileText, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  User,
  ArrowRight,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Info,
  Calendar,
  Building,
  Users,
  Download,
  AlertTriangle,
  Scale,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Calculator
} from "lucide-react";
import { useDialog } from "../components/ui/DialogProvider";
import { Tabs } from "../components/reservas/Tabs";
import { storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface FacturacionViewProps {
  reservations: Reservation[];
  invoices: FinancialInvoice[];
  onUpdateReservation: (updated: Reservation) => void;
  onAddInvoice?: (newInv: FinancialInvoice) => void;
  onUpdateInvoice?: (updated: FinancialInvoice) => void;
  clients: B2BClient[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
  onUpdateClient?: (updated: B2BClient) => void;
  payableObligations?: PayableObligation[];
  onAddPayableObligation?: (obligation: PayableObligation) => void;
  providerStatements?: ProviderStatement[];
  onAddProviderStatement?: (statement: ProviderStatement) => void;
  vouchers?: PaymentVoucher[];
  boletos?: FlightTicket[];
  onBoletosChange?: React.Dispatch<React.SetStateAction<FlightTicket[]>>;
  onUpdateBoleto?: (b: FlightTicket) => void;
  companyConfig: CompanyConfig;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}

export default function FacturacionView({
  reservations,
  invoices,
  onUpdateReservation,
  onAddInvoice,
  onUpdateInvoice,
  clients,
  roomTypes,
  ratePlans,
  detailedProperties,
  onUpdateClient,
  payableObligations = [],
  onAddPayableObligation,
  providerStatements = [],
  onAddProviderStatement,
  vouchers = [],
  boletos = [],
  onBoletosChange,
  onUpdateBoleto,
  companyConfig,
  jurisdiction,
  currentExchangeRate = 1,
}: FacturacionViewProps) {
  const { showAlert } = useDialog();

  const activeJurisdiction = jurisdiction ?? DEFAULT_JURISDICTION;

  const buildClientProfile = (client?: B2BClient): ClientTaxProfile => ({
    isWithheldClient: client?.isWithheldClient ?? false,
    vatWithholdingPct: client?.vatWithholdingPct ?? 0,
    incomeTaxWithholdingPct: client?.incomeTaxWithholdingPct ?? 0,
    isInExemptZone: client?.isInExemptZone ?? false,
  });

  const computeTax = (amount: number, res?: Reservation, client?: B2BClient, forceExempt?: boolean) => {
    const profile = buildClientProfile(client);
    if (forceExempt) profile.isInExemptZone = true;
    return calculateTaxes(
      amount,
      res?.comprobanteMetodo ?? '',
      activeJurisdiction,
      profile,
      currentExchangeRate,
    );
  };

  const [overrideExempt, setOverrideExempt] = useState(false);
  const [activeTab, setActiveTab] = useState<"solicitudes" | "historial">("solicitudes");
  const [search, setSearch] = useState("");
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [refundInputs, setRefundInputs] = useState<Record<string, string>>({});
  const [queueTab, setQueueTab] = useState<"anuladas" | "atencion" | "proveedor" | "facturadas">("atencion");

  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  
  const [selectedFacturacionTipo, setSelectedFacturacionTipo] = useState<"Crédito" | "Pago Contado">("Pago Contado");
  const [useSaldoFavor, setUseSaldoFavor] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<FinancialInvoice | null>(null);

  const handlePrintInvoice = () => {
    const printContent = document.getElementById("printable-invoice-doc");
    const root = document.getElementById("root");
    if (!printContent || !root) return;
    
    const clone = printContent.cloneNode(true) as HTMLElement;
    clone.id = "print-clone";
    clone.style.position = "absolute";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.width = "100%";
    clone.style.backgroundColor = "white";
    clone.style.zIndex = "999999";
    clone.style.padding = "20px";
    
    root.style.display = "none";
    document.body.appendChild(clone);
    
    setTimeout(() => {
      window.print();
      document.body.removeChild(clone);
      root.style.display = "";
    }, 150);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Removed extranet rate auditing as requested
  // Helper to render detailed print metadata in the Dossier table (Simplified, no audit parameters)
  const renderDossierServiceDetailsPrint = (s: ServiceItem, res: Reservation) => {
    const det = s.detalles || {};

    switch (s.tipo) {
      case ServiceType.ALOJAMIENTO: {
        const checkIn = det.checkInDate || "No especificada";
        const checkOut = det.checkOutDate || "No especificada";
        
        const ratePlan = ratePlans.find(rp => rp.id === det.selectedRatePlanId);
        const ratePlanName = ratePlan ? ratePlan.nombrePromocion : det.selectedRatePlanId || "Estándar";

        // Nights calculation
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        let nights = 1;
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }

        return (
          <div className="mt-2 text-[10px] text-zinc-605 bg-zinc-50 p-2 rounded border border-zinc-200 space-y-2 text-left font-sans">
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 pb-1.5 font-bold">
              <div>Check-in: <span className="font-mono text-zinc-800">{formatDate(checkIn)}</span></div>
              <div>Check-out: <span className="font-mono text-zinc-800">{formatDate(checkOut)}</span></div>
              <div>Noches: <span className="text-zinc-800 font-mono">{nights}</span></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Configuración de Tarifa</span>
                <div className="font-semibold text-zinc-800 leading-tight">
                  <p>Plan: {ratePlanName}</p>
                  {ratePlan && (
                    <p className="text-[9.5px] text-zinc-550 font-medium">Cobro: {ratePlan.tipoCobro} | Tarifa base: ${ratePlan.tarifaBase} USD/noche</p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Desglose de Pasajeros</span>
                <div className="space-y-1">
                  {det.lodgingRooms && det.lodgingRooms.map((room: any, idx: number) => {
                    const roomTypeObj = roomTypes.find(rt => rt.id === room.roomTypeId);
                    const roomTypeName = roomTypeObj ? roomTypeObj.nombre : room.roomTypeId || `Habitación ${idx + 1}`;
                    return (
                      <div key={idx} className="bg-white border border-zinc-150 p-1.5 rounded text-[9px] font-semibold leading-none shadow-3xs">
                        <div className="flex justify-between border-b border-zinc-100 pb-0.5 mb-1 font-bold text-zinc-700">
                          <span>{roomTypeName}</span>
                          <span>{room.adultsCount} Pax</span>
                        </div>
                        <div className="space-y-0.5">
                          {room.guests && room.guests.map((g: any, gIdx: number) => (
                            <div key={gIdx} className="text-zinc-500 font-mono flex gap-1 items-center">
                              <span>{gIdx + 1}.</span>
                              <span className="uppercase font-bold text-zinc-755">{g.name || "Sin Nombre asignado"}</span>
                              <span className="text-[7px] bg-zinc-100 px-0.5 rounded text-zinc-400 font-sans font-bold">{g.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case ServiceType.TRASLADO: {
        const pickup = det.transPickup || "No especificado";
        const dropoff = det.transDropoff || "No especificado";
        const date = det.transDate || "No especificado";
        const vehicle = det.transVehicle || "No especificado";
        const tripType = det.transTripType === "round-trip" ? "Ida y Vuelta" : "Solo Ida";
        const serviceType = det.transServiceType === "privado" ? "Privado" : "Compartido";
        const pax = det.transPax || 1;

        return (
          <div className="mt-2 text-[10px] text-zinc-650 bg-zinc-50 p-2 rounded border border-zinc-200 space-y-2 text-left font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Ruta y Logística</span>
                <div className="font-semibold text-zinc-800 space-y-0.5">
                  <p>Origen: <span className="font-extrabold uppercase text-zinc-955">{pickup}</span></p>
                  <p>Destino: <span className="font-extrabold uppercase text-zinc-955">{dropoff}</span></p>
                  {det.transTripType === "round-trip" && (
                    <p className="text-[9px] text-zinc-505 font-medium">🔄 Retorno: {det.transReturnDropoff || pickup} el {formatDate(det.transReturnDate)}</p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Vehículo y Pax</span>
                <div className="font-semibold text-zinc-800 space-y-0.5">
                  <p>Vehículo: {vehicle} ({serviceType})</p>
                  <p>Modalidad: {tripType} | Pasajeros: {pax} Pax</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case ServiceType.SEGURO: {
        const plan = det.insPlan || "Plan Estándar";
        const start = det.insStartDate || "No especificado";
        const end = det.insEndDate || "No especificado";
        const days = det.insDays || 1;
        const pax = det.insPax || 1;

        return (
          <div className="mt-2 text-[10px] text-zinc-650 bg-zinc-50 p-2 rounded border border-zinc-200 space-y-2 text-left font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Vigencia</span>
                <div className="font-semibold text-zinc-850 space-y-0.5">
                  <p>Plan: {plan}</p>
                  <p>Fechas: {formatDate(start)} ➔ {formatDate(end)}</p>
                  <p>Duración: {days} días | Pasajeros: {pax} Pax</p>
                </div>
              </div>
              <div className="font-semibold text-zinc-850 space-y-0.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Estado de Tarifas</span>
                <p>Tipo de Cobertura: Internacional</p>
                {det.salePrice && (
                  <p>PVP Unitario: ${(parseFloat(det.salePrice) || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</p>
                )}
              </div>
            </div>
          </div>
        );
      }
      case ServiceType.RENT_A_CAR: {
        const category = det.carCategory || "No especificado";
        const supplier = det.carSupplier || "No especificado";
        const start = det.carStartDate || "No especificado";
        const end = det.carEndDate || "No especificado";
        const days = det.carDays || 1;

        return (
          <div className="mt-2 text-[10px] text-zinc-650 bg-zinc-50 p-2 rounded border border-zinc-200 space-y-2 text-left font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Vehículo y Proveedor</span>
                <div className="font-semibold text-zinc-850 space-y-0.5">
                  <p>Rent-A-Car: {supplier}</p>
                  <p>Categoría: {category}</p>
                  <p>Período: {formatDate(start)} ➔ {formatDate(end)}</p>
                </div>
              </div>
              <div className="font-semibold text-zinc-855 space-y-0.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Renta</span>
                <p>Duración: {days} días de alquiler</p>
              </div>
            </div>
          </div>
        );
      }
      case ServiceType.MANUAL: {
        const supplier = det.manualSupplier || "Directo";
        const description = det.manualDescription || "No especificado";

        return (
          <div className="mt-2 text-[10px] text-zinc-650 bg-zinc-50 p-2 rounded border border-zinc-200 space-y-2 text-left font-sans">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Entrada Manual Receptiva</span>
              <div className="font-semibold text-zinc-850 space-y-1">
                <p>Proveedor: {supplier}</p>
                <p className="text-[9.5px] italic text-zinc-500 font-medium">Notas: {description}</p>
              </div>
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="mt-2 text-[10px] text-zinc-450 italic text-left">
            No hay detalles estructurados cargados para este servicio legacy.
          </div>
        );
    }
  };

  // Helper to render service details in inspector panel
  const renderServiceDetails = (s: ServiceItem) => {
    const det = s.detalles || {};

    switch (s.tipo) {
      case ServiceType.ALOJAMIENTO: {
        const checkIn = det.checkInDate || "No especificada";
        const checkOut = det.checkOutDate || "No especificada";
        const promo = det.selectedPromoName || "Ninguna";
        
        const ratePlan = ratePlans.find(rp => rp.id === det.selectedRatePlanId);
        const ratePlanName = ratePlan ? ratePlan.nombrePromocion : det.selectedRatePlanId || "Estándar";

        // Nights calculation
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        let nights = 1;
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }

        return (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 text-[10.5px] text-zinc-550 space-y-2 bg-zinc-50/70 p-2 rounded no-print">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold text-left">
              <div><span className="text-zinc-400">Check-in:</span> <span className="font-mono text-zinc-800 font-bold">{formatDate(checkIn)}</span></div>
              <div><span className="text-zinc-400">Check-out:</span> <span className="font-mono text-zinc-800 font-bold">{formatDate(checkOut)}</span></div>
              <div><span className="text-zinc-400">Noches:</span> <span className="font-bold text-zinc-850">{nights} noche(s)</span></div>
              <div className="col-span-1 truncate"><span className="text-zinc-400">Tarifa / Plan:</span> <span className="font-bold text-zinc-800">{ratePlanName}</span></div>
              {promo && promo !== "Ninguna" && (
                <div className="col-span-2"><span className="text-zinc-400">Promoción:</span> <span className="text-emerald-700 font-extrabold">{promo}</span></div>
              )}
            </div>

            {/* Extranet Contract Info */}
            {ratePlan && (
              <div className="bg-white p-2 rounded border border-zinc-200 text-[9px] text-zinc-650 space-y-1 text-left">
                <span className="font-black text-zinc-800 uppercase block text-[8px] tracking-wider">Reglas del Contrato Extranet:</span>
                <div>Cobro: <span className="font-bold text-zinc-700">{ratePlan.tipoCobro}</span> | Tarifa Base: <span className="font-bold text-zinc-700">${ratePlan.tarifaBase} USD/noche</span></div>
                {ratePlan.tipoCobro === TipoCobro.POR_PERSONA && (
                  <div>Extra Adulto: <span className="font-bold text-zinc-700">${ratePlan.tarifaExtraAdulto} USD</span> | Extra Niño: <span className="font-bold text-zinc-700">${ratePlan.tarifaExtraNino} USD</span></div>
                )}
                <div className="text-zinc-455 italic truncate" title={ratePlan.politicasCancelacion}>Pol. Cancelación: {ratePlan.politicasCancelacion}</div>
              </div>
            )}
            
            {det.lodgingRooms && det.lodgingRooms.length > 0 && (
              <div className="mt-2 space-y-1 pt-1 border-t border-zinc-200/60 text-left">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-black block">Habitaciones & Pasajeros:</span>
                {det.lodgingRooms.map((room: any, idx: number) => {
                  const roomTypeObj = roomTypes.find(rt => rt.id === room.roomTypeId);
                  const roomTypeName = roomTypeObj ? roomTypeObj.nombre : room.roomTypeId || `Habitación ${idx + 1}`;
                  return (
                    <div key={idx} className="bg-white border border-zinc-150 p-1.5 rounded text-[9.5px] space-y-1 shadow-3xs">
                      <div className="flex justify-between font-bold text-zinc-755 border-b border-zinc-100 pb-0.5">
                        <span>{roomTypeName}</span>
                        <span className="text-zinc-400 font-normal">({room.adultsCount} Pax)</span>
                      </div>
                      <div className="space-y-0.5 pl-1">
                        {room.guests && room.guests.map((g: any, gIdx: number) => (
                          <div key={gIdx} className="text-zinc-650 flex items-center gap-1 font-medium">
                            <span className="text-zinc-455 font-mono text-[8px]">{gIdx + 1}.</span>
                            <span className="uppercase font-bold text-zinc-800">{g.name || "Sin nombre asignado"}</span>
                            <span className="text-[7.5px] bg-zinc-105 border border-zinc-200 px-0.5 rounded text-zinc-500 font-bold">{g.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      case ServiceType.TRASLADO: {
        const pickup = det.transPickup || "No especificado";
        const dropoff = det.transDropoff || "No especificado";
        const date = det.transDate || "No especificado";
        const vehicle = det.transVehicle || "No especificado";
        const tripType = det.transTripType === "round-trip" ? "Ida y Vuelta" : "Solo Ida";
        const serviceType = det.transServiceType === "privado" ? "Privado" : "Compartido";
        const pax = det.transPax || 1;
        
        return (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 text-[10.5px] text-zinc-550 space-y-1 bg-zinc-50/70 p-2 rounded no-print text-left">
            <div className="font-bold text-zinc-850">Ruta: <span className="font-extrabold text-zinc-955 uppercase">{pickup} ➔ {dropoff}</span></div>
            {det.transTripType === "round-trip" && (
              <div className="text-zinc-650 font-medium pl-1.5">🔄 Retorno: <span className="font-bold uppercase text-zinc-700">{det.transReturnDropoff || pickup}</span> el <span className="font-mono font-bold text-zinc-800">{formatDate(det.transReturnDate)}</span></div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold text-[10px] pt-1 border-t border-zinc-200/60 mt-1">
              <div><span className="text-zinc-400">Fecha:</span> <span className="font-mono text-zinc-855 font-bold">{formatDate(date)}</span></div>
              <div><span className="text-zinc-400">Pasajeros:</span> <span className="font-bold text-zinc-800">{pax} Pax</span></div>
              <div><span className="text-zinc-400">Vehículo:</span> <span className="font-bold text-zinc-850">{vehicle}</span></div>
              <div><span className="text-zinc-400">Servicio:</span> <span className="font-bold text-zinc-855">{serviceType} ({tripType})</span></div>
            </div>
          </div>
        );
      }
      case ServiceType.SEGURO: {
        const plan = det.insPlan || "Plan Estándar";
        const start = det.insStartDate || "No especificado";
        const end = det.insEndDate || "No especificado";
        const days = det.insDays || 1;
        const pax = det.insPax || 1;
        
        return (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 text-[10.5px] text-zinc-550 space-y-1 bg-zinc-50/70 p-2 rounded no-print text-left">
            <div className="font-bold text-zinc-855">Plan Seguro: <span className="font-extrabold text-zinc-950">{plan}</span></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold text-[10px] pt-1 border-t border-zinc-200/60 mt-1">
              <div><span className="text-zinc-400">Inicio:</span> <span className="font-mono text-zinc-850 font-bold">{formatDate(start)}</span></div>
              <div><span className="text-zinc-400">Vence:</span> <span className="font-mono text-zinc-850 font-bold">{formatDate(end)}</span></div>
              <div><span className="text-zinc-400">Vigencia:</span> <span className="font-bold text-zinc-800">{days} días de cobertura</span></div>
              <div><span className="text-zinc-400">Pasajeros:</span> <span className="font-bold text-zinc-800">{pax} Pax</span></div>
              {det.salePrice && (
                <div className="col-span-2"><span className="text-zinc-400">PVP Unitario:</span> <span className="font-bold text-zinc-800">${(parseFloat(det.salePrice) || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span></div>
              )}
            </div>
          </div>
        );
      }
      case ServiceType.RENT_A_CAR: {
        const category = det.carCategory || "No especificado";
        const supplier = det.carSupplier || "No especificado";
        const start = det.carStartDate || "No especificado";
        const end = det.carEndDate || "No especificado";
        const days = det.carDays || 1;
        
        return (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 text-[10.5px] text-zinc-550 space-y-1 bg-zinc-50/70 p-2 rounded no-print text-left">
            <div className="font-bold text-zinc-850">Rent-A-Car: <span className="font-extrabold text-zinc-955 uppercase">{supplier}</span></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold text-[10px] pt-1 border-t border-zinc-200/60 mt-1">
              <div><span className="text-zinc-400">Categoría:</span> <span className="font-bold text-zinc-850">{category}</span></div>
              <div><span className="text-zinc-400">Días:</span> <span className="font-bold text-zinc-800">{days} días de renta</span></div>
              <div><span className="text-zinc-400">Entrega:</span> <span className="font-mono text-zinc-850 font-bold">{formatDate(start)}</span></div>
              <div><span className="text-zinc-400">Devuelve:</span> <span className="font-mono text-zinc-850 font-bold">{formatDate(end)}</span></div>
            </div>
          </div>
        );
      }
      case ServiceType.MANUAL: {
        const supplier = det.manualSupplier || "Directo";
        const description = det.manualDescription || "No especificado";
        
        return (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 text-[10.5px] text-zinc-550 space-y-1 bg-zinc-50/70 p-2 rounded no-print text-left">
            <div className="font-bold text-zinc-850">Proveedor Receptivo: <span className="font-extrabold text-zinc-950 uppercase">{supplier}</span></div>
            <p className="text-zinc-660 font-semibold italic mt-1"><span className="text-zinc-400 font-black uppercase text-[8.5px] block font-sans">Notas de Coordinación:</span> {description}</p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const aereoReservations: Reservation[] = boletos
    .filter(b => b.expedienteAereo && b.expedienteAereo.status !== "Borrador" && !b.facturarConjunto)
    .map(b => {
      const exp = b.expedienteAereo!;
      const checkIn = b.segmentos?.[0]?.fecha;
      const origin = b.segmentos?.[0]?.origen || "";
      const dest = b.segmentos && b.segmentos.length > 0 ? b.segmentos[b.segmentos.length-1].destino : "";
      
      return {
        id: exp.id,
        holder: exp.titular,
        checkIn: checkIn,
        checkOut: checkIn, // Aéreos no tienen un checkout tan claro en el mismo formato, usamos checkIn
        pax: b.pasajeros?.length || 1,
        totalPrice: b.precioVenta || 0,
        netPrice: b.costoNeto || 0,
        status: "Confirmada",
        agenciaName: exp.clienteB2BNombre,
        comprobanteMonto: exp.comprobanteMonto,
        hotelName: "Boleto Aéreo GDS",
        facturacionTipo: exp.facturacionTipo,
        servicios: [
          {
            id: b.id,
            tipo: ServiceType.AEREO,
            descripcion: `PNR: ${b.pnr} | Ruta: ${origin}-${dest}`,
            precioNeto: b.costoNeto,
            precioVenta: b.precioVenta,
            statusFacturacion: exp.status === "Solicitado" ? "Solicitado" : 
                               exp.status === "Facturado" || exp.status === "PagadoAerolinea" ? "Facturado" : "Rechazado",
            detalles: {
              pnr: b.pnr,
              pasajeros: b.pasajeros,
              segmentos: b.segmentos
            }
          }
        ]
      } as Reservation;
    });

  const allBookings = [...reservations, ...aereoReservations];

  // Only manage actual bookings that have been sent to billing (i.e. has at least one service or joint flight with Solicitado, Facturado, or Rechazado status)
  const realBookings = allBookings.filter(r => {
    const isReal = r.tipo === "Reserva Real" || r.tipo === undefined;
    if (!isReal) return false;
    const services = r.servicios || [];
    const hasBilledOrRequestedServices = services.some(s => s.statusFacturacion === "Solicitado" || s.statusFacturacion === "Facturado" || s.statusFacturacion === "Rechazado");
    
    const jointFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto);
    const hasBilledOrRequestedFlights = jointFlights.some(b => b.expedienteAereo && (b.expedienteAereo.status === "Solicitado" || b.expedienteAereo.status === "Facturado" || b.expedienteAereo.status === "PagadoAerolinea"));

    return hasBilledOrRequestedServices || hasBilledOrRequestedFlights;
  });

  const filtered = realBookings.filter(r => {
    const safeId = r.id || "";
    const safeHolder = r.holder || "";
    const safeAgencia = r.agenciaName || "";
    return safeId.toLowerCase().includes(search.toLowerCase()) ||
           safeHolder.toLowerCase().includes(search.toLowerCase()) ||
           safeAgencia.toLowerCase().includes(search.toLowerCase());
  });

  // Sort: Put cancellation requests first, then pending billing requests ("Solicitado")
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const aJointFlights = boletos.filter(bl => bl.expedienteId === a.id && bl.facturarConjunto);
    const bJointFlights = boletos.filter(bl => bl.expedienteId === b.id && bl.facturarConjunto);

    const aNeedsCancel = (a.status === "Cancelada" && (
      (a.servicios || []).some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
      aJointFlights.some(f => f.expedienteAereo?.status === "Facturado" || f.expedienteAereo?.status === "PagadoAerolinea" || f.expedienteAereo?.status === "Solicitado")
    )) ? 1 : 0;
    const bNeedsCancel = (b.status === "Cancelada" && (
      (b.servicios || []).some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
      bJointFlights.some(f => f.expedienteAereo?.status === "Facturado" || f.expedienteAereo?.status === "PagadoAerolinea" || f.expedienteAereo?.status === "Solicitado")
    )) ? 1 : 0;
    
    if (aNeedsCancel !== bNeedsCancel) {
      return bNeedsCancel - aNeedsCancel;
    }

    const aHasReq = ((a.servicios || []).some(s => s.statusFacturacion === "Solicitado") || aJointFlights.some(f => f.expedienteAereo?.status === "Solicitado")) ? 1 : 0;
    const bHasReq = ((b.servicios || []).some(s => s.statusFacturacion === "Solicitado") || bJointFlights.some(f => f.expedienteAereo?.status === "Solicitado")) ? 1 : 0;
    return bHasReq - aHasReq;
  });

  // Shared per-reservation status computation, used both to classify each row into a queue tab
  // ("bucket") and to render its badges/buttons — avoids computing this twice per row.
  const getBookingStatus = (r: Reservation) => {
    const services = r.servicios || [];
    const jointFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto);
    const billedCount = services.filter(s => s.statusFacturacion === "Facturado").length +
                       jointFlights.filter(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea").length;
    const requestedCount = services.filter(s => s.statusFacturacion === "Solicitado").length +
                          jointFlights.filter(b => b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador").length;
    const totalCount = services.length + jointFlights.length;
    const percent = totalCount > 0 ? Math.round((billedCount / totalCount) * 100) : 100;
    const hasRequest = requestedCount > 0 || jointFlights.some(b => b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador");
    const hasBilled = billedCount > 0;
    const draftCount = services.filter(s => s.statusFacturacion === "Borrador").length;
    const pendingVariationSupplements = (r.variaciones || []).filter((v: any) => v.type === "Suplemento" && v.status === "Solicitado" && !v.invoiceId).length;
    const pendingVariationCredits = (r.variaciones || []).filter((v: any) => v.type === "Credito" && v.status !== "Borrador" && !v.invoiceId).length;
    const hasPendingSupplement = hasBilled && (draftCount > 0 || pendingVariationSupplements > 0);
    const hasPendingCreditNote = hasBilled && pendingVariationCredits > 0;
    const hasPendingExcessVerification = (r.variaciones || []).some((v: any) => (v.excessPendingVerification || 0) > 0);
    const isCancellationRequest = r.status === "Cancelada" && (
      services.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
      jointFlights.some(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador")
    );
    const isCancelled = r.status === "Cancelada";

    let bucket: "anuladas" | "atencion" | "proveedor" | "facturadas";
    if (isCancelled) bucket = "anuladas";
    else if (hasRequest || hasPendingSupplement || hasPendingCreditNote) bucket = "atencion";
    else if (hasPendingExcessVerification) bucket = "proveedor";
    else bucket = "facturadas";

    return {
      services, jointFlights, billedCount, requestedCount, totalCount, percent, hasRequest, hasBilled,
      draftCount, pendingVariationSupplements, pendingVariationCredits, hasPendingSupplement,
      hasPendingCreditNote, hasPendingExcessVerification, isCancellationRequest, isCancelled, bucket
    };
  };

  const queueTabCounts = sortedAndFiltered.reduce((acc, r) => {
    const { bucket } = getBookingStatus(r);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<"anuladas" | "atencion" | "proveedor" | "facturadas", number>);

  const queueTabFiltered = sortedAndFiltered.filter(r => getBookingStatus(r).bucket === queueTab);

  const activeRes = selectedResId ? realBookings.find(r => r.id === selectedResId) : undefined;
  const activeResId = activeRes?.id || null;

  React.useEffect(() => {
    if (activeRes) {
      setSelectedFacturacionTipo(activeRes.facturacionTipo || "Pago Contado");
      setUseSaldoFavor(false);
    }
  }, [activeRes?.id]);

  // Billing statistics
  const totalBilledVal = realBookings.reduce((sum, r) => {
    const billedServices = r.servicios?.filter(s => s.statusFacturacion === "Facturado") || [];
    let rSum = billedServices.reduce((sSum, s) => sSum + s.precioVenta, 0);
    const billedFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto && (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea"));
    rSum += billedFlights.reduce((fSum, f) => fSum + f.precioVenta, 0);
    return sum + rSum;
  }, 0);

  const totalPendingVal = realBookings.reduce((sum, r) => {
    const pendingServices = r.servicios?.filter(s => s.statusFacturacion === "Solicitado") || [];
    let rSum = pendingServices.reduce((sSum, s) => sSum + s.precioVenta, 0);
    const pendingFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto && (b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador"));
    rSum += pendingFlights.reduce((fSum, f) => fSum + f.precioVenta, 0);
    return sum + rSum;
  }, 0);

  const pendingBillingCount = realBookings.filter(r => {
    const jointFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto);
    const hasPendingServices = r.servicios?.some(s => s.statusFacturacion === "Solicitado") || jointFlights.some(f => f.expedienteAereo?.status === "Solicitado");
    const isPendingCancellation = r.status === "Cancelada" && (
      r.servicios?.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
      jointFlights.some(f => f.expedienteAereo?.status === "Facturado" || f.expedienteAereo?.status === "PagadoAerolinea" || f.expedienteAereo?.status === "Solicitado")
    );
    return hasPendingServices || isPendingCancellation;
  }).length;

  const handleInvoiceVariation = async (variation: any) => {
    if (!activeRes) return;
    const _varAgency = clients.find(c => c.nombre === activeRes.agenciaName);
    const _varTax = computeTax(variation.amountSale, activeRes, _varAgency);
    const newInvoice: FinancialInvoice = {
      id: nextSequentialId("SUP", invoices.map(i => i.id)),
      clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Suplemento: ${variation.reason})`,
      date: new Date().toISOString().split("T")[0],
      dueDate: activeRes.checkIn,
      amount: variation.amountSale,
      vatAmount: _varTax.vatAmount,
      taxableBase: _varTax.taxableBase,
      surchargeAmount: _varTax.surchargeAmount,
      vatWithheld: _varTax.vatWithheld,
      incomeTaxWithheld: _varTax.incomeTaxWithheld,
      exchangeRate: _varTax.exchangeRate,
      localCurrencyAmount: _varTax.localCurrencyAmount,
      paymentMethod: activeRes.comprobanteMetodo,
      type: "Cobro",
      status: "Facturado"
    };

    if (onAddInvoice) {
      onAddInvoice(newInvoice);
    }

    // Update client's saldoDeber for the supplement amount
    const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);
    if (agencyRecord && onUpdateClient) {
      onUpdateClient({
        ...agencyRecord,
        saldoDeber: agencyRecord.saldoDeber + variation.amountSale
      });
    }

    const updatedVariations = (activeRes.variaciones || []).map((v: any) => {
      if (v.id === variation.id) {
        return { ...v, invoiceId: newInvoice.id };
      }
      return v;
    });

    onUpdateReservation({
      ...activeRes,
      variaciones: updatedVariations,
      __billingOnly: true
    } as any);

    setStatusMessage(`✓ Suplemento facturado con éxito. Documento emitido: ${newInvoice.id} — Se actualizó el saldo deudor del cliente.`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleCreditNoteVariation = async (variation: any) => {
    if (!activeRes) return;
    const _cnAgency = clients.find(c => c.nombre === activeRes.agenciaName);
    const _cnTax = computeTax(Math.abs(variation.amountSale), activeRes, _cnAgency);
    const creditNote: FinancialInvoice = {
      id: nextSequentialId("NC", invoices.map(i => i.id)),
      clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Nota de Crédito: ${variation.reason})`,
      date: new Date().toISOString().split("T")[0],
      dueDate: activeRes.checkIn,
      amount: variation.amountSale,
      vatAmount: variation.amountSale < 0 ? -_cnTax.vatAmount : _cnTax.vatAmount,
      taxableBase: variation.amountSale < 0 ? -_cnTax.taxableBase : _cnTax.taxableBase,
      exchangeRate: _cnTax.exchangeRate,
      localCurrencyAmount: variation.amountSale < 0 ? -_cnTax.localCurrencyAmount : _cnTax.localCurrencyAmount,
      paymentMethod: activeRes.comprobanteMetodo,
      type: "Cobro",
      status: "Pagado"
    };

    if (onAddInvoice) {
      onAddInvoice(creditNote);
    }

    // Price-modification-sourced credits (reducing units/nights on an already-billed service) are
    // gated behind "Enviar a Facturación" from Reservas — their balance impact was NOT applied when
    // the reservation was saved (see App.tsx, "Apply credit variation balance impact"), so it's
    // applied here instead, now that Facturación is formally approving the credit. Cancellation/
    // annulment-sourced credits already had their balance impact applied immediately at save time —
    // skip here to avoid double-counting (they have no "Modificación tarifa:" reason prefix).
    let pendingExcessAmount = 0;
    if (variation.reason?.startsWith("Modificación tarifa:") && _cnAgency && onUpdateClient) {
      const creditAmount = Math.abs(variation.amountSale);
      const isCreditClient = _cnAgency.tipo === "A Crédito" || activeRes.facturacionTipo === "Crédito";

      const relatedInvoices = invoices.filter(inv =>
        inv.clientName?.includes(activeRes.id) &&
        inv.status !== "Borrador" &&
        (inv.id?.startsWith("FAC-") || inv.id?.startsWith("SUP-"))
      );
      const totalInvoiced = relatedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalPaid = relatedInvoices.reduce((sum, inv) =>
        sum + vouchers.filter(v => v.invoiceId === inv.id && v.status === "Verificado").reduce((s, v) => s + v.amount, 0), 0);
      const invoiceRemaining = Math.max(0, totalInvoiced - totalPaid);
      const newTotalDue = activeRes.totalPrice;

      let newSaldoDeber = _cnAgency.saldoDeber;
      let excess = 0;

      if (isCreditClient) {
        if (totalPaid >= newTotalDue) {
          // Client already paid more than what's now owed — clear the remaining debt. Whether the
          // excess becomes saldoFavor right away or needs a manual check is decided below.
          excess = totalPaid - newTotalDue;
          newSaldoDeber = Math.max(0, newSaldoDeber - invoiceRemaining);
        } else {
          newSaldoDeber = Math.max(0, newSaldoDeber - creditAmount);
        }
      } else {
        excess = Math.max(0, totalPaid - newTotalDue);
      }

      const applyClientBalance = (creditExcessToFavor: boolean) => {
        const finalSaldoFavor = creditExcessToFavor ? _cnAgency.saldoFavor + excess : _cnAgency.saldoFavor;
        if (newSaldoDeber !== _cnAgency.saldoDeber || finalSaldoFavor !== _cnAgency.saldoFavor) {
          onUpdateClient({ ..._cnAgency, saldoDeber: newSaldoDeber, saldoFavor: finalSaldoFavor });
        }
      };

      // If the provider (hotel) for this specific service was already paid (parcial o total), the
      // wholesaler may not get that money back for the cancelled unit/night — crediting the excess
      // to saldoFavor automatically could become a real loss, and deciding on the spot with a popup
      // isn't realistic (someone has to actually check with the provider first). So instead of asking
      // right away, the debt is cleared now and the excess is parked as "pendiente de verificar" —
      // visible in the panel below, resolved later via "Proveedor reembolsó" / "Proveedor no reembolsa"
      // once someone has actually done that check.
      const serviceForCredit = activeRes.servicios?.find(s => s.id === variation.serviceItemId);
      const relatedObligation = serviceForCredit
        ? payableObligations.find(obl =>
            obl.locatorId === activeRes.id &&
            (obl.serviceDetail.toLowerCase().includes(serviceForCredit.descripcion.toLowerCase()) ||
             obl.providerName.toLowerCase().includes((serviceForCredit.proveedor || "").toLowerCase()))
          )
        : undefined;
      const providerAlreadyPaid = relatedObligation?.status === "Pagado Parcial" || relatedObligation?.status === "Pagado Total";
      const excessNeedsVerification = excess > 0 && providerAlreadyPaid;
      if (excessNeedsVerification) pendingExcessAmount = excess;

      applyClientBalance(excess > 0 && !excessNeedsVerification);

      // The client's aggregate saldoDeber above is now correct, but the original invoice record
      // itself (what "Facturas Pendientes" in Cuentas por Cobrar actually reads) still shows its
      // pre-credit amount as outstanding. Reduce it by the credit and mark it "Pagado" once what's
      // already been paid covers the new (lower) amount, so both views stay consistent.
      if (onUpdateInvoice) {
        const targetInvoice = relatedInvoices
          .filter(inv => inv.id?.startsWith("FAC-"))
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        if (targetInvoice) {
          const paidOnTarget = vouchers
            .filter(v => v.invoiceId === targetInvoice.id && v.status === "Verificado")
            .reduce((s, v) => s + v.amount, 0);
          const newAmount = Math.max(0, targetInvoice.amount - creditAmount);
          onUpdateInvoice({
            ...targetInvoice,
            amount: newAmount,
            status: paidOnTarget >= newAmount ? "Pagado" : targetInvoice.status
          });
        }
      }
    }

    const updatedVariations = (activeRes.variaciones || []).map((v: any) => {
      if (v.id === variation.id) {
        return { ...v, invoiceId: creditNote.id, excessPendingVerification: pendingExcessAmount > 0 ? pendingExcessAmount : undefined };
      }
      return v;
    });

    onUpdateReservation({
      ...activeRes,
      variaciones: updatedVariations,
      __billingOnly: true
    } as any);

    setStatusMessage(
      pendingExcessAmount > 0
        ? `✓ Nota de Crédito emitida. Documento: ${creditNote.id} — Excedente de $${pendingExcessAmount.toFixed(2)} pendiente de verificar con el proveedor antes de acreditar saldo a favor.`
        : `✓ Nota de Crédito emitida con éxito. Documento: ${creditNote.id}`
    );
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleResolvePendingExcess = (variation: any, refundedAmount: number) => {
    if (!activeRes) return;
    const excessAmount = variation.excessPendingVerification || 0;
    const creditedAmount = Math.max(0, Math.min(refundedAmount, excessAmount));
    const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);

    if (creditedAmount > 0 && agencyRecord && onUpdateClient) {
      onUpdateClient({ ...agencyRecord, saldoFavor: agencyRecord.saldoFavor + creditedAmount });
    }

    const updatedVariations = (activeRes.variaciones || []).map((v: any) =>
      v.id === variation.id ? { ...v, excessPendingVerification: undefined } : v
    );
    onUpdateReservation({
      ...activeRes,
      variaciones: updatedVariations,
      __billingOnly: true
    } as any);

    const notCredited = excessAmount - creditedAmount;
    setStatusMessage(
      creditedAmount > 0
        ? `✓ Se acreditaron $${creditedAmount.toFixed(2)} de saldo a favor al cliente.` +
          (notCredited > 0 ? ` Los $${notCredited.toFixed(2)} restantes no reembolsados quedan a cargo de la empresa.` : "")
        : `✓ Excedente descartado — la empresa asume los $${excessAmount.toFixed(2)}, no se acreditó saldo a favor.`
    );
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleApproveBilling = () => {
    if (!activeRes) return;

    // Approve only those requested (statusFacturacion === "Solicitado")
    const pendingServices = (activeRes.servicios || []).filter(s => s.statusFacturacion === "Solicitado");
    
    // Find joint flights
    const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (!b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === "Solicitado"));

    if (pendingServices.length === 0 && jointFlights.length === 0) return;

    const pendingTotal = pendingServices.reduce((sum, s) => sum + s.precioVenta, 0) + jointFlights.reduce((sum, b) => sum + b.precioVenta, 0);

    const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);
    const appliedSaldoFavor = (useSaldoFavor && agencyRecord) ? Math.min(pendingTotal, agencyRecord.saldoFavor) : 0;
    const remainingToPay = pendingTotal - appliedSaldoFavor;

    const isCredit = selectedFacturacionTipo === "Crédito";

    // Extra check to make sure it wasn't bypassed
    if (remainingToPay > 0 && !isCredit) {
      const receiptAmount = activeRes.comprobanteMonto || 0;
      if (receiptAmount < remainingToPay) {
        showAlert({ title: "Pago insuficiente", message: `Pago insuficiente. El comprobante adjunto ($${receiptAmount} USD) más el saldo a favor usado ($${appliedSaldoFavor} USD) no cubren el total ($${pendingTotal} USD).`, type: "danger" });
        return;
      }
    }

    const updatedServices = (activeRes.servicios || []).map(s => {
      if (s.statusFacturacion === "Solicitado") {
        return { ...s, statusFacturacion: "Facturado" as const };
      }
      return s;
    });

    const updatedRes: Reservation = {
      ...activeRes,
      servicios: updatedServices,
      facturacionRechazoMotivo: "",
      facturacionRechazoArchivos: "",
      __billingOnly: true
    } as any;
    
    if (onUpdateBoleto && jointFlights.length > 0) {
      jointFlights.forEach(jf => {
        if (jf.expedienteAereo) {
          onUpdateBoleto({
            ...jf,
            expedienteAereo: { ...jf.expedienteAereo, status: "Facturado" }
          });
        }
      });
    }

    if (activeRes.hotelName === "Boleto Aéreo GDS" && onUpdateBoleto) {
      const boletoId = activeRes.servicios?.[0]?.id;
      const boleto = boletos.find(b => b.id === boletoId);
      if (boleto && boleto.expedienteAereo) {
        onUpdateBoleto({
          ...boleto,
          expedienteAereo: { ...boleto.expedienteAereo, status: "Facturado" }
        });
      }
    }
    // Siempre persistir el estado "Facturado" de los servicios en la reserva misma
    // (antes se omitía para boletos GDS, dejando el expediente sin marcar y con
    // riesgo de reaprobación/duplicación de obligaciones si se reabría en Facturación).
    onUpdateReservation(updatedRes);

    // SIDE-EFFECT: Auto-generate Payable Obligation & Provider Statement (Libro Mayor)
    // Track IDs assigned within this same call so multiple obligations/statements created in the
    // loops below (one per provider/service) get distinct sequential IDs instead of colliding.
    const newPayIds: string[] = payableObligations.map(o => o.id);
    const newDocFacIds: string[] = providerStatements.map(s => s.id);
    const terrestrialServices = pendingServices.filter(s => s.tipo !== ServiceType.AEREO);
    const flightServices = pendingServices.filter(s => s.tipo === ServiceType.AEREO);
    
    // 1. Process terrestrial services (hotels, transfers, etc.) grouped by provider
    const matchedProp = detailedProperties.find(p => p.nombre === activeRes.hotelName);
    const defaultHotelProvider = matchedProp?.supplierName || activeRes.hotelName || "Proveedor General";

    const terrestrialByProvider = terrestrialServices.reduce((acc, s) => {
      // For accommodations: prefer s.proveedor (individual hotel) over the reservation-level hotelName
      const providerName = s.tipo === ServiceType.ALOJAMIENTO
        ? (s.proveedor || matchedProp?.supplierName || activeRes.hotelName || defaultHotelProvider)
        : (s.proveedor || defaultHotelProvider);
      if (!acc[providerName]) acc[providerName] = [];
      acc[providerName].push(s);
      return acc;
    }, {} as Record<string, typeof terrestrialServices>);

    for (const [providerName, services] of Object.entries(terrestrialByProvider)) {
      const netCost = services.reduce((sum, s) => sum + s.precioNeto, 0);
      if (netCost > 0) {
        // Build a concise service detail: tipo + short description (no passenger names)
        const serviceDetail = services.map(s => {
          if (s.tipo === ServiceType.ALOJAMIENTO) {
            return `Alojamiento ${providerName} — IN: ${activeRes.checkIn} / OUT: ${activeRes.checkOut} / ${activeRes.pax} pax`;
          }
          return `${s.tipo}: ${s.descripcion.split(" - ")[0].substring(0, 60)}`;
        }).join(" | ");
        if (onAddPayableObligation) {
          const payId = nextSequentialId("PAY", newPayIds);
          newPayIds.push(payId);
          const newObligation: PayableObligation = {
            id: payId,
            dueDate: activeRes.checkIn,
            providerName: providerName,
            serviceDetail,
            locatorId: activeRes.id,
            netCost: netCost,
            paidAmount: 0.00,
            status: "Pendiente",
            date: new Date().toISOString().split("T")[0],
            currency: "USD"
          };
          onAddPayableObligation(newObligation);
        }

        if (onAddProviderStatement) {
          const docFacId = nextSequentialId("DOC-FAC", newDocFacIds);
          newDocFacIds.push(docFacId);
          const newStatement: ProviderStatement = {
            id: docFacId,
            providerName: providerName,
            date: new Date().toISOString().split("T")[0],
            type: "Factura Recibida",
            amount: netCost,
            reference: `FAC-${activeRes.id}`,
            status: "Pendiente"
          };
          onAddProviderStatement(newStatement);
        }
      }
    }

    // 2. Process standalone flight services from activeRes.servicios (if any)
    flightServices.forEach(s => {
      if (s.precioNeto > 0) {
        const boleto = boletos.find(b => b.id === s.id);
        const flightProvider = boleto?.aerolineaValidadora || "Boleto Aéreo GDS";
        
        if (onAddPayableObligation) {
          const payId = nextSequentialId("PAY", newPayIds);
          newPayIds.push(payId);
          const newObligation: PayableObligation = {
            id: payId,
            dueDate: activeRes.checkIn,
            providerName: flightProvider,
            serviceDetail: s.descripcion,
            locatorId: activeRes.id,
            netCost: s.precioNeto,
            paidAmount: 0.00,
            status: "Pendiente",
            date: new Date().toISOString().split("T")[0],
            currency: "USD"
          };
          onAddPayableObligation(newObligation);
        }

        if (onAddProviderStatement) {
          const docFacId = nextSequentialId("DOC-FAC", newDocFacIds);
          newDocFacIds.push(docFacId);
          const newStatement: ProviderStatement = {
            id: docFacId,
            providerName: flightProvider,
            date: new Date().toISOString().split("T")[0],
            type: "Factura Recibida",
            amount: s.precioNeto,
            reference: `FAC-${activeRes.id}-${s.id}`,
            status: "Pendiente"
          };
          onAddProviderStatement(newStatement);
        }
      }
    });

    // 3. Process joint flights (linked to this reservation)
    jointFlights.forEach(vuelo => {
      const flightNetCost = vuelo.costoNeto || 0;
      if (flightNetCost > 0) {
        const flightProvider = vuelo.aerolineaValidadora || "Boleto Aéreo GDS";
        const origin = vuelo.segmentos?.[0]?.origen || "";
        const dest = vuelo.segmentos && vuelo.segmentos.length > 0 ? vuelo.segmentos[vuelo.segmentos.length-1].destino : "";
        
        if (onAddPayableObligation) {
          const payId = nextSequentialId("PAY", newPayIds);
          newPayIds.push(payId);
          const newObligation: PayableObligation = {
            id: payId,
            dueDate: activeRes.checkIn,
            providerName: flightProvider,
            serviceDetail: `Boleto Aéreo PNR: ${vuelo.pnr} (Ruta: ${origin}-${dest})`,
            locatorId: activeRes.id,
            netCost: flightNetCost,
            paidAmount: 0.00,
            status: "Pendiente",
            date: new Date().toISOString().split("T")[0],
            currency: "USD"
          };
          onAddPayableObligation(newObligation);
        }

        if (onAddProviderStatement) {
          const docFacId = nextSequentialId("DOC-FAC", newDocFacIds);
          newDocFacIds.push(docFacId);
          const newStatement: ProviderStatement = {
            id: docFacId,
            providerName: flightProvider,
            date: new Date().toISOString().split("T")[0],
            type: "Factura Recibida",
            amount: flightNetCost,
            reference: `FAC-${activeRes.id}-${vuelo.id}`,
            status: "Pendiente"
          };
          onAddProviderStatement(newStatement);
        }
      }
    });

    const invoiceStatus = isCredit ? "Facturado" : "Pagado";
    const receiptAmount = activeRes.comprobanteMonto || 0;
    const excess = (!isCredit && receiptAmount > remainingToPay) ? (receiptAmount - remainingToPay) : 0;

    const newFacIds: string[] = invoices.map(i => i.id);

    if (onAddInvoice) {
      if (appliedSaldoFavor > 0 && remainingToPay > 0) {
        // Splitting into two invoices: one paid via credit, one for the remaining amount
        const taxSaldo = computeTax(appliedSaldoFavor, activeRes, agencyRecord, overrideExempt);
        const invoicePaidId = nextSequentialId("FAC", newFacIds);
        newFacIds.push(invoicePaidId);
        const invoicePaid: FinancialInvoice = {
          id: invoicePaidId,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Aprobada - Cobro con Saldo a Favor)`,
          clientId: agencyRecord?.id,
          reservationId: activeRes.id,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: appliedSaldoFavor,
          vatAmount: taxSaldo.vatAmount,
          taxableBase: taxSaldo.taxableBase,
          surchargeAmount: taxSaldo.surchargeAmount,
          vatWithheld: taxSaldo.vatWithheld,
          incomeTaxWithheld: taxSaldo.incomeTaxWithheld,
          exchangeRate: taxSaldo.exchangeRate,
          localCurrencyAmount: taxSaldo.localCurrencyAmount,
          paymentMethod: activeRes.comprobanteMetodo,
          isExempt: overrideExempt || agencyRecord?.isInExemptZone,
          type: "Cobro",
          status: "Pagado"
        };
        onAddInvoice(invoicePaid);

        const taxRemaining = computeTax(remainingToPay, activeRes, agencyRecord, overrideExempt);
        const invoiceRemainingId = nextSequentialId("FAC", newFacIds);
        newFacIds.push(invoiceRemainingId);
        const invoiceRemaining: FinancialInvoice = {
          id: invoiceRemainingId,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Aprobada - Pago Restante)`,
          clientId: agencyRecord?.id,
          reservationId: activeRes.id,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: remainingToPay,
          vatAmount: taxRemaining.vatAmount,
          taxableBase: taxRemaining.taxableBase,
          surchargeAmount: taxRemaining.surchargeAmount,
          vatWithheld: taxRemaining.vatWithheld,
          incomeTaxWithheld: taxRemaining.incomeTaxWithheld,
          exchangeRate: taxRemaining.exchangeRate,
          localCurrencyAmount: taxRemaining.localCurrencyAmount,
          paymentMethod: activeRes.comprobanteMetodo,
          isExempt: overrideExempt || agencyRecord?.isInExemptZone,
          type: "Cobro",
          status: invoiceStatus
        };
        onAddInvoice(invoiceRemaining);
      } else {
        // Single invoice
        const taxMain = computeTax(pendingTotal, activeRes, agencyRecord, overrideExempt);
        const newInvoiceId = nextSequentialId("FAC", newFacIds);
        newFacIds.push(newInvoiceId);
        const newInvoice: FinancialInvoice = {
          id: newInvoiceId,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Serv. Terrestres${jointFlights.length > 0 ? ' y Aéreos' : ''} Aprobados)`,
          clientId: agencyRecord?.id,
          reservationId: activeRes.id,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: pendingTotal,
          vatAmount: taxMain.vatAmount,
          taxableBase: taxMain.taxableBase,
          surchargeAmount: taxMain.surchargeAmount,
          vatWithheld: taxMain.vatWithheld,
          incomeTaxWithheld: taxMain.incomeTaxWithheld,
          exchangeRate: taxMain.exchangeRate,
          localCurrencyAmount: taxMain.localCurrencyAmount,
          paymentMethod: activeRes.comprobanteMetodo,
          isExempt: overrideExempt || agencyRecord?.isInExemptZone,
          type: "Cobro",
          status: appliedSaldoFavor > 0 ? "Pagado" : invoiceStatus
        };
        onAddInvoice(newInvoice);
      }

      if (excess > 0) {
        const excessInvoice: FinancialInvoice = {
          id: nextSequentialId("ABO", invoices.map(i => i.id)),
          clientName: `Excedente de Pago (Abono a Saldo a Favor): ${activeRes.holder} - Localizador ${activeRes.id}`,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: excess,
          vatAmount: 0,
          type: "Cobro",
          status: "Pagado"
        };
        onAddInvoice(excessInvoice);
      }
    }

    // Update Client balance: deduct saldoFavor used, add debt if Credit, add excess if Contado
    if (agencyRecord && onUpdateClient) {
      let nextSaldoFavor = agencyRecord.saldoFavor;
      let nextSaldoDeber = agencyRecord.saldoDeber;

      if (appliedSaldoFavor > 0) {
        nextSaldoFavor -= appliedSaldoFavor;
      }

      if (isCredit) {
        nextSaldoDeber += remainingToPay;
      } else {
        const receiptAmount = activeRes.comprobanteMonto || 0;
        if (receiptAmount > remainingToPay) {
          const excess = receiptAmount - remainingToPay;
          nextSaldoFavor += excess;
        }
      }

      onUpdateClient({
        ...agencyRecord,
        saldoFavor: nextSaldoFavor,
        saldoDeber: nextSaldoDeber
      });
    }

    let modeMessage = "";
    if (appliedSaldoFavor > 0) {
      modeMessage += `usando $${appliedSaldoFavor.toLocaleString("es-ES")} USD de Saldo a Favor`;
    }
    if (remainingToPay > 0) {
      if (modeMessage) modeMessage += " y ";
      modeMessage += isCredit
        ? `cargando $${remainingToPay.toLocaleString("es-ES")} USD a Crédito Contra Reporte`
        : `confirmando pago de $${remainingToPay.toLocaleString("es-ES")} USD con el comprobante adjunto`;
    } else if (pendingTotal > 0 && remainingToPay === 0) {
      modeMessage = "cubierto en su totalidad con Saldo a Favor";
    }

    const isOverpaid = !isCredit && receiptAmount > remainingToPay;
    const overpaidText = isOverpaid
      ? ` Se han abonado $${(receiptAmount - remainingToPay).toLocaleString("es-ES")} USD de excedente al Saldo a Favor de la agencia.`
      : "";

    setStatusMessage(`✓ ¡Facturación aprobada con éxito (${modeMessage}) para el Expediente ${activeRes.id}! Se ha emitido la factura por $${pendingTotal.toLocaleString("es-ES")} USD.${overpaidText}`);
    setTimeout(() => setStatusMessage(""), 6000);
    setOverrideExempt(false);
  };

  const handleRejectBilling = () => {
    if (!activeRes) return;
    setShowRejectModal(true);
  };

  const confirmRejectBilling = async () => {
    if (!activeRes || !rejectReason.trim()) return;
    setIsRejecting(true);

    try {
      const pendingServices = (activeRes.servicios || []).filter(s => s.statusFacturacion === "Solicitado");
      const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador"));
      if (pendingServices.length === 0 && jointFlights.length === 0) {
        setIsRejecting(false);
        return;
      }

      // Upload files if any
      const uploadedUrls: string[] = [];
      for (const file of rejectFiles) {
        const fileRef = ref(storage, `rechazos/${activeRes.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedUrls.push(url);
      }

      const updatedServices = (activeRes.servicios || []).map(s => {
        if (s.statusFacturacion === "Solicitado") {
          return { ...s, statusFacturacion: "Rechazado" as const };
        }
        return s;
      });

      const updatedRes: Reservation = {
        ...activeRes,
        servicios: updatedServices,
        facturacionRechazoMotivo: rejectReason,
        facturacionRechazoArchivos: JSON.stringify(uploadedUrls),
        __billingOnly: true
      } as any;
      
      if (onBoletosChange && jointFlights.length > 0) {
        onBoletosChange(prev => prev.map(b => 
          jointFlights.some(jf => jf.id === b.id) && b.expedienteAereo
            ? { ...b, expedienteAereo: { ...b.expedienteAereo, status: "Borrador" as any } } 
            : b
        ));
      }

      if (activeRes.hotelName === "Boleto Aéreo GDS" && onBoletosChange) {
        const boletoId = activeRes.servicios?.[0]?.id;
        const boleto = boletos.find(b => b.id === boletoId);
        if (boleto && boleto.expedienteAereo) {
          onBoletosChange(prev => prev.map(b => b.id === boleto.id ? { ...b, expedienteAereo: { ...b.expedienteAereo!, status: "Borrador" as any } } : b));
        }
      } else {
        onUpdateReservation(updatedRes);
      }

      setStatusMessage(`⚠ Solicitud de facturación rechazada para el Expediente ${activeRes.id}.`);
      setTimeout(() => setStatusMessage(""), 5000);

      setShowRejectModal(false);
      setRejectReason("");
      setRejectFiles([]);
      setSelectedResId(null);
    } catch (e) {
      console.error(e);
      alert("Error al procesar el rechazo.");
    } finally {
      setIsRejecting(false);
    }
  };


  const handleConfirmCancellation = () => {
    if (!activeRes) return;

    const services = activeRes.servicios || [];
    const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador"));
    const billedServices = services.filter(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado");
    const billedTotal = billedServices.reduce((sum, s) => sum + s.precioVenta, 0) + jointFlights.reduce((sum, b) => sum + b.precioVenta, 0);

    // Mark all services as "Rechazado" (canceled in billing)
    const updatedServices = services.map(s => {
      if (s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") {
        return { ...s, statusFacturacion: "Rechazado" as const };
      }
      return s;
    });

    const updatedRes: Reservation = {
      ...activeRes,
      servicios: updatedServices
    };
    
    if (onBoletosChange && jointFlights.length > 0) {
      onBoletosChange(prev => prev.map(b => 
        jointFlights.some(jf => jf.id === b.id) && b.expedienteAereo
          ? { ...b, expedienteAereo: { ...b.expedienteAereo, status: "Borrador" as any } } 
          : b
      ));
    }

    if (activeRes.hotelName === "Boleto Aéreo GDS" && onBoletosChange) {
      const boletoId = activeRes.servicios?.[0]?.id;
      const boleto = boletos.find(b => b.id === boletoId);
      if (boleto && boleto.expedienteAereo) {
        onBoletosChange(prev => prev.map(b => b.id === boleto.id ? { ...b, expedienteAereo: { ...b.expedienteAereo!, status: "Borrador" as any } } : b));
      }
    } else {
      onUpdateReservation(updatedRes);
    }

    // Find invoices associated with this reservation locator (excluding ABO- abonos to avoid double refunding excesses)
    const associatedInvoices = invoices.filter(inv => 
      inv.clientName.includes(activeRes.id) && 
      inv.type === "Cobro" &&
      (inv.id.startsWith("FAC-") || inv.id.startsWith("NC-"))
    );
    
    // Sum of paid invoices
    const paidInvoicedAmount = associatedInvoices
      .filter(inv => inv.status === "Pagado")
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Sum of unpaid invoices (Facturado or Vencido)
    const unpaidInvoicedAmount = associatedInvoices
      .filter(inv => inv.status !== "Pagado")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const invoicedTotal = paidInvoicedAmount + unpaidInvoicedAmount;

    // Emit Credit Note in Financial Log for the total amount that was invoiced
    if (onAddInvoice && invoicedTotal > 0) {
      const _cancelAgency = clients.find(c => c.nombre === activeRes.agenciaName);
      const _cancelTax = computeTax(invoicedTotal, activeRes, _cancelAgency);
      const creditNote: FinancialInvoice = {
        id: nextSequentialId("NC", invoices.map(i => i.id)),
        clientName: `Anulación: ${activeRes.holder} - Localizador ${activeRes.id}`,
        clientId: _cancelAgency?.id,
        reservationId: activeRes.id,
        date: new Date().toISOString().split("T")[0],
        dueDate: activeRes.checkIn,
        amount: -invoicedTotal,
        vatAmount: -_cancelTax.vatAmount,
        taxableBase: -_cancelTax.taxableBase,
        exchangeRate: _cancelTax.exchangeRate,
        localCurrencyAmount: -_cancelTax.localCurrencyAmount,
        paymentMethod: activeRes.comprobanteMetodo,
        type: "Cobro",
        status: "Pagado"
      };
      onAddInvoice(creditNote);
    }

    // Revert Client Balances
    const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);
    if (agencyRecord && onUpdateClient) {
      let nextSaldoFavor = agencyRecord.saldoFavor;
      let nextSaldoDeber = agencyRecord.saldoDeber;

      if (paidInvoicedAmount > 0) {
        nextSaldoFavor += paidInvoicedAmount;
      }
      if (unpaidInvoicedAmount > 0) {
        nextSaldoDeber = Math.max(0, nextSaldoDeber - unpaidInvoicedAmount);
      }

      onUpdateClient({
        ...agencyRecord,
        saldoFavor: nextSaldoFavor,
        saldoDeber: nextSaldoDeber
      });
    }

    const typeMsg = paidInvoicedAmount > 0 && unpaidInvoicedAmount > 0
      ? `reintegrando $${paidInvoicedAmount.toLocaleString("es-ES")} USD a Saldo a Favor y anulando $${unpaidInvoicedAmount.toLocaleString("es-ES")} USD de Saldo Deudor`
      : paidInvoicedAmount > 0
        ? `reintegrando $${paidInvoicedAmount.toLocaleString("es-ES")} USD a Saldo a Favor`
        : `anulando $${unpaidInvoicedAmount.toLocaleString("es-ES")} USD de Saldo Deudor`;

    setStatusMessage(`✓ ¡Anulación de facturación confirmada para el Expediente ${activeRes.id}! Se ha emitido la Nota de Crédito por -$${invoicedTotal.toLocaleString("es-ES")} USD (${typeMsg}).`);
    setTimeout(() => setStatusMessage(""), 6000);

    // Go back to Level 1
    setSelectedResId(null);
  };

  // Find invoices associated with active reservation locator
  const activeInvoices = activeRes 
    ? invoices.filter(inv => inv.clientName.includes(activeRes.id))
    : [];

  return (
    <div className="space-y-6 font-sans">
      
      {!activeRes ? (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Total Facturado Acumulado</span>
                <h3 className="font-extrabold text-xl text-zinc-900 mt-1">${totalBilledVal.toLocaleString("es-ES")} USD</h3>
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Conciliado en ERP
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded">
                <FileCheck className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Solicitado en Revisión</span>
                <h3 className="font-extrabold text-xl text-amber-700 mt-1">${totalPendingVal.toLocaleString("es-ES")} USD</h3>
                <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold uppercase">
                  <Clock className="w-3.5 h-3.5 text-zinc-455" />
                  Por Aprobar o Rechazar
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded">
                <Clock className="w-5.5 h-5.5 text-amber-600 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-zinc-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Expedientes en Cola</span>
                <h3 className="font-extrabold text-xl text-zinc-900 mt-1">{pendingBillingCount} Expediente(s)</h3>
                <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold uppercase">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                  Requiere acción del dpto
                </p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 rounded">
                <FileText className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="bg-zinc-900 border border-zinc-800 text-white p-3.5 rounded text-xs flex items-center gap-2 font-semibold animate-fade-in shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Expedientes Table (Full Width) */}
          <div className="w-full bg-white border border-zinc-200 rounded p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">Cola de Revisión y Facturación</h4>
                <p className="text-xs text-zinc-450 mt-1">Inspección de contratos netos y aprobación de cobros B2B</p>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar expediente..."
                  className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-500 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Tabs
              tabs={[
                { key: "atencion", label: "Necesitan Atención", badge: queueTabCounts.atencion || undefined, badgeVariant: "alert" },
                { key: "proveedor", label: "Esperando Proveedor", badge: queueTabCounts.proveedor || undefined },
                { key: "facturadas", label: "Facturadas", badge: queueTabCounts.facturadas || undefined },
                { key: "anuladas", label: "Anuladas", badge: queueTabCounts.anuladas || undefined },
              ]}
              active={queueTab}
              onChange={(k) => setQueueTab(k as typeof queueTab)}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-zinc-200">
                <thead>
                  <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                    <th className="p-3">Localizador</th>
                    <th className="p-3">Titular / Agencia B2B</th>
                    <th className="p-3 text-center">Estado Facturación</th>
                    <th className="p-3 text-right">Monto Total</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {queueTabFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                        No se encontraron expedientes en esta pestaña.
                      </td>
                    </tr>
                  ) : (
                    queueTabFiltered.map((r) => {
                      const {
                        services, jointFlights, billedCount, requestedCount, totalCount, percent,
                        hasRequest, draftCount, pendingVariationSupplements, pendingVariationCredits,
                        hasPendingSupplement, hasPendingCreditNote, hasPendingExcessVerification,
                        isCancellationRequest
                      } = getBookingStatus(r);

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedResId(r.id)}
                          className={`hover:bg-zinc-50/50 cursor-pointer transition-colors ${isCancellationRequest ? "bg-red-50/20" : hasPendingCreditNote ? "bg-orange-50/20" : hasPendingSupplement ? "bg-blue-50/20" : hasPendingExcessVerification ? "bg-cyan-50/20" : ""}`}
                        >
                          <td className="p-3 font-mono font-bold text-zinc-900">
                            <div className="flex items-center gap-1.5">
                              <span>{r.id}</span>
                              {isCancellationRequest ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-red-655 animate-pulse" title="Anulación Solicitada" />
                              ) : hasRequest ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Aprobación Pendiente" />
                              ) : hasPendingCreditNote ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" title="Nota de crédito pendiente de emitir" />
                              ) : hasPendingSupplement ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" title="Suplemento pendiente de facturar" />
                              ) : hasPendingExcessVerification ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" title="Esperando respuesta del proveedor" />
                              ) : null}
                            </div>
                            <span className={`text-[8.5px] font-black uppercase px-1 rounded-sm mt-0.5 inline-block ${
                              r.facturacionTipo === "Crédito" 
                                ? "bg-purple-50 text-purple-750 border border-purple-200" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-250"
                            }`}>
                              {r.facturacionTipo || "Pago Contado"}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-zinc-955">
                            <div className="space-y-0.5">
                              <span>{r.holder}</span>
                              <span className="text-[10px] text-zinc-455 block font-semibold">{r.agenciaName || "Canal Directo"}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9.5px] font-extrabold text-zinc-700">
                                  {billedCount} / {totalCount} Aprobados
                                </span>
                                {isCancellationRequest ? (
                                  <span className="px-1 py-0.25 bg-red-50 text-red-700 rounded border border-red-200 text-[8px] font-black uppercase">
                                    Anulación Solicitada
                                  </span>
                                ) : hasRequest ? (
                                  <span className="px-1 py-0.25 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[8px] font-black uppercase">
                                    {requestedCount} Solicitado
                                  </span>
                                ) : hasPendingCreditNote ? (
                                  <span className="px-1 py-0.25 bg-orange-50 text-orange-700 rounded border border-orange-200 text-[8px] font-black uppercase">
                                    {pendingVariationCredits} Nota de Crédito
                                  </span>
                                ) : hasPendingSupplement ? (
                                  <span className="px-1 py-0.25 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[8px] font-black uppercase">
                                    {draftCount + pendingVariationSupplements} Suplemento
                                  </span>
                                ) : hasPendingExcessVerification ? (
                                  <span className="px-1 py-0.25 bg-cyan-50 text-cyan-700 rounded border border-cyan-200 text-[8px] font-black uppercase">
                                    Esperando Proveedor
                                  </span>
                                ) : null}
                              </div>
                              <div className="w-28 bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200">
                                <div
                                  className={`h-full rounded-full ${isCancellationRequest ? "bg-red-500" : hasRequest ? "bg-amber-500" : hasPendingCreditNote ? "bg-orange-500" : hasPendingSupplement ? "bg-blue-500" : hasPendingExcessVerification ? "bg-cyan-500" : "bg-emerald-500"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-zinc-900">${r.totalPrice.toLocaleString("es-ES")} USD</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResId(r.id);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border transition-all ${
                                isCancellationRequest
                                  ? "bg-red-700 border-red-750 hover:bg-red-800 text-white"
                                  : hasRequest
                                    ? "bg-amber-900 border-amber-900 hover:bg-amber-950 text-white"
                                    : hasPendingCreditNote
                                      ? "bg-orange-600 border-orange-600 hover:bg-orange-700 text-white"
                                      : hasPendingSupplement
                                        ? "bg-blue-700 border-blue-700 hover:bg-blue-800 text-white"
                                        : hasPendingExcessVerification
                                          ? "bg-cyan-700 border-cyan-700 hover:bg-cyan-800 text-white"
                                          : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-900 hover:text-white"
                              }`}
                            >
                              {isCancellationRequest ? "Anular" : hasRequest ? "Aprobar" : hasPendingCreditNote ? "Nota C." : hasPendingSupplement ? "Suplemento" : hasPendingExcessVerification ? "Verificar" : "Revisar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Back Button */}
          <div className="flex justify-between items-center no-print sticky top-16 bg-zinc-50/95 backdrop-blur-xs py-3 border-b border-zinc-200 z-10 -mx-8 px-8 mb-4">
            <button
              onClick={() => setSelectedResId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-zinc-200 shadow-3xs"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Volver a la Cola de Facturas</span>
            </button>
          </div>

          {/* Detailed Expediente Billing Inspector (Full Width, Centered) */}
          <div className="max-w-5xl mx-auto bg-white border border-zinc-200 rounded-lg p-6 space-y-6 shadow-xs">
            <div className="border-b border-zinc-200 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-950 text-white rounded inline-block">
                  Inspector de Facturación
                </span>
                <h4 className="font-black text-base mt-2.5 text-zinc-955 leading-tight uppercase">{activeRes.holder}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Localizador ID: {activeRes.id} | Agencia: {activeRes.agenciaName || "Directo"}</p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <button
                  onClick={() => setShowDossierModal(true)}
                  className="px-2.5 py-1 border border-zinc-300 hover:bg-zinc-50 rounded text-zinc-700 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Ver Ficha Completa del Expediente"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Ver Expediente</span>
                </button>
                
                {activeRes.servicios?.some(s => s.statusFacturacion === "Facturado") && (
                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-xs animate-fade-in"
                    title="Generar Voucher de Viaje Oficial"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Voucher PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* B2B Client Details Check */}
            {(() => {
              const matchedClientName = activeRes.agenciaName || "Canal Directo";
              const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);
              
              return (
                <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg space-y-2 text-xs font-semibold text-zinc-750">
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5 mb-1.5">
                    <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Validación de Agencia B2B</h5>
                    {agencyRecord ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-emerald-850 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Saldo Favor: ${agencyRecord.saldoFavor.toLocaleString("es-ES")} USD
                        </span>
                        <span className={`px-1.5 py-0.25 rounded text-[8.5px] font-black uppercase border ${
                          agencyRecord.moroso 
                            ? "bg-red-50 border-red-200 text-red-700 animate-pulse" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}>
                          {agencyRecord.moroso ? "Cuenta Morosa" : "Cuenta al Día"}
                        </span>
                      </div>
                    ) : (
                      <span className="px-1.5 py-0.25 bg-zinc-100 border border-zinc-200 rounded text-[8.5px] font-bold text-zinc-650">
                        Directo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="text-zinc-400 block text-[9.5px] uppercase font-bold">Canal Comercial</span>
                      <span className="text-zinc-900 font-extrabold">{matchedClientName}</span>
                    </div>
                    {agencyRecord && (
                      <>
                        <div>
                          <span className="text-zinc-400 block text-[9.5px] uppercase font-bold">Tipo de Agencia</span>
                          <span className="text-zinc-900 font-extrabold text-zinc-800">{agencyRecord.tipo}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[9.5px] uppercase font-bold">RIF Agencia</span>
                          <span className="text-zinc-900 font-mono font-bold">{agencyRecord.rif}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[9.5px] uppercase font-bold">Crédito Dispo / Límite</span>
                          <span className={`font-bold ${agencyRecord.saldoDeber > (agencyRecord.limiteCredito || 0) ? "text-red-650" : "text-zinc-900"}`}>
                            ${((agencyRecord.limiteCredito || 0) - agencyRecord.saldoDeber).toLocaleString("es-ES")} / ${(agencyRecord.limiteCredito || 0).toLocaleString("es-ES")} USD
                          </span>
                        </div>
                      </>
                    )}
                    <div className="col-span-2 border-t border-zinc-150 pt-1.5 mt-1">
                      <span className="text-zinc-450 block text-[9.5px] uppercase font-bold">Contacto Principal Pasajero (Titular)</span>
                      <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] text-zinc-800 font-mono mt-0.5">
                        <span>📞 {activeRes.telefono || "Sin registrar"}</span>
                        <span>✉ {activeRes.email || "Sin registrar"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Panel de Comprobante de Pago Adjunto */}
            {activeRes.comprobanteRef && (
              <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg space-y-2 text-xs font-semibold text-zinc-750">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5 mb-1.5">
                  <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-zinc-455" /> Comprobante de Pago Adjunto
                  </h5>
                  <span className="px-1.5 py-0.25 bg-amber-50 border border-amber-250 text-amber-700 rounded-full text-[8.5px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    Pendiente de Conciliación
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-left">
                  <div>
                    <span className="text-zinc-455 block text-[9px] uppercase font-bold">Referencia</span>
                    <span className="text-zinc-900 font-mono font-bold">{activeRes.comprobanteRef}</span>
                  </div>
                  <div>
                    <span className="text-zinc-455 block text-[9px] uppercase font-bold">Método</span>
                    <span className="text-zinc-900 font-bold">{activeRes.comprobanteMetodo}</span>
                  </div>
                  <div>
                    <span className="text-zinc-455 block text-[9px] uppercase font-bold">Monto Declarado</span>
                    <span className="text-zinc-900 font-extrabold font-mono">${activeRes.comprobanteMonto?.toLocaleString("es-ES")} USD</span>
                  </div>
                  <div>
                    <span className="text-zinc-455 block text-[9px] uppercase font-bold">Archivo Adjunto</span>
                    {activeRes.comprobanteArchivo ? (
                      <span className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                        <FileText className="w-3 h-3" /> {activeRes.comprobanteArchivo}
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-medium text-[10px]">No adjunto</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown of services */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desglose de Servicios y Estado de Cobros</h5>
              <div className="divide-y divide-zinc-150 border border-zinc-200 rounded overflow-hidden">
                {(activeRes.servicios || []).map((s) => {
                  const status = s.statusFacturacion || "Borrador";
                  return (
                    <div key={s.id} className="p-3 bg-white flex items-start justify-between gap-4">
                      <div className="space-y-0.5 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-zinc-100 border border-zinc-200 text-zinc-655">
                            {s.tipo}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">{s.id}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 leading-snug mt-1">{s.descripcion}</p>
                        <span className="text-zinc-950 text-xs font-black block mt-0.5">${s.precioVenta.toLocaleString("es-ES")} USD</span>
                        {renderServiceDetails(s)}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {status === "Facturado" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-50 border border-emerald-250 text-emerald-700 inline-flex items-center gap-1">
                            ● Aprobado
                          </span>
                        ) : status === "Solicitado" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-blue-50 border border-blue-250 text-blue-750 inline-flex items-center gap-1 animate-pulse">
                            ● Solicitado
                          </span>
                        ) : status === "Rechazado" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-red-50 border border-red-200 text-red-655 inline-flex items-center gap-1">
                            ● Rechazado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-750 inline-flex items-center gap-1">
                            ● Borrador
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto).map((vuelo) => {
                  const status = (vuelo.expedienteAereo?.status || "Borrador") as any;
                  const origin = vuelo.segmentos?.[0]?.origen || "";
                  const dest = vuelo.segmentos && vuelo.segmentos.length > 0 ? vuelo.segmentos[vuelo.segmentos.length-1].destino : "";
                  return (
                    <div key={vuelo.id} className="p-3 bg-white flex items-start justify-between gap-4 border-t border-zinc-150 bg-blue-50/10">
                      <div className="space-y-0.5 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-900 text-white">
                            AÉREO
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">PNR: {vuelo.pnr}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900 leading-snug mt-1">Boleto Aéreo GDS - Ruta: {origin}-{dest}</p>
                        <span className="text-zinc-950 text-xs font-black block mt-0.5">${vuelo.precioVenta.toLocaleString("es-ES")} USD</span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {status === "Facturado" || status === "PagadoAerolinea" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-50 border border-emerald-250 text-emerald-700 inline-flex items-center gap-1">
                            ● Aprobado
                          </span>
                        ) : status === "Solicitado" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-blue-50 border border-blue-250 text-blue-750 inline-flex items-center gap-1 animate-pulse">
                            ● Solicitado
                          </span>
                        ) : status === "Rechazado" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-red-50 border border-red-200 text-red-655 inline-flex items-center gap-1">
                            ● Rechazado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-750 inline-flex items-center gap-1">
                            ● Borrador
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel de Ajustes y Modificaciones Pendientes de Facturar */}
            {/* Los suplementos y créditos por modificación de tarifa en status "Borrador" todavía no
                fueron enviados por el operador de Reservas ("Enviar a Facturación") — permanecen
                ocultos aquí hasta entonces. Créditos por cancelación/anulación nunca tienen status,
                así que siguen visibles de inmediato como antes. */}
            {(activeRes.variaciones || []).some((v: any) => !v.invoiceId && v.status !== "Borrador") && (
              <div className="space-y-3 mt-4">
                <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                  ⚠️ Ajustes y Modificaciones Pendientes de Facturación
                </h5>
                <div className="divide-y divide-zinc-150 border border-amber-200 rounded overflow-hidden bg-amber-50/10">
                  {(activeRes.variaciones || []).filter((v: any) => !v.invoiceId && v.status !== "Borrador").map((v: any) => {
                    const isPositive = v.amountSale > 0;
                    return (
                      <div key={v.id} className="p-3 bg-white space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {v.type}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">{v.id}</span>
                          <span className="text-[9px] font-sans text-zinc-400">{v.date}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-950">{v.reason}</p>
                        <div className="flex items-center justify-between gap-3 pt-0.5">
                          <span className={`text-xs font-black ${isPositive ? "text-emerald-700" : "text-red-750"}`}>
                            {isPositive ? "+" : ""}${v.amountSale.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                          </span>
                          {isPositive ? (
                            <button
                              onClick={() => handleInvoiceVariation(v)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs flex items-center gap-1 transition-all shrink-0"
                            >
                              Facturar Suplemento
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCreditNoteVariation(v)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs flex items-center gap-1 transition-all shrink-0"
                            >
                              Emitir Nota de Crédito
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Panel de Excedentes Pendientes de Verificar con Proveedor */}
            {/* Cuando un crédito por reducción de servicio deja al cliente con un pago de más y el
                proveedor de ese servicio ya fue pagado, el excedente no se acredita automáticamente
                como saldo a favor — se deja aquí hasta que alguien confirme si el proveedor
                efectivamente reembolsará ese monto. */}
            {(activeRes.variaciones || []).some((v: any) => (v.excessPendingVerification || 0) > 0) && (
              <div className="space-y-3 mt-4">
                <h5 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                  🔎 Excedentes Pendientes de Verificar con Proveedor
                </h5>
                <div className="divide-y divide-zinc-150 border border-orange-200 rounded overflow-hidden bg-orange-50/10">
                  {(activeRes.variaciones || []).filter((v: any) => (v.excessPendingVerification || 0) > 0).map((v: any) => (
                    <div key={v.id} className="p-3 bg-white space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                          Pendiente de Verificar
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">{v.id}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-950">{v.reason}</p>
                      <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                        El cliente pagó ${v.excessPendingVerification.toFixed(2)} de más y el proveedor de este servicio ya había sido pagado.
                        Verifica con el proveedor cuánto reembolsará (puede ser total, parcial o nada) e ingresa ese monto exacto.
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-450 font-bold uppercase">Reembolsó</span>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={v.excessPendingVerification}
                            value={refundInputs[v.id] ?? v.excessPendingVerification.toFixed(2)}
                            onChange={(e) => setRefundInputs(prev => ({ ...prev, [v.id]: e.target.value }))}
                            className="w-24 px-2 py-1 border border-zinc-250 rounded text-[11px] font-mono font-bold text-right focus:outline-none focus:border-zinc-500"
                          />
                          <span className="text-[9px] text-zinc-450 font-bold">/ ${v.excessPendingVerification.toFixed(2)} USD</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolvePendingExcess(v, 0)}
                            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer border border-zinc-200 transition-all shrink-0"
                          >
                            No Reembolsó
                          </button>
                          <button
                            onClick={() => handleResolvePendingExcess(v, parseFloat(refundInputs[v.id] ?? v.excessPendingVerification.toFixed(2)) || 0)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs transition-all shrink-0"
                          >
                            Confirmar Reembolso
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Panel */}
            {(() => {
              const isCancelled = activeRes.status === "Cancelada";
              if (isCancelled) {
                const associatedInvoices = invoices.filter(inv => 
                  inv.clientName.includes(activeRes.id) && 
                  inv.type === "Cobro" &&
                  (inv.id.startsWith("FAC-") || inv.id.startsWith("NC-"))
                );
                const paidInvoicedAmount = associatedInvoices.filter(inv => inv.status === "Pagado").reduce((sum, inv) => sum + inv.amount, 0);
                const unpaidInvoicedAmount = associatedInvoices.filter(inv => inv.status !== "Pagado").reduce((sum, inv) => sum + inv.amount, 0);
                const invoicedTotal = paidInvoicedAmount + unpaidInvoicedAmount;
                const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                const hasBilledOrRequested = (activeRes.servicios || []).some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
                                             jointFlights.some(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea" || b.expedienteAereo?.status === "Solicitado");

                if (!hasBilledOrRequested) {
                  return (
                    <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-lg text-center font-sans">
                      <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center justify-center gap-1.5 font-bold uppercase text-xs">
                        <AlertCircle className="w-4 h-4 text-red-650" />
                        Expediente Anulado (Sin Facturar)
                      </div>
                      <p className="text-xs text-zinc-500 mt-2 font-medium">
                        Este expediente fue anulado antes de enviarse a facturar. No requiere acciones de facturación.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-red-50/35 border border-red-200 p-5 rounded-lg space-y-4 text-left font-sans animate-fade-in">
                    <div className="flex items-start gap-3 border-b border-red-200 pb-3">
                      <div className="p-2 bg-red-100 border border-red-200 text-red-700 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-red-955 uppercase tracking-tight">Solicitud de Anulación de Facturación</h4>
                        <p className="text-xs text-red-700 font-semibold mt-0.5">
                          El expediente fue anulado por el Dpto. de Reservas. Confirme la reversión de cargos.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-zinc-700">
                      <div className="flex justify-between">
                        <span>Total Emitido en Facturas:</span>
                        <span className="font-bold text-zinc-900">${invoicedTotal.toLocaleString("es-ES")} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Cobrado (Ya Pagado):</span>
                        <span className="font-bold text-emerald-800">${paidInvoicedAmount.toLocaleString("es-ES")} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Pendiente (A Crédito):</span>
                        <span className="font-bold text-zinc-900">${unpaidInvoicedAmount.toLocaleString("es-ES")} USD</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-red-100 rounded-lg text-xs font-medium space-y-1.5 text-left">
                      {paidInvoicedAmount > 0 && (
                        <p className="text-emerald-900 flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Se reintegrarán <strong>${paidInvoicedAmount.toLocaleString("es-ES")} USD</strong> como saldo a favor de la agencia B2B <strong>{activeRes.agenciaName || "Canal Directo"}</strong>.</span>
                        </p>
                      )}
                      {unpaidInvoicedAmount > 0 && (
                        <p className="text-zinc-700 flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                          <span>Se anulará la deuda por cobrar de <strong>${unpaidInvoicedAmount.toLocaleString("es-ES")} USD</strong> de la cuenta de la agencia B2B <strong>{activeRes.agenciaName || "Canal Directo"}</strong> (reduciendo su saldo deudor).</span>
                        </p>
                      )}
                      {invoicedTotal === 0 && (
                        <p className="text-zinc-500 italic flex items-start gap-1.5 leading-snug">
                          <Info className="w-4 h-4 text-zinc-450 flex-shrink-0 mt-0.5" />
                          <span>No existen facturas emitidas ni cobradas asociadas a este expediente.</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmCancellation}
                      className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white border border-red-700 rounded text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-300" />
                      Procesar Anulación y Reintegros
                    </button>
                  </div>
                );
              }

              const requestedServices = (activeRes.servicios || []).filter(s => s.statusFacturacion === "Solicitado");
              const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador"));
              const requestedTotal = requestedServices.reduce((sum, s) => sum + s.precioVenta, 0) + jointFlights.reduce((sum, b) => sum + b.precioVenta, 0);
              const hasRequests = requestedServices.length > 0 || jointFlights.length > 0;

              const billedServices = (activeRes.servicios || []).filter(s => s.statusFacturacion === "Facturado");
              const billedFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea"));
              
              const hasBorrador = (activeRes.servicios || []).some(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === undefined) ||
                                  boletos.some(b => b.expedienteId === activeRes.id && b.facturarConjunto && (!b.expedienteAereo || b.expedienteAereo.status === "Borrador"));
              const hasRechazados = (activeRes.servicios || []).some(s => s.statusFacturacion === "Rechazado");

              const agencyRecord = clients.find(c => c.nombre === activeRes.agenciaName);
              const hasSaldoFavor = agencyRecord && agencyRecord.saldoFavor > 0;
              const appliedSaldoFavor = (useSaldoFavor && agencyRecord) ? Math.min(requestedTotal, agencyRecord.saldoFavor) : 0;
              const remainingToPay = requestedTotal - appliedSaldoFavor;

              const isCredit = selectedFacturacionTipo === "Crédito";
              const isContado = selectedFacturacionTipo === "Pago Contado";

              let isApproveDisabled = false;
              let validationWarningElement = null;
              let infoNoticeElement = null;

              if (hasRequests && remainingToPay > 0 && isContado) {
                const receiptAmount = activeRes.comprobanteMonto || 0;
                if (receiptAmount < remainingToPay) {
                  isApproveDisabled = true;
                  validationWarningElement = (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 text-left">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-650 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-red-750">Pago Restante Insuficiente</p>
                        <p className="text-[11px] leading-snug mt-0.5">
                          El saldo neto a liquidar es de <strong>${remainingToPay.toLocaleString("es-ES")} USD</strong> (Total: ${requestedTotal.toLocaleString("es-ES")} USD
                          {appliedSaldoFavor > 0 && ` - Saldo Favor: $${appliedSaldoFavor.toLocaleString("es-ES")} USD`}).
                        </p>
                        <p className="text-[11px] leading-snug mt-1 font-medium text-red-900">
                          El comprobante adjunto es de <strong>${receiptAmount.toLocaleString("es-ES")} USD</strong>. 
                          {receiptAmount > 0 
                            ? ` Se requiere una diferencia de $${(remainingToPay - receiptAmount).toLocaleString("es-ES")} USD adicionales en un comprobante.`
                            : " Se requiere adjuntar el comprobante del pago restante para procesar la transacción de contado."
                          }
                        </p>
                      </div>
                    </div>
                  );
                } else if (receiptAmount > remainingToPay) {
                  const excess = receiptAmount - remainingToPay;
                  infoNoticeElement = (
                    <div className="bg-blue-50 border border-blue-200 text-blue-850 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 text-left">
                      <Info className="w-4.5 h-4.5 text-blue-650 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-blue-700">Excedente de Pago</p>
                        <p className="text-[11px] leading-snug mt-0.5">
                          El comprobante adjunto ($${receiptAmount.toLocaleString("es-ES")} USD) supera el neto a liquidar ($${remainingToPay.toLocaleString("es-ES")} USD).
                        </p>
                        <p className="text-[11px] leading-snug mt-1 font-medium text-blue-900">
                          Al aprobar, el saldo excedente de <strong>${excess.toLocaleString("es-ES")} USD</strong> será abonado automáticamente al Saldo a Favor de la agencia.
                        </p>
                      </div>
                    </div>
                  );
                }
              }

              return (
                <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-lg space-y-4">
                  {hasRequests && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-200/60 pb-3">
                      <div className="space-y-0.5 text-left">
                        <span className="text-zinc-505 uppercase text-[9px] font-bold block">Método de Facturación</span>
                        <span className="text-[10px] text-zinc-400 font-medium leading-none">
                          Solicitado por Reservas: {activeRes.facturacionTipo || "Pago Contado"}
                        </span>
                      </div>
                      <select
                        value={selectedFacturacionTipo}
                        onChange={(e) => setSelectedFacturacionTipo(e.target.value as "Crédito" | "Pago Contado")}
                        className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 font-bold focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        <option value="Pago Contado">Pago Contado (Factura Pagada)</option>
                        <option value="Crédito">A Crédito (Factura Contra Reporte)</option>
                      </select>
                    </div>
                  )}

                  {hasRequests && agencyRecord && agencyRecord.saldoFavor > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-lg flex flex-col gap-1 text-left">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useSaldoFavor}
                          onChange={(e) => setUseSaldoFavor(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-emerald-900 block">Aplicar Saldo a Favor de la Agencia</span>
                          <span className="text-[10.5px] text-emerald-700 font-semibold leading-tight block mt-0.5">
                            Disponible: <span className="font-extrabold">${agencyRecord.saldoFavor.toLocaleString("es-ES")} USD</span>. 
                            {useSaldoFavor && (
                              <span> Se debitarán <span className="font-black text-emerald-850">${appliedSaldoFavor.toLocaleString("es-ES")} USD</span>.</span>
                            )}
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  {hasRequests && useSaldoFavor && (
                    <div className="space-y-1 text-xs font-semibold text-zinc-500 border-b border-zinc-200/50 pb-2 text-left">
                      <div className="flex justify-between">
                        <span>Importe Solicitado:</span>
                        <span className="text-zinc-900">${requestedTotal.toLocaleString("es-ES")} USD</span>
                      </div>
                      <div className="flex justify-between text-emerald-750 font-bold">
                        <span>Debitar de Saldo a Favor:</span>
                        <span>-${appliedSaldoFavor.toLocaleString("es-ES")} USD</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-500 uppercase text-[9px] font-bold">
                      {useSaldoFavor ? "Monto Neto a Liquidar:" : "Importe por Facturación Solicitada:"}
                    </span>
                    <span className={`font-black text-base ${hasRequests ? "text-amber-700" : "text-zinc-500"}`}>
                      ${remainingToPay.toLocaleString("es-ES")} USD
                    </span>
                  </div>

                  {/* Alertas y Notificaciones */}
                  {validationWarningElement}
                  {infoNoticeElement}

                  {hasRequests && (
                    <label className="flex items-center gap-2.5 cursor-pointer select-none px-3 py-2 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={overrideExempt}
                        onChange={e => setOverrideExempt(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 accent-zinc-800 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">Facturar sin {activeJurisdiction.taxName}</span>
                        <span className="text-[10px] text-zinc-500">Cliente exento — no genera crédito fiscal</span>
                      </div>
                    </label>
                  )}

                  {hasRequests ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleRejectBilling}
                        className="py-2.5 border border-zinc-250 hover:bg-zinc-100 text-red-700 bg-white text-[11px] font-black uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all animate-fade-in"
                      >
                        <ThumbsDown className="w-4 h-4 text-red-650" />
                        Rechazar
                      </button>
                      <button 
                        onClick={handleApproveBilling}
                        disabled={isApproveDisabled}
                        className={`py-2.5 text-white text-[11px] font-black uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                          isApproveDisabled 
                            ? "bg-zinc-200 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60" 
                            : "bg-zinc-950 hover:bg-zinc-800"
                        }`}
                      >
                        {selectedFacturacionTipo === "Pago Contado" ? (
                          <>
                            <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            Confirmar Pago & Aprobar
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-purple-400" />
                            Facturar a Crédito
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs font-bold uppercase rounded leading-relaxed">
                      {hasBorrador ? (
                        <div className="text-amber-700 bg-amber-50/50 border border-amber-250 p-2.5 rounded flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Esperando envío desde Reservas
                        </div>
                      ) : hasRechazados ? (
                        <div className="text-red-700 bg-red-50 border border-red-200 p-2.5 rounded flex items-center justify-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          Solicitudes Rechazadas por el Dpto.
                        </div>
                      ) : (
                        <div className="text-emerald-700 bg-emerald-50 border border-emerald-250 p-2.5 rounded flex items-center justify-center gap-1.5">
                          <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                          Aprobado y Facturado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Invoices Generated Log */}
            {activeInvoices.length > 0 && (
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Comprobantes de Cobro Emitidos</h5>
                <div className="space-y-1.5 font-mono">
                  {activeInvoices.map((inv) => (
                    <div 
                      key={inv.id} 
                      onClick={() => setSelectedInvoiceForModal(inv)}
                      className="p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-150 rounded text-[10px] flex items-center justify-between cursor-pointer transition-colors"
                      title="Ver / Imprimir Factura Comercial"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-800">
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-bold underline text-blue-600">{inv.id}</span>
                        <span className="text-zinc-400">({inv.date})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-zinc-900">${inv.amount.toLocaleString("es-ES")} USD</span>
                        <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold uppercase border ${
                          inv.status === "Pagado" ? "bg-emerald-50 border-emerald-250 text-emerald-700" : "bg-amber-50 border-amber-250 text-amber-700"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DETALLE DE EXPEDIENTE INTERNO */}
      {showDossierModal && activeRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between no-print">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Info className="w-4.5 h-4.5 text-zinc-400" /> Ficha Técnica del Expediente (Interno)
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                  Información consolidada de pax, agencia B2B y estado de cobros.
                </p>
              </div>
              <button 
                onClick={() => setShowDossierModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="printable-dossier-doc">
              {/* Document Header */}
              <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-4 mb-6">
                <div>
                  <h2 className="font-black text-lg text-zinc-955 leading-none font-sans uppercase">{companyConfig.name}</h2>
                  <span className="text-[8px] uppercase tracking-widest font-black text-zinc-400 block mt-1 font-sans">{companyConfig.subtitle}</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 bg-zinc-900 text-white rounded text-[9px] font-black uppercase tracking-wider font-mono">
                    EXPEDIENTE: {activeRes.id}
                  </span>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">Generado: {new Date().toISOString().split("T")[0]}</p>
                </div>
              </div>

              {/* Dossier info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Pax lead */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-1.5">
                  <h5 className="text-[10px] font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5 font-sans">
                    <User className="w-3.5 h-3.5 text-zinc-450" /> Pasajero Principal (Titular)
                  </h5>
                  <p className="text-sm font-black text-zinc-950 font-sans uppercase">{activeRes.holder}</p>
                  <p className="text-xs text-zinc-650 font-mono">📞 {activeRes.telefono || "Sin registrar"}</p>
                  <p className="text-xs text-zinc-650 font-mono">✉ {activeRes.email || "Sin registrar"}</p>
                  <div className="pt-1.5 border-t border-zinc-200 text-[10px] font-bold text-zinc-400 flex justify-between font-sans uppercase">
                    <span>Pax totales:</span>
                    <span className="font-extrabold text-zinc-800 font-mono">{activeRes.pax}</span>
                  </div>
                </div>

                {/* Agency info */}
                {(() => {
                  const agency = clients.find(c => c.nombre === activeRes.agenciaName);
                  return (
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-1.5">
                      <h5 className="text-[10px] font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5 font-sans">
                        <Building className="w-3.5 h-3.5 text-zinc-450" /> Información de Agencia B2B
                      </h5>
                      <p className="text-sm font-black text-zinc-950 truncate font-sans">{activeRes.agenciaName || "Canal Directo"}</p>
                      {agency ? (
                        <>
                          <p className="text-xs text-zinc-650 font-semibold font-sans">Tipo: <span className="font-extrabold text-zinc-800">{agency.tipo}</span></p>
                          <p className="text-xs text-zinc-650 font-mono">RIF: {agency.rif}</p>
                          <div className="pt-1.5 border-t border-zinc-200 text-[10px] font-bold text-zinc-400 flex justify-between font-sans uppercase">
                            <span>Estado Cuenta:</span>
                            <span className={`font-black ${agency.moroso ? "text-red-650" : "text-emerald-700"}`}>
                              {agency.moroso ? "🔴 Moroso" : "🟢 Al Día"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-zinc-400 italic font-sans">Venta directa sin intermediario B2B.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Dates & Status */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-1.5">
                  <h5 className="text-[10px] font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-zinc-450" /> Cronograma de Viaje
                  </h5>
                  <div className="text-xs font-semibold text-zinc-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-sans">Check-In:</span>
                      <span className="font-mono">{activeRes.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-sans">Check-Out:</span>
                      <span className="font-mono">{activeRes.checkOut}</span>
                    </div>
                    {activeRes.flightNo && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-sans">Vuelo Reg:</span>
                        <span className="font-mono font-bold text-zinc-700">{activeRes.flightNo}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-1.5 border-t border-zinc-200 text-[10px] font-bold text-zinc-400 flex justify-between items-center font-sans uppercase">
                    <span>Estatus:</span>
                    <span className="font-black text-[9.5px] text-zinc-900">{activeRes.status}</span>
                  </div>
                </div>
              </div>

              {/* Services breakdown table */}
              <div className="space-y-3 mb-6">
                <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider font-sans">Desglose Técnico de Servicios y Margen</h5>
                <div className="border border-zinc-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-200">
                        <th className="p-3">Servicio ID</th>
                        <th className="p-3">Detalle / Descripción</th>
                        <th className="p-3 text-right">Neto Costo</th>
                        <th className="p-3 text-right">Venta B2B</th>
                        <th className="p-3 text-right">Margen Neto</th>
                        <th className="p-3 text-center">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 font-medium">
                      {(activeRes.servicios || []).map((s) => {
                        const margin = s.precioVenta - s.precioNeto;
                        return (
                          <tr key={s.id} className="hover:bg-zinc-50/50">
                            <td className="p-3 font-mono font-bold text-zinc-900">{s.id}</td>
                            <td className="p-3">
                              <div className="space-y-0.5 text-left">
                                <div className="flex items-center">
                                  <span className="px-1.5 py-0.25 bg-zinc-100 text-zinc-650 text-[8px] font-black border border-zinc-200 rounded mr-2 uppercase">
                                    {s.tipo}
                                  </span>
                                  <span className="font-bold text-zinc-900">{s.descripcion}</span>
                                </div>
                                {renderDossierServiceDetailsPrint(s, activeRes)}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono text-zinc-500">${s.precioNeto.toLocaleString("es-ES")} USD</td>
                            <td className="p-3 text-right font-mono text-zinc-900 font-bold">${s.precioVenta.toLocaleString("es-ES")} USD</td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-extrabold">+${margin.toLocaleString("es-ES")} USD</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                                s.statusFacturacion === "Facturado" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : s.statusFacturacion === "Solicitado"
                                  ? "bg-blue-50 text-blue-750 border border-blue-200 animate-pulse"
                                  : s.statusFacturacion === "Rechazado"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {s.statusFacturacion || "Borrador"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(() => {
                        const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                        return jointFlights.map((vuelo) => {
                          const margin = vuelo.precioVenta - vuelo.costoNeto;
                          return (
                            <tr key={vuelo.id} className="hover:bg-zinc-50/50 bg-blue-50/10">
                              <td className="p-3 font-mono font-bold text-zinc-900">{vuelo.id}</td>
                              <td className="p-3">
                                <div className="space-y-0.5 text-left">
                                  <div className="flex items-center">
                                    <span className="px-1.5 py-0.25 bg-blue-100 text-blue-700 text-[8px] font-black border border-blue-200 rounded mr-2 uppercase">
                                      Aéreo GDS
                                    </span>
                                    <span className="font-bold text-zinc-900">Itinerario Vuelo - PNR: {vuelo.pnr}</span>
                                  </div>
                                  <div className="mt-2 text-[10px] text-zinc-605 bg-white p-2 rounded border border-zinc-200 space-y-1 text-left font-sans shadow-2xs">
                                    {(vuelo.segmentos?.map ? vuelo.segmentos : []).map((seg, i) => (
                                      <div key={i} className="flex gap-2 font-mono">
                                        <span className="font-bold text-zinc-800">{seg.origen} → {seg.destino}</span>
                                        <span>({seg.aerolinea}{seg.numeroVuelo})</span>
                                        <span className="text-zinc-400 ml-auto">{formatGDSDate(seg.fecha)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-zinc-500">${vuelo.costoNeto.toLocaleString("es-ES")} USD</td>
                              <td className="p-3 text-right font-mono text-zinc-900 font-bold">${vuelo.precioVenta.toLocaleString("es-ES")} USD</td>
                              <td className="p-3 text-right font-mono text-emerald-700 font-extrabold">+${margin.toLocaleString("es-ES")} USD</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                                  vuelo.expedienteAereo?.status === "Facturado" || vuelo.expedienteAereo?.status === "PagadoAerolinea"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-blue-50 text-blue-750 border border-blue-200 animate-pulse"
                                }`}>
                                  {vuelo.expedienteAereo?.status === "Facturado" || vuelo.expedienteAereo?.status === "PagadoAerolinea" ? "Facturado" : "Por Facturar"}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Requests */}
              {activeRes.specialRequests && (
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-1.5 mb-6">
                  <h5 className="text-[10px] font-black uppercase text-zinc-455 tracking-wider font-sans">Notas y Requerimientos Especiales</h5>
                  <p className="text-xs text-zinc-700 leading-relaxed font-semibold italic">{activeRes.specialRequests}</p>
                </div>
              )}

              {/* Total Summary */}
              <div className="border-t border-zinc-200 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs font-semibold text-zinc-700">
                  <div className="flex justify-between">
                    <span>Total Costo Proveedores:</span>
                    <span className="font-mono text-zinc-900">${activeRes.netPrice.toLocaleString("es-ES")} USD</span>
                  </div>
                  <div className="flex justify-between text-zinc-950 font-black text-sm pt-1.5 border-t border-zinc-200">
                    <span>Total Expediente B2B:</span>
                    <span>${activeRes.totalPrice.toLocaleString("es-ES")} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-end gap-2.5 no-print">
              <button
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VOUCHER DE VIAJE OFICIAL */}
      {showVoucherModal && activeRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between no-print">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Printer className="w-4.5 h-4.5 text-zinc-400" /> Voucher de Servicios de Viaje
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                  Documento de viaje oficial para el pasajero (sin precios ni márgenes expuestos).
                </p>
              </div>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="printable-voucher-doc">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-zinc-900 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center font-black text-base font-sans">
                      {companyConfig.logoLetter}
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans uppercase">{companyConfig.name}</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">{companyConfig.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    {companyConfig.tagline || companyConfig.subtitle}
                  </p>
                </div>
                
                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5 font-sans">
                  <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-250 text-emerald-800 rounded text-[9px] font-black uppercase tracking-wider">
                    VOUCHER DE SERVICIOS
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900">LOCALIZADOR: {activeRes.id}</span>
                </div>
              </div>

              {/* Paid Stamp */}
              <div className="border border-emerald-250 bg-emerald-50/40 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase text-emerald-800 font-sans">Estado: SERVICIOS CONCILIADOS Y CONFIRMADOS</h4>
                  <p className="text-[10.5px] text-zinc-650 leading-relaxed font-semibold font-sans">
                    Este documento acredita que los servicios listados a continuación están totalmente pagados al proveedor y garantizados por Foratour ERP. Presente este voucher al proveedor del servicio al iniciar su viaje.
                  </p>
                </div>
                <div className="flex-shrink-0 w-24 h-24 border-4 border-emerald-600/40 rounded-full flex flex-col items-center justify-center text-center rotate-12 font-sans select-none">
                  <span className="text-[9px] font-black uppercase text-emerald-600/60 leading-none">FORATOUR</span>
                  <span className="text-sm font-black text-emerald-600 uppercase tracking-widest mt-1">CONFIRMADO</span>
                  <span className="text-[8px] font-mono text-emerald-500 mt-0.5 leading-none">OK</span>
                </div>
              </div>

              {/* Pax lead and travel info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 border-b border-zinc-200 pb-6">
                <div className="space-y-1.5">
                  <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider font-sans">Titular de la Reserva</h5>
                  <p className="text-sm font-black text-zinc-950 leading-tight uppercase font-sans">{activeRes.holder}</p>
                  <div className="text-xs text-zinc-650 font-semibold space-y-0.5">
                    <p className="font-mono">📱 Contacto Tel: {activeRes.telefono || "Sin registrar"}</p>
                    <p className="font-mono">✉ Contacto Email: {activeRes.email || "Sin registrar"}</p>
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:text-right font-sans">
                  <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Detalles de Operación</h5>
                  <p className="text-xs font-semibold text-zinc-850">
                    Fecha de Ingreso: <span className="font-bold text-zinc-950 font-mono">{activeRes.checkIn}</span>
                  </p>
                  <p className="text-xs font-semibold text-zinc-850">
                    Fecha de Salida: <span className="font-bold text-zinc-950 font-mono">{activeRes.checkOut}</span>
                  </p>
                  <p className="text-xs font-semibold text-zinc-850">
                    Total Pasajeros: <span className="font-bold text-zinc-950">{activeRes.pax} Pax</span>
                  </p>
                  {activeRes.flightNo && (
                    <p className="text-xs font-semibold text-zinc-850">
                      Vuelo de Conexión: <span className="font-bold font-mono text-zinc-900">{activeRes.flightNo}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Vuelos Conjuntos Facturados */}
              {(() => {
                const vuelosFacturados = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea"));
                if (vuelosFacturados.length === 0) return null;
                
                return (
                  <div className="space-y-4 mb-6">
                    <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Itinerario de Vuelo Aéreo</h5>
                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                      {vuelosFacturados.map((vuelo) => (
                        <div key={vuelo.id} className="p-4 bg-white space-y-3 break-inside-avoid print:break-inside-avoid">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                              BOLETO AÉREO GDS
                            </span>
                            <span className="text-[9px] font-mono text-zinc-455 font-semibold">PNR: {vuelo.pnr}</span>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            {(vuelo.segmentos?.map ? vuelo.segmentos : []).map((seg, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs">
                                <span className="font-mono font-bold text-zinc-400 text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                                <span className="font-bold text-zinc-800 font-mono">{seg.aerolinea}{seg.numeroVuelo}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-950">{seg.origen}</span>
                                  <span className="text-zinc-300">→</span>
                                  <span className="font-bold text-zinc-950">{seg.destino}</span>
                                </div>
                                <span className="ml-auto text-zinc-600 font-medium">
                                  {formatGDSDate(seg.fecha)} · Salida: {seg.horaSalida}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-[10.5px] text-zinc-650 font-semibold space-y-1 font-sans mt-3">
                            <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block">Instrucciones de Embarque</span>
                            <p>Preséntese en el mostrador de la aerolínea 3 horas antes de la salida programada del vuelo para el check-in internacional, o 2 horas antes para vuelos domésticos. El equipaje permitido dependerá de la política de la clase {vuelo.segmentos[0]?.clase || "Y"}.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Services List (Only Billed) */}
              <div className="space-y-4 mb-6">
                <h5 className="text-[9.5px] font-black text-zinc-450 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Servicios Confirmados</h5>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                  {activeRes.servicios?.filter(s => s.statusFacturacion === "Facturado").map((s) => (
                    <div key={s.id} className="p-4 bg-white space-y-2 break-inside-avoid print:break-inside-avoid">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                          {s.tipo}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-450 font-semibold">Cód. Servicio: {s.id}</span>
                      </div>
                      
                      <div className="text-xs text-zinc-900">
                        <p className="font-extrabold text-sm text-zinc-955 leading-snug font-sans">{s.descripcion}</p>
                      </div>

                      {/* Pax instructions based on service type */}
                      <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-[10.5px] text-zinc-650 font-semibold space-y-1 font-sans">
                        <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block">Instrucciones para el Viajero</span>
                        {s.tipo === ServiceType.ALOJAMIENTO && (
                          <p>Presente este voucher impreso o digital al momento del Check-in en la recepción del hotel. El alojamiento incluye desayuno e impuestos locales, salvo tasas municipales de pago directo en destino si las hubiere.</p>
                        )}
                        {s.tipo === ServiceType.TRASLADO && (
                          <p>Al llegar, el conductor le estará esperando en el hall de salidas con un cartel indicando su nombre. El tiempo de espera máximo es de 60 minutos tras el aterrizaje del vuelo registrado.</p>
                        )}
                        {s.tipo === ServiceType.SEGURO && (
                          <p>En caso de requerir asistencia médica o urgencias durante el viaje, comuníquese de inmediato al número de emergencia del proveedor internacional impreso en su póliza adjunta.</p>
                        )}
                        {s.tipo === ServiceType.RENT_A_CAR && (
                          <p>Deberá presentar licencia de conducir vigente, pasaporte e tarjeta de crédito a nombre del conductor principal como garantía para el retiro del vehículo.</p>
                        )}
                        {s.tipo === ServiceType.MANUAL && (
                          <p>Por favor contacte al operador receptivo local o siga las indicaciones adjuntas en sus notas de confirmación de itinerario de viaje.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests if present */}
              {activeRes.specialRequests && (
                <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-4 mb-6 space-y-1 font-sans">
                  <h5 className="text-[9px] font-black text-zinc-450 uppercase tracking-wider">Notas de Coordinación / Requerimientos</h5>
                  <p className="text-xs text-zinc-800 leading-relaxed font-semibold italic">{activeRes.specialRequests}</p>
                </div>
              )}

              {/* Legal disclaimer */}
              <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 font-medium space-y-1 font-sans">
                <p>Este voucher sirve como constancia oficial de servicios. {companyConfig.name} actúa como intermediario en la prestación de estos servicios y no se hace responsable por retrasos, cancelaciones fortuitas o modificaciones imputables directamente a los proveedores de servicio final.</p>
                <p>{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address} | Email: {companyConfig.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-end gap-2.5 no-print font-sans">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Voucher (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDossierModal && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              visibility: hidden !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-dossier-doc, #printable-dossier-doc * {
              visibility: visible !important;
            }
            #printable-dossier-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            aside, header, footer, .no-print, button, .modal-backdrop, .print-modal-container button {
              display: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            html, body, #root, .min-h-screen, .fixed:not(.print-modal-container) {
              position: static !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .print-modal-container {
              position: static !important;
              display: block !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              z-index: 99999 !important;
            }
            .print-modal-content {
              background: none !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
            }
          }
        `}} />
      )}

      {showVoucherModal && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              visibility: hidden !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-voucher-doc, #printable-voucher-doc * {
              visibility: visible !important;
            }
            #printable-voucher-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            aside, header, footer, .no-print, button, .modal-backdrop, .print-modal-container button {
              display: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            html, body, #root, .min-h-screen, .fixed:not(.print-modal-container) {
              position: static !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .print-modal-container {
              position: static !important;
              display: block !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              z-index: 99999 !important;
            }
            .print-modal-content {
              background: none !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
            }
          }
        `}} />
      )}

      {/* COMMERCIAL INVOICE PREVIEW MODAL */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-lg shadow-2xl w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in relative border border-zinc-200 print-modal-container">
            
            {/* Modal Header Controls (hidden in print) */}
            <div className="bg-zinc-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10 no-print rounded-t-lg">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider font-sans">
                  Imprimir / Descargar Factura Comercial
                </h3>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Container */}
            <div id="printable-invoice-doc" className="p-10 bg-white text-zinc-900 font-sans print-modal-content">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-zinc-955 text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0 print:border print:border-zinc-950">
                      {companyConfig.logoLetter}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-zinc-955 uppercase leading-none">{companyConfig.name}</h1>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{companyConfig.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-650 mt-3 space-y-0.5">
                    <p><span className="font-bold text-zinc-700">RIF:</span> {companyConfig.rif}</p>
                    <p>{companyConfig.address}</p>
                    <p>Tel: {companyConfig.phone} | Email: {companyConfig.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-sm">
                    FACTURA COMERCIAL
                  </span>
                  <h2 className="text-xl font-mono font-black text-zinc-950 mt-2">{selectedInvoiceForModal.id}</h2>
                  <div className="text-xs text-zinc-650 mt-3 space-y-1">
                    <p><span className="font-bold text-zinc-700">Fecha Emisión:</span> {formatDate(selectedInvoiceForModal.date)}</p>
                    <p><span className="font-bold text-zinc-700">Vencimiento:</span> {formatDate(selectedInvoiceForModal.dueDate)}</p>
                    <p>
                      <span className="font-bold text-zinc-700">Estado Pago:</span>{" "}
                      <span className={`font-bold uppercase ${selectedInvoiceForModal.status === "Pagado" ? "text-emerald-600" : "text-amber-600"}`}>
                        {selectedInvoiceForModal.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice Customer Info */}
              <div className="grid grid-cols-2 gap-6 bg-zinc-50 border border-zinc-200 rounded-lg p-5 mb-6 text-xs">
                <div>
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-2">FACTURADO A (CLIENTE B2B)</h4>
                  <p className="font-black text-sm text-zinc-900 uppercase">
                    {activeRes?.agenciaName || "Cliente Directo"}
                  </p>
                  <p className="text-zinc-600 mt-1 font-semibold">
                    RIF: {clients.find(c => activeRes?.agenciaName && c.nombre.toLowerCase() === activeRes.agenciaName.toLowerCase())?.rif || "N/A"}
                  </p>
                  <p className="text-zinc-500 mt-0.5">
                    Canal: B2B Mayorista
                  </p>
                </div>
                <div>
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-2">DETALLES DE RESERVA</h4>
                  {activeRes && (
                    <div className="space-y-1">
                      <p><span className="font-bold text-zinc-700">Pasajero Titular:</span> <span className="uppercase font-semibold text-zinc-800">{activeRes.holder}</span></p>
                      <p><span className="font-bold text-zinc-700">Localizador ID:</span> <span className="font-mono font-bold text-zinc-800">{activeRes.id}</span></p>
                      <p><span className="font-bold text-zinc-700">Fecha de Viaje:</span> {formatDate(activeRes.checkIn)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="mb-6">
                {(() => {
                  const inv = selectedInvoiceForModal;
                  const isExemptInv = inv.isExempt || inv.vatAmount === 0;
                  const taxLabel = isExemptInv
                    ? `${activeJurisdiction.taxName} (Exento)`
                    : `${activeJurisdiction.taxName} ${(activeJurisdiction.taxRate * 100).toFixed(0)}%`;
                  const subtotal = isExemptInv ? inv.amount : (inv.taxableBase ?? inv.amount - inv.vatAmount);
                  return (
                    <table className="w-full text-left text-xs divide-y divide-zinc-200 border border-zinc-200">
                      <thead>
                        <tr className="bg-zinc-950 text-white font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Concepto / Descripción</th>
                          <th className="p-3 text-right w-24">Subtotal (USD)</th>
                          <th className="p-3 text-right w-24">{taxLabel} (USD)</th>
                          <th className="p-3 text-right w-24">Total (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 font-medium text-zinc-800">
                        <tr>
                          <td className="p-3.5">
                            <p className="font-bold text-zinc-950 uppercase">
                              {inv.clientName.split("(")[1]?.replace(")", "") || "Facturación de Servicios Turísticos Receptivos"}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              Servicios asociados al expediente de reserva para el pasajero titular {activeRes?.holder || "registrado en sistema"}.
                            </p>
                            {isExemptInv && (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                                Operación Exenta de {activeJurisdiction.taxName}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono">
                            ${subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3.5 text-right font-mono ${isExemptInv ? "text-emerald-700 font-bold" : "text-zinc-650"}`}>
                            {isExemptInv ? "Exento" : `$${inv.vatAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-zinc-950">
                            ${inv.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Booking Services Breakdown for customer context */}
              {activeRes && activeRes.servicios && activeRes.servicios.length > 0 && (
                <div className="mb-8 border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                    Servicios Consolidados en el Expediente (RES-{(activeRes.id).substring(4)})
                  </h4>
                  <div className="divide-y divide-zinc-200/60 text-[10px] space-y-2">
                    {activeRes.servicios.map((srv, idx) => (
                      <div key={srv.id || idx} className="pt-2 first:pt-0 flex justify-between items-start">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 bg-zinc-200 text-zinc-800 font-bold rounded-sm uppercase tracking-wide text-[8px] mr-2">
                            {srv.tipo}
                          </span>
                          <span className="font-bold text-zinc-900">{srv.proveedor}</span>
                          <p className="text-zinc-500 mt-0.5">{srv.descripcion}</p>
                        </div>
                        <span className="font-mono text-zinc-800 font-bold">
                          ${srv.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Notes */}
              <div className="border-t border-zinc-300 pt-6 text-[9.5px] text-zinc-455 leading-relaxed font-sans space-y-1.5">
                <p className="font-bold text-zinc-500">Condiciones de Facturación y Pago:</p>
                <p>1. Esta factura comercial representa transacciones comerciales asociadas a la reserva de servicios turísticos descrita.</p>
                <p>2. Todos los pagos deben ser realizados en la cuenta oficial de {companyConfig.name} antes de la fecha de vencimiento indicada para garantizar los bloqueos de servicios con proveedores locales.</p>
                <p>3. Modificaciones de servicios posteriores a la emisión de esta factura pueden acarrear cargos adicionales o penalidades del operador final.</p>
                <p className="text-center font-bold pt-4 text-zinc-400">{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address}</p>
              </div>

            </div>

            {/* Modal Footer Actions (hidden in print) */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex justify-end gap-2.5 no-print font-sans">
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4.5 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintInvoice}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir / Descargar PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}
      
      {showRejectModal && activeRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-lg shadow-2xl w-[90%] max-w-md p-6 animate-fade-in relative border border-zinc-200">
            <button 
              onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectFiles([]); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 text-red-650 mb-4">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">Rechazar Facturación</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Motivo del Rechazo <span className="text-red-500">*</span>
                </label>
                <textarea 
                  className="w-full text-sm border border-zinc-200 rounded p-2.5 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none min-h-[100px] resize-y"
                  placeholder="Explica claramente por qué se rechaza esta facturación..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Adjuntar Archivos / Imágenes (Opcional)
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files) {
                      setRejectFiles(Array.from(e.target.files));
                    }
                  }}
                  className="block w-full text-xs text-zinc-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-xs file:font-semibold
                    file:bg-zinc-100 file:text-zinc-700
                    hover:file:bg-zinc-200 cursor-pointer"
                />
                {rejectFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rejectFiles.map((f, i) => (
                      <li key={i} className="text-[10px] text-zinc-600 font-medium flex items-center gap-1.5">
                        <FileCheck className="w-3 h-3 text-emerald-500" />
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectFiles([]); }}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                disabled={isRejecting}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRejectBilling}
                disabled={!rejectReason.trim() || isRejecting}
                className="px-4 py-2 text-xs font-black text-white bg-red-650 hover:bg-red-700 rounded shadow transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isRejecting ? "Procesando..." : (
                  <>
                    <ThumbsDown className="w-4 h-4" />
                    Confirmar Rechazo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

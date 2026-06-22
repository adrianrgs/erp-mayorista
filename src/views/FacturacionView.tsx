import React, { useState } from "react";
import { Reservation, FinancialInvoice, ServiceItem, B2BClient, ServiceType, PayableObligation, ProviderStatement } from "../types";
import { RoomType, RatePlan, Property, TipoCobro } from "../types/producto";
import type { FlightTicket } from "../types/aereos";
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

interface FacturacionViewProps {
  reservations: Reservation[];
  invoices: FinancialInvoice[];
  onUpdateReservation: (updated: Reservation) => void;
  onAddInvoice?: (newInv: FinancialInvoice) => void;
  clients: B2BClient[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
  onUpdateClient?: (updated: B2BClient) => void;
  onAddPayableObligation?: (obligation: PayableObligation) => void;
  onAddProviderStatement?: (statement: ProviderStatement) => void;
  boletos?: FlightTicket[];
  onBoletosChange?: React.Dispatch<React.SetStateAction<FlightTicket[]>>;
}

export default function FacturacionView({ 
  reservations, 
  invoices, 
  onUpdateReservation,
  onAddInvoice,
  clients,
  roomTypes,
  ratePlans,
  detailedProperties,
  onUpdateClient,
  onAddPayableObligation,
  onAddProviderStatement,
  boletos = [],
  onBoletosChange
}: FacturacionViewProps) {
  const [search, setSearch] = useState("");
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  
  const [selectedFacturacionTipo, setSelectedFacturacionTipo] = useState<"Crédito" | "Pago Contado">("Pago Contado");
  const [useSaldoFavor, setUseSaldoFavor] = useState(false);

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

  // Only manage actual bookings that have been sent to billing (i.e. has at least one service with Solicitado, Facturado, or Rechazado status)
  const realBookings = allBookings.filter(r => {
    const isReal = r.tipo === "Reserva Real" || r.tipo === undefined;
    if (!isReal) return false;
    const services = r.servicios || [];
    return services.some(s => s.statusFacturacion === "Solicitado" || s.statusFacturacion === "Facturado" || s.statusFacturacion === "Rechazado");
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
    const aNeedsCancel = (a.status === "Cancelada" && a.servicios?.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado")) ? 1 : 0;
    const bNeedsCancel = (b.status === "Cancelada" && b.servicios?.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado")) ? 1 : 0;
    if (aNeedsCancel !== bNeedsCancel) {
      return bNeedsCancel - aNeedsCancel;
    }

    const aHasReq = a.servicios?.some(s => s.statusFacturacion === "Solicitado") ? 1 : 0;
    const bHasReq = b.servicios?.some(s => s.statusFacturacion === "Solicitado") ? 1 : 0;
    return bHasReq - aHasReq;
  });

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
    const hasPendingServices = r.servicios?.some(s => s.statusFacturacion === "Solicitado");
    const isPendingCancellation = r.status === "Cancelada" && r.servicios?.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado");
    return hasPendingServices || isPendingCancellation;
  }).length;

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
        alert(`Pago insuficiente. El comprobante adjunto ($${receiptAmount} USD) más el saldo a favor usado ($${appliedSaldoFavor} USD) no cubren el total ($${pendingTotal} USD).`);
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
      servicios: updatedServices
    };
    
    if (onBoletosChange && jointFlights.length > 0) {
      onBoletosChange(prev => prev.map(b => 
        jointFlights.some(jf => jf.id === b.id) && b.expedienteAereo
          ? { ...b, expedienteAereo: { ...b.expedienteAereo, status: "Facturado" } } 
          : b
      ));
    }

    if (activeRes.hotelName === "Boleto Aéreo GDS" && onBoletosChange) {
      const boletoId = activeRes.servicios?.[0]?.id;
      const boleto = boletos.find(b => b.id === boletoId);
      if (boleto && boleto.expedienteAereo) {
        onBoletosChange(prev => prev.map(b => b.id === boleto.id ? { ...b, expedienteAereo: { ...b.expedienteAereo!, status: "Facturado" } } : b));
      }
    } else {
      onUpdateReservation(updatedRes);
    }

    // SIDE-EFFECT: Auto-generate Payable Obligation & Provider Statement (Libro Mayor)
    const terrestrialServices = pendingServices.filter(s => s.tipo !== ServiceType.AEREO);
    const flightServices = pendingServices.filter(s => s.tipo === ServiceType.AEREO);
    
    // 1. Process terrestrial services (hotels, transfers, etc.)
    const terrestrialNetCost = terrestrialServices.reduce((sum, s) => sum + s.precioNeto, 0);
    if (terrestrialNetCost > 0) {
      const matchedProp = detailedProperties.find(p => p.nombre === activeRes.hotelName);
      const providerName = matchedProp?.supplierName || activeRes.hotelName || "Proveedor General";
      
      if (onAddPayableObligation) {
        const newObligation: PayableObligation = {
          id: `PAY-${Math.floor(5000 + Math.random() * 4999)}`,
          dueDate: activeRes.checkIn,
          providerName: providerName,
          serviceDetail: terrestrialServices.map(s => s.descripcion).join(", "),
          locatorId: activeRes.id,
          netCost: terrestrialNetCost,
          paidAmount: 0.00,
          status: "Pendiente",
          date: new Date().toISOString().split("T")[0],
          currency: "USD"
        };
        onAddPayableObligation(newObligation);
      }

      if (onAddProviderStatement) {
        const newStatement: ProviderStatement = {
          id: `DOC-FAC-${Math.floor(3000 + Math.random() * 6999)}`,
          providerName: providerName,
          date: new Date().toISOString().split("T")[0],
          type: "Factura Recibida",
          amount: terrestrialNetCost,
          reference: `FAC-${activeRes.id}`,
          status: "Pendiente"
        };
        onAddProviderStatement(newStatement);
      }
    }

    // 2. Process standalone flight services from activeRes.servicios (if any)
    flightServices.forEach(s => {
      if (s.precioNeto > 0) {
        const boleto = boletos.find(b => b.id === s.id);
        const flightProvider = boleto?.aerolineaValidadora || "Boleto Aéreo GDS";
        
        if (onAddPayableObligation) {
          const newObligation: PayableObligation = {
            id: `PAY-${Math.floor(5000 + Math.random() * 4999)}`,
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
          const newStatement: ProviderStatement = {
            id: `DOC-FAC-${Math.floor(3000 + Math.random() * 6999)}`,
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
          const newObligation: PayableObligation = {
            id: `PAY-${Math.floor(5000 + Math.random() * 4999)}`,
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
          const newStatement: ProviderStatement = {
            id: `DOC-FAC-${Math.floor(3000 + Math.random() * 6999)}`,
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

    if (onAddInvoice) {
      if (appliedSaldoFavor > 0 && remainingToPay > 0) {
        // Splitting into two invoices: one paid via credit, one for the remaining amount
        const invoicePaid: FinancialInvoice = {
          id: `FAC-${Math.floor(5200 + Math.random() * 800)}`,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Aprobada - Cobro con Saldo a Favor)`,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: appliedSaldoFavor,
          vatAmount: Math.round(appliedSaldoFavor * 0.16),
          type: "Cobro",
          status: "Pagado"
        };
        onAddInvoice(invoicePaid);

        const invoiceRemaining: FinancialInvoice = {
          id: `FAC-${Math.floor(5200 + Math.random() * 800)}`,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Aprobada - Pago Restante)`,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: remainingToPay,
          vatAmount: Math.round(remainingToPay * 0.16),
          type: "Cobro",
          status: invoiceStatus
        };
        onAddInvoice(invoiceRemaining);
      } else {
        // Single invoice as before
        const newInvoice: FinancialInvoice = {
          id: `FAC-${Math.floor(5200 + Math.random() * 800)}`,
          clientName: `${activeRes.holder} - Localizador ${activeRes.id} (Facturación Serv. Terrestres${jointFlights.length > 0 ? ' y Aéreos' : ''} Aprobados)`,
          date: new Date().toISOString().split("T")[0],
          dueDate: activeRes.checkIn,
          amount: pendingTotal,
          vatAmount: Math.round(pendingTotal * 0.16),
          type: "Cobro",
          status: appliedSaldoFavor > 0 ? "Pagado" : invoiceStatus
        };
        onAddInvoice(newInvoice);
      }

      if (excess > 0) {
        const excessInvoice: FinancialInvoice = {
          id: `ABO-${Math.floor(7000 + Math.random() * 999)}`,
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

    // Go back to Level 1
    setSelectedResId(null);
  };

  const handleRejectBilling = () => {
    if (!activeRes) return;

    const pendingServices = (activeRes.servicios || []).filter(s => s.statusFacturacion === "Solicitado");
    const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador"));
    if (pendingServices.length === 0 && jointFlights.length === 0) return;

    const updatedServices = (activeRes.servicios || []).map(s => {
      if (s.statusFacturacion === "Solicitado") {
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

    setStatusMessage(`⚠ Solicitud de facturación rechazada para el Expediente ${activeRes.id}. Se ha devuelto al Dpto. de Reservas para su revisión.`);
    setTimeout(() => setStatusMessage(""), 5000);

    // Go back to Level 1
    setSelectedResId(null);
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
      const creditNote: FinancialInvoice = {
        id: `NC-${Math.floor(8000 + Math.random() * 999)}`,
        clientName: `Anulación: ${activeRes.holder} - Localizador ${activeRes.id}`,
        date: new Date().toISOString().split("T")[0],
        dueDate: activeRes.checkIn,
        amount: -invoicedTotal,
        vatAmount: -Math.round(invoicedTotal * 0.16),
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
    <div className="space-y-6 h-[calc(100vh-12rem)] overflow-y-auto pr-2 font-sans">
      
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
                  {sortedAndFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                        No se encontraron expedientes en la cola.
                      </td>
                    </tr>
                  ) : (
                    sortedAndFiltered.map((r) => {
                      const services = r.servicios || [];
                      const jointFlights = boletos.filter(b => b.expedienteId === r.id && b.facturarConjunto);
                      const billedCount = services.filter(s => s.statusFacturacion === "Facturado").length +
                                         jointFlights.filter(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea").length;
                      const requestedCount = services.filter(s => s.statusFacturacion === "Solicitado").length +
                                            jointFlights.filter(b => b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador").length;
                      const totalCount = services.length + jointFlights.length;
                      const percent = totalCount > 0 ? Math.round((billedCount / totalCount) * 100) : 100;
                      const hasRequest = requestedCount > 0 || jointFlights.some(b => b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador");
                      const isCancellationRequest = r.status === "Cancelada" && (
                        services.some(s => s.statusFacturacion === "Facturado" || s.statusFacturacion === "Solicitado") ||
                        jointFlights.some(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "Solicitado" || b.expedienteAereo?.status === "Borrador")
                      );

                      return (
                        <tr 
                          key={r.id} 
                          onClick={() => setSelectedResId(r.id)}
                          className={`hover:bg-zinc-50/50 cursor-pointer transition-colors ${isCancellationRequest ? "bg-red-50/20" : ""}`}
                        >
                          <td className="p-3 font-mono font-bold text-zinc-900">
                            <div className="flex items-center gap-1.5">
                              <span>{r.id}</span>
                              {isCancellationRequest ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-red-655 animate-pulse" title="Anulación Solicitada" />
                              ) : hasRequest ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Aprobación Pendiente" />
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
                                ) : null}
                              </div>
                              <div className="w-28 bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200">
                                <div 
                                  className={`h-full rounded-full ${isCancellationRequest ? "bg-red-500" : hasRequest ? "bg-amber-500" : "bg-emerald-500"}`} 
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
                                    : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-900 hover:text-white"
                              }`}
                            >
                              {isCancellationRequest ? "Anular" : hasRequest ? "Aprobar" : "Revisar"}
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
          <div className="flex justify-between items-center no-print">
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
                <div className="grid grid-cols-3 gap-2 text-left">
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
                      className="w-full py-2.5 bg-red-750 hover:bg-red-800 text-white border border-red-750 rounded text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
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
                    <div key={inv.id} className="p-2 bg-zinc-50 border border-zinc-150 rounded text-[10px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-800">
                        <FileText className="w-3.5 h-3.5 text-zinc-455" />
                        <span>{inv.id}</span>
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
                  <h2 className="font-black text-lg text-zinc-955 leading-none font-sans">FORATOUR ERP</h2>
                  <span className="text-[8px] uppercase tracking-widest font-black text-zinc-400 block mt-1 font-sans">LOGÍSTICA MAYORISTA</span>
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
                                    {vuelo.segmentos.map((seg, i) => (
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
                      F
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans">FORATOUR ERP</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">Wholesale Logistics</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    Consolidador Mayorista de Servicios Terrestres
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
                        <div key={vuelo.id} className="p-4 bg-white space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                              BOLETO AÉREO GDS
                            </span>
                            <span className="text-[9px] font-mono text-zinc-455 font-semibold">PNR: {vuelo.pnr}</span>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            {vuelo.segmentos.map((seg, i) => (
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
                    <div key={s.id} className="p-4 bg-white space-y-2">
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
                <p>Este voucher sirve como constancia oficial de servicios. Foratour opera como consolidador mayorista y no se hace responsable por retrasos, cancelaciones fortuitas o modificaciones imputables directamente a los proveedores de servicio final.</p>
                <p>Foratour S.A. | RIF: J-30495810-9 | Caracas, Venezuela | Email: operaciones@foratour-erp.com</p>
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
      
    </div>
  );
}

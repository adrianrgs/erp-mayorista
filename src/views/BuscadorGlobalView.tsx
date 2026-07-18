import React, { useState, useMemo } from "react";
import { Search, Plane, Building2, Calendar, FileText, CheckCircle2, AlertTriangle, X, DollarSign, ExternalLink, CalendarDays, Users } from "lucide-react";
import type { Reservation, FinancialInvoice, PayableObligation } from "../types";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";
import type { FlightTicket } from "../types/aereos";
import { ProjectView } from "../types";

interface BuscadorProps {
  reservations: Reservation[];
  boletos: FlightTicket[];
  invoices: FinancialInvoice[];
  payableObligations: PayableObligation[];
  onNavigate: (view: ProjectView) => void;
}

export default function BuscadorGlobalView({
  reservations,
  boletos,
  invoices,
  payableObligations,
  onNavigate
}: BuscadorProps) {
  const [activeTab, setActiveTab] = useState<"reservas" | "vuelos">("reservas");
  
  // Reservas Search State
  const [reservaId, setReservaId] = useState("");
  const [reservaTitular, setReservaTitular] = useState("");
  const [reservaHotel, setReservaHotel] = useState("");
  const [reservaCheckIn, setReservaCheckIn] = useState("");

  // Vuelos Search State
  const [vueloPnr, setVueloPnr] = useState("");
  const [vueloPax, setVueloPax] = useState("");
  const [vueloAerolinea, setVueloAerolinea] = useState("");
  const [vueloFecha, setVueloFecha] = useState("");

  const [selectedItem, setSelectedItem] = useState<{ type: "reserva", data: Reservation } | { type: "vuelo", data: FlightTicket } | null>(null);

  const clearFilters = () => {
    if (activeTab === "reservas") {
      setReservaId("");
      setReservaTitular("");
      setReservaHotel("");
      setReservaCheckIn("");
    } else {
      setVueloPnr("");
      setVueloPax("");
      setVueloAerolinea("");
      setVueloFecha("");
    }
  };

  const getClientPaymentStatus = (locatorId: string) => {
    const resInvoices = invoices.filter(inv => inv.clientName.includes(locatorId) && inv.type === "Cobro");
    if (resInvoices.length === 0) return { status: "Sin Facturar", color: "text-zinc-500 bg-zinc-50" };
    const allPaid = resInvoices.every(inv => inv.status === "Pagado");
    const anyPaid = resInvoices.some(inv => inv.status === "Pagado");
    if (allPaid) return { status: "Cobrado", color: "text-emerald-700 bg-emerald-50" };
    if (anyPaid) return { status: "Cobro Parcial", color: "text-blue-700 bg-blue-50" };
    return { status: "Pendiente Cobro", color: "text-amber-700 bg-amber-50" };
  };

  const getProviderPaymentStatus = (locatorId: string) => {
    const obligation = payableObligations.find(o => o.locatorId === locatorId);
    if (!obligation) return { status: "No Emitido", color: "text-zinc-500 bg-zinc-50" };
    if (obligation.status === "Pagado Total") return { status: "Pagado", color: "text-emerald-700 bg-emerald-50" };
    if (obligation.status === "Pagado Parcial") return { status: "Abono Parcial", color: "text-blue-700 bg-blue-50" };
    if (obligation.status === "Vencido") return { status: "Vencido", color: "text-red-700 bg-red-50 animate-pulse" };
    return { status: "Pendiente Pago", color: "text-amber-700 bg-amber-50" };
  };

  const filteredReservas = useMemo(() => {
    return reservations.filter(r => {
      const matchId = reservaId ? r.id.toLowerCase().includes(reservaId.toLowerCase()) : true;
      const matchTitular = reservaTitular ? r.holder.toLowerCase().includes(reservaTitular.toLowerCase()) : true;
      const matchHotel = reservaHotel ? r.hotelName.toLowerCase().includes(reservaHotel.toLowerCase()) : true;
      const matchDate = reservaCheckIn ? r.checkIn === reservaCheckIn : true;
      return matchId && matchTitular && matchHotel && matchDate;
    }).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [reservations, reservaId, reservaTitular, reservaHotel, reservaCheckIn]);

  const filteredVuelos = useMemo(() => {
    return boletos.filter(b => {
      const matchPnr = vueloPnr ? b.pnr.toLowerCase().includes(vueloPnr.toLowerCase()) : true;
      const matchPax = vueloPax ? b.pasajeros.some(p => p.nombre.toLowerCase().includes(vueloPax.toLowerCase())) : true;
      const matchAero = vueloAerolinea ? b.segmentos.some(s => s.aerolinea.toLowerCase().includes(vueloAerolinea.toLowerCase())) : true;
      const matchDate = vueloFecha ? b.segmentos.some(s => s.fecha === vueloFecha) : true;
      return matchPnr && matchPax && matchAero && matchDate;
    }).sort((a, b) => {
      const dateA = a.segmentos[0]?.fecha || "";
      const dateB = b.segmentos[0]?.fecha || "";
      return dateA.localeCompare(dateB);
    });
  }, [boletos, vueloPnr, vueloPax, vueloAerolinea, vueloFecha]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
            <Search className="w-5 h-5" /> Buscador Global
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Control de tráfico, fechas de llegada y estatus financiero unificado.</p>
        </div>
        
        <div className="flex bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("reservas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === "reservas" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Building2 className="w-4 h-4" /> Reservas Terrestres
          </button>
          <button
            onClick={() => setActiveTab("vuelos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === "vuelos" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Plane className="w-4 h-4" /> Boletos Aéreos
          </button>
        </div>
      </div>

      <div className="bg-white p-5 border border-zinc-200 rounded-lg shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" /> Búsqueda Avanzada de {activeTab === "reservas" ? "Reservas" : "Vuelos"}
          </h3>
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>

        {activeTab === "reservas" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fecha de Check-In</label>
              <input
                type="date"
                value={reservaCheckIn}
                onChange={(e) => setReservaCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 bg-zinc-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hotel / Alojamiento</label>
              <input
                type="text"
                placeholder="Ej. Hotel Paraíso"
                value={reservaHotel}
                onChange={(e) => setReservaHotel(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Titular de Reserva</label>
              <input
                type="text"
                placeholder="Nombre del pasajero"
                value={reservaTitular}
                onChange={(e) => setReservaTitular(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Localizador (ID)</label>
              <input
                type="text"
                placeholder="Ej. RES-1234"
                value={reservaId}
                onChange={(e) => setReservaId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fecha de Vuelo</label>
              <input
                type="text"
                placeholder="DDMMM (Ej: 25JUN)"
                value={vueloFecha}
                onChange={(e) => setVueloFecha(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 bg-zinc-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aerolínea (Código)</label>
              <input
                type="text"
                placeholder="Ej. AA, CM, IB"
                value={vueloAerolinea}
                onChange={(e) => setVueloAerolinea(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pasajero</label>
              <input
                type="text"
                placeholder="Nombre / Apellido"
                value={vueloPax}
                onChange={(e) => setVueloPax(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Código PNR</label>
              <input
                type="text"
                placeholder="Ej. X7B9M2"
                value={vueloPnr}
                onChange={(e) => setVueloPnr(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === "reservas" && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Fecha / ID</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Titular</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Hotel / Servicio</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Cobro (Agencia)</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Pago (Proveedor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-sm">No se encontraron reservas con esos filtros.</td>
                </tr>
              ) : (
                filteredReservas.map(res => {
                  const cobro = getClientPaymentStatus(res.id);
                  const pago = getProviderPaymentStatus(res.id);
                  return (
                    <tr key={res.id} onClick={() => setSelectedItem({ type: "reserva", data: res })} className="hover:bg-zinc-50 transition-colors cursor-pointer group">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-zinc-400"/> {res.checkIn}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{res.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-zinc-900 uppercase">{res.holder}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3"/> {res.pax} Pax</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-zinc-800">{res.hotelName}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[150px]">{res.agenciaName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${cobro.color}`}>{cobro.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${pago.color}`}>{pago.status}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "vuelos" && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Fecha / PNR</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Pasajeros</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Ruta</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Cobro (Agencia)</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-zinc-500 tracking-wider">Estatus Vuelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredVuelos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-sm">No se encontraron vuelos con esos filtros.</td>
                </tr>
              ) : (
                filteredVuelos.map(bol => {
                  const cobro = getClientPaymentStatus(bol.pnr);
                  return (
                    <tr key={bol.id} onClick={() => setSelectedItem({ type: "vuelo", data: bol })} className="hover:bg-zinc-50 transition-colors cursor-pointer group">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-zinc-400"/> {bol.segmentos[0]?.fecha || "Sin fecha"}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5 text-indigo-600 font-bold">{bol.pnr}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-zinc-900 uppercase">{(bol.pasajeros?.map ? bol.pasajeros : [])[0]?.nombre || "Desconocido"} {((bol.pasajeros?.map ? bol.pasajeros : []).length > 1) ? `+${(bol.pasajeros?.map ? bol.pasajeros : []).length - 1}` : ""}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3"/> {(bol.pasajeros?.map ? bol.pasajeros : []).length} Pax</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-zinc-800">{(bol.segmentos?.map ? bol.segmentos : [])[0]?.origen || "---"} → {(bol.segmentos?.map ? bol.segmentos : [])[(bol.segmentos?.map ? bol.segmentos : []).length - 1]?.destino || "---"}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{(bol.segmentos?.map ? bol.segmentos : [])[0]?.aerolinea} {(bol.segmentos?.map ? bol.segmentos : [])[0]?.numeroVuelo}</div>
                      </td>
                      <td className="px-4 py-3">
                        {bol.facturarConjunto ? (
                           <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">En Reserva</span>
                        ) : (
                           <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${cobro.color}`}>{cobro.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${bol.expedienteAereo?.status === "Anulado" ? "bg-red-50 text-red-600 border border-red-200" : "bg-zinc-50 text-zinc-600 border border-zinc-200"}`}>
                          {bol.expedienteAereo?.status || "Borrador"}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedItem.type === "reserva" ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {selectedItem.type === "reserva" ? <Building2 className="w-5 h-5"/> : <Plane className="w-5 h-5"/>}
                </div>
                <div>
                  <h3 className="font-black text-lg text-zinc-900 uppercase">
                    Vista Rápida: {selectedItem.type === "reserva" ? selectedItem.data.id : (selectedItem.data as FlightTicket).pnr}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Resumen Ejecutivo</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer text-zinc-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedItem.type === "reserva" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Titular</span>
                      <p className="font-bold text-zinc-900 text-sm uppercase">{selectedItem.data.holder}</p>
                      <p className="text-xs text-zinc-500">{selectedItem.data.pax} Pasajeros</p>
                    </div>
                    <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Servicio Principal</span>
                      <p className="font-bold text-zinc-900 text-sm">{selectedItem.data.hotelName}</p>
                      <p className="text-xs text-zinc-500">{selectedItem.data.checkIn} a {selectedItem.data.checkOut}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-zinc-900 tracking-wider">Estatus Financiero</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col">
                         <span className="text-[10px] text-zinc-500 uppercase font-bold">Venta Total</span>
                         <span className="text-lg font-black text-zinc-900">{formatCurrency(selectedItem.data.totalPrice, getOperatingCurrency())}</span>
                         <span className={`mt-1 inline-block px-2 py-0.5 rounded w-max text-[10px] font-bold uppercase ${getClientPaymentStatus(selectedItem.data.id).color}`}>
                           COBRO: {getClientPaymentStatus(selectedItem.data.id).status}
                         </span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] text-zinc-500 uppercase font-bold">Costo Neto</span>
                         <span className="text-lg font-black text-zinc-900">{formatCurrency(selectedItem.data.netPrice, getOperatingCurrency())}</span>
                         <span className={`mt-1 inline-block px-2 py-0.5 rounded w-max text-[10px] font-bold uppercase ${getProviderPaymentStatus(selectedItem.data.id).color}`}>
                           PAGO: {getProviderPaymentStatus(selectedItem.data.id).status}
                         </span>
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Pasajero Principal</span>
                      <p className="font-bold text-zinc-900 text-sm uppercase">{(Array.isArray((selectedItem.data as FlightTicket).pasajeros) ? (selectedItem.data as FlightTicket).pasajeros : [])[0]?.nombre}</p>
                      <p className="text-xs text-zinc-500">{(Array.isArray((selectedItem.data as FlightTicket).pasajeros) ? (selectedItem.data as FlightTicket).pasajeros : []).length} Pasajeros</p>
                    </div>
                    <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Ruta</span>
                      <p className="font-bold text-zinc-900 text-sm">{(selectedItem.data as FlightTicket).segmentos[0]?.origen} → {(selectedItem.data as FlightTicket).segmentos[(selectedItem.data as FlightTicket).segmentos.length-1]?.destino}</p>
                      <p className="text-xs text-zinc-500">{(selectedItem.data as FlightTicket).segmentos[0]?.fecha}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-zinc-900 tracking-wider">Estatus del Expediente</h4>
                    <div className="flex flex-col p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <span className="text-lg font-black text-zinc-900">{(selectedItem.data as FlightTicket).expedienteAereo?.status || "Borrador"}</span>
                      {(selectedItem.data as FlightTicket).facturarConjunto && (
                         <span className="text-xs text-amber-600 font-bold mt-1">Este vuelo está anclado a una reserva terrestre y se factura conjuntamente.</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-white flex justify-end">
               <button
                 onClick={() => {
                   setSelectedItem(null);
                   onNavigate(selectedItem.type === "reserva" ? ProjectView.RESERVAS : ProjectView.VUELOS);
                 }}
                 className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
               >
                 Revisar Expediente Completo <ExternalLink className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

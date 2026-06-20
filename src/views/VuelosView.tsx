import React, { useState } from "react";
import { FlightLeg } from "../types";
import { 
  Plane, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Users
} from "lucide-react";

interface VuelosViewProps {
  flights: FlightLeg[];
}

export default function VuelosView({ flights }: VuelosViewProps) {
  const [selectedFlight, setSelectedFlight] = useState<FlightLeg>(flights[0] || null);
  const [search, setSearch] = useState("");
  const [filterAirline, setFilterAirline] = useState("Todas");

  const airlines = ["Todas", "American Airlines", "Delta Air Lines", "Iberia", "Air France", "Lufthansa"];

  const filtered = flights.filter((f) => {
    const matchesSearch = f.flightNo.toLowerCase().includes(search.toLowerCase()) || 
                          f.departure.toLowerCase().includes(search.toLowerCase()) ||
                          f.arrival.toLowerCase().includes(search.toLowerCase());
    const matchesAirline = filterAirline === "Todas" || f.airline === filterAirline;
    return matchesSearch && matchesAirline;
  });

  const getStatusColor = (status: FlightLeg["status"]) => {
    switch (status) {
      case "En Hora":
        return "bg-zinc-50 text-zinc-900 border-zinc-200 font-bold";
      case "Aterrizado":
        return "bg-zinc-100 text-zinc-600 border-zinc-200 font-medium";
      case "Retrasado":
        return "bg-zinc-50 text-zinc-700 border-zinc-300 font-semibold";
      default:
        return "bg-zinc-50 text-zinc-500 border-zinc-200 font-medium";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] overflow-hidden font-sans">
      
      {/* Panel Izquierdo: Itinerarios Aéreos */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded border border-zinc-200 shadow-xs overflow-hidden">
        
        {/* Filtros */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Plane className="w-4.5 h-4.5 text-zinc-600" />
              Bloqueos Aéreos (Cupos GDS)
            </h3>
            <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-mono border border-zinc-200">
              FIT REGULAR
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              id="flight-search-input"
              type="text"
              placeholder="Buscar por vuelo, origen o destino..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-500 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-2 px-1">
            <span className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" /> Aerolínea:
            </span>
            <select
              id="flight-airline-filter"
              value={filterAirline}
              onChange={(e) => setFilterAirline(e.target.value)}
              className="border-none bg-transparent font-bold text-zinc-800 focus:ring-0 cursor-pointer text-xs"
            >
              {airlines.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listado de vuelos */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Ninguna ruta aérea contratada coincide.
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedFlight?.id === item.id;
              return (
                <div
                  id={`flight-card-${item.id}`}
                  key={item.id}
                  onClick={() => setSelectedFlight(item)}
                  className={`p-4 transition-all cursor-pointer ${
                    isSelected ? "bg-zinc-50 border-l-2 border-zinc-900" : "hover:bg-zinc-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-zinc-100 rounded text-zinc-700 border border-zinc-200">
                        {item.flightNo}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{item.airline}</span>
                    </div>
                    <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 uppercase">
                      <span>{item.departure}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.arrival}</span>
                    </p>
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-805">{item.depTime}</p>
                      <p className="text-[9px] text-zinc-450 mt-0.5 font-medium">Asientos: {item.seatsRemaining}/{item.seatsTotal}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel Derecho: Cupos Mayoristas & Detalles */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded border border-zinc-200 shadow-xs overflow-hidden">
        {selectedFlight ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Cabecera / Detalle */}
            <div className="p-6 bg-zinc-50/60 border-b border-zinc-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded">
                  {selectedFlight.airline}
                </span>
                <span className={`text-[10px] uppercase tracking-wider px-3 py-1 border font-bold rounded-full ${getStatusColor(selectedFlight.status)}`}>
                  Vuelo {selectedFlight.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2 mt-2">
                <Plane className="w-5 h-5 text-zinc-600" />
                Operación GDS: Vuelo {selectedFlight.flightNo}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Itinerario Gráfico */}
              <div className="border border-zinc-200 rounded p-5 bg-zinc-50/45">
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-4">Información de Tramo Aéreo</h4>
                <div className="flex items-center justify-between relative">
                  
                  {/* Línea divisoria */}
                  <div className="absolute left-1/4 right-1/4 top-1/2 h-[1px] border-b border-dashed border-zinc-300 z-0"></div>

                  <div className="z-10 bg-white p-3.5 rounded border border-zinc-200 w-1/3">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Origen</span>
                    <span className="font-bold text-[#0b1c30] text-sm block uppercase tracking-wide">{selectedFlight.departure}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Salida: {selectedFlight.depTime} hrs</span>
                  </div>

                  <div className="z-10 flex flex-col items-center">
                    <Plane className="w-5 h-5 text-zinc-400" />
                    <span className="text-[9px] text-zinc-500 font-bold mt-1 uppercase tracking-wider">Terminal {selectedFlight.terminal}</span>
                  </div>

                  <div className="z-10 bg-white p-3.5 rounded border border-zinc-200 w-1/3 text-right">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Llegada</span>
                    <span className="font-bold text-[#0b1c30] text-sm block uppercase tracking-wide">{selectedFlight.arrival}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Arribo: {selectedFlight.arrTime} hrs</span>
                  </div>
                </div>
              </div>

              {/* Inventario de Cupos Mayoristas */}
              <div>
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Bloqueo de Asientos para Foratour ERP</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 border border-zinc-205 rounded flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-450" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Asientos Disponibles (Free)</p>
                      <h4 className="font-bold text-zinc-850 text-sm mt-0.5">{selectedFlight.seatsRemaining} asientos</h4>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-205 rounded flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Capacidad Total Reservada</p>
                      <h4 className="font-bold text-zinc-850 text-sm mt-0.5">{selectedFlight.seatsTotal} asientos</h4>
                    </div>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mt-5 pt-1">
                  <div className="flex justify-between text-[11px] text-zinc-450 mb-1.5 font-bold uppercase tracking-wider">
                    <span>Ocupación de Bloqueo</span>
                    <span>{Math.round(((selectedFlight.seatsTotal - selectedFlight.seatsRemaining) / selectedFlight.seatsTotal) * 100)}% ocupado</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded overflow-hidden border border-zinc-200/50">
                    <div 
                      className="h-full bg-zinc-900 rounded-sm transition-all duration-500" 
                      style={{ width: `${((selectedFlight.seatsTotal - selectedFlight.seatsRemaining) / selectedFlight.seatsTotal) * 105}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Información Técnica del Tipo de Tarifa */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded flex gap-3">
                <Clock className="w-4 h-4 text-zinc-705 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-bold text-zinc-900 tracking-wider uppercase">Carga de Tarifas Regulares e Incrementos comerciales</h5>
                  <p className="text-xs text-zinc-655 mt-1 leading-relaxed font-medium">
                    Las tarifas de estos tramos aéreos se sincronizan automáticamente con Amadeus GDS. Toda cotización realizada desde el módulo de reservas computa un factor de ajuste del <strong>5% del neto regulado</strong> para gastos de handling y emisión de tickets automáticos.
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-450 text-xs flex-1 flex flex-col items-center justify-center font-medium">
            Selecciona un vuelo para supervisar cupos y capacidades.
          </div>
        )}
      </div>

    </div>
  );
}

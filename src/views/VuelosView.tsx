import React, { useState, useCallback } from "react";
import {
  Plane,
  Search,
  Plus,
  ChevronLeft,
  Ticket,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Trash2,
  Edit3,
  Link2,
  Unlink,
  DollarSign,
  Hash,
  CalendarDays,
  FileText,
  Building,
  CreditCard,
  Send,
  Save,
  X,
  Download,
  Info,
  Printer,
  XCircle
} from "lucide-react";
import type { FlightLeg, B2BClient, CompanyConfig } from "../types";
import type { FlightTicket, Passenger, FlightSegment } from "../types/aereos";
import { parseGDS, buildRoute, formatGDSDate, SAMPLE_GDS_TEXT } from "../lib/parsers/pnrParser";
import { useDialog } from "../components/ui/DialogProvider";

// ─── TIPOS Y UTILIDADES LOCALES ────────────────────────────────────────────────────────────

const AIRLINES_MAP: Record<string, string> = {
  "CM": "Copa Airlines",
  "9V": "Avior Airlines",
  "B6": "JetBlue",
  "AA": "American Airlines",
  "5U": "Rutaca",
  "QL": "Laser Airlines",
  "V0": "Conviasa",
  "P1": "Sky High",
  "DO": "Sky High",
  "VH": "Aeropostal",
  "R7": "Aserca",
  "J4": "BBA",
  "AW": "Venezolana",
  "VCC": "Venezolana",
  "AF": "Air France",
  "IB": "Iberia",
  "UX": "Air Europa",
  "PU": "Plus Ultra",
  "LA": "LATAM Airlines",
  "AV": "Avianca",
  "P5": "Wingo",
  "VT": "Turpial Airlines",
  "T9": "Turpial Airlines",
  "ROI": "Rutaca",
  "NK": "Spirit Airlines",
  "UA": "United Airlines",
  "DL": "Delta Air Lines",
  "TK": "Turkish Airlines",
  "TP": "TAP Air Portugal",
  "AR": "Aerolíneas Argentinas",
  "AM": "Aeroméxico",
};

function getAirlineName(code: string): string {
  if (!code) return "";
  return AIRLINES_MAP[code.toUpperCase()] || code;
}

interface VuelosViewProps {
  flights: FlightLeg[]; // prop legacy del App.tsx
  boletos: FlightTicket[];
  onAddBoleto: (boleto: FlightTicket) => void;
  onUpdateBoleto: (boleto: FlightTicket) => void;
  onDeleteBoleto: (id: string) => void;
  clients?: B2BClient[];
  companyConfig: CompanyConfig;
}

type SubView = "listado" | "nuevo" | "expediente";

// ─── HELPERS UI ───────────────────────────────────────────────────────────────

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "muted";
}) {
  const cls = {
    default: "bg-zinc-100 text-zinc-700 border-zinc-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    muted: "bg-zinc-50 text-zinc-400 border-zinc-200",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

// ─── VISTA PRINCIPAL ──────────────────────────────────────────────────────────

export default function VuelosView({ flights: _flights, boletos, onAddBoleto, onUpdateBoleto, onDeleteBoleto, clients = [], companyConfig }: VuelosViewProps) {
  const [subView, setSubView] = useState<SubView>("listado");
  const [search, setSearch] = useState("");
  const [selectedBoletoId, setSelectedBoletoId] = useState<string | null>(null);

  const [activeVoucherBoleto, setActiveVoucherBoleto] = useState<FlightTicket | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const handleOpenVoucher = useCallback((boleto: FlightTicket) => {
    setActiveVoucherBoleto(boleto);
    setShowVoucherModal(true);
  }, []);

  return (
    <div className="space-y-0">
      {subView === "listado" ? (
        <ListadoView
          boletos={boletos}
          search={search}
          setSearch={setSearch}
          onNuevo={() => setSubView("nuevo")}
          onExpediente={(id) => {
            setSelectedBoletoId(id);
            setSubView("expediente");
          }}
          onToggleVinculo={(id) => {
            const b = boletos.find(bol => bol.id === id);
            if (b) onUpdateBoleto({ ...b, vinculadoAExpediente: !b.vinculadoAExpediente });
          }}
          onEliminar={(id) => onDeleteBoleto(id)}
          onShowVoucher={handleOpenVoucher}
        />
      ) : subView === "nuevo" ? (
        <NuevoBoletoView
          onGuardar={(boleto) => {
            onAddBoleto(boleto);
            setSubView("listado");
          }}
          onCancelar={() => setSubView("listado")}
        />
      ) : (
        <ExpedienteAereoView
          boleto={boletos.find((b) => b.id === selectedBoletoId)!}
          clients={clients}
          onBack={() => setSubView("listado")}
          onUpdateBoleto={(updated) => {
            onUpdateBoleto(updated);
          }}
          onShowVoucher={handleOpenVoucher}
        />
      )}

      {/* MODAL DE VOUCHER DE VUELO */}
      {showVoucherModal && activeVoucherBoleto && (
        <FlightVoucherModal 
          boleto={activeVoucherBoleto} 
          onClose={() => setShowVoucherModal(false)} 
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-VISTA: LISTADO DE BOLETOS
// ═══════════════════════════════════════════════════════════════════════════════

function ListadoView({
  boletos,
  search,
  setSearch,
  onNuevo,
  onExpediente,
  onToggleVinculo,
  onEliminar,
  onShowVoucher,
}: {
  boletos: FlightTicket[];
  search: string;
  setSearch: (v: string) => void;
  onNuevo: () => void;
  onExpediente: (id: string) => void;
  onToggleVinculo: (id: string) => void;
  onEliminar: (id: string) => void;
  onShowVoucher: (boleto: FlightTicket) => void;
}) {
  const [activeTab, setActiveTab] = useState<"Activos" | "Anulados">("Activos");

  const filtered = boletos.filter((b) => {
    // filter tab
    const isAnulado = b.expedienteAereo?.status === "Anulado";
    if (activeTab === "Activos" && isAnulado) return false;
    if (activeTab === "Anulados" && !isAnulado) return false;

    // filter search
    const q = search.toLowerCase();
    const paxNames = (b.pasajeros?.map ? b.pasajeros : []).map((p) => (p?.nombre || "").toLowerCase()).join(" ");
    const ruta = buildRoute(b.segmentos?.map ? b.segmentos : []).toLowerCase();
    return (b.pnr || "").toLowerCase().includes(q) || paxNames.includes(q) || ruta.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-zinc-600" />
            Boletos Aéreos Emitidos
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            {boletos.length} boleto{boletos.length !== 1 ? "s" : ""} en base ·{" "}
            {boletos.filter((b) => !b.vinculadoAExpediente).length} disponibles para vincular
          </p>
        </div>
        <button
          id="btn-nuevo-boleto"
          onClick={onNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cargar PNR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("Activos")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "Activos" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600 cursor-pointer"
          }`}
        >
          Activos ({boletos.filter((b) => b.expedienteAereo?.status !== "Anulado").length})
        </button>
        <button
          onClick={() => setActiveTab("Anulados")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "Anulados" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600 cursor-pointer"
          }`}
        >
          Anulados ({boletos.filter((b) => b.expedienteAereo?.status === "Anulado").length})
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          id="vuelos-search"
          type="text"
          placeholder="Buscar por PNR, pasajero o ruta..."
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-500 font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {boletos.length === 0 ? (
        <EmptyState onNuevo={onNuevo} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-xs">
          No se encontraron boletos con "{search}"
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded overflow-hidden">
          {/* Header tabla */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-2">PNR</div>
            <div className="col-span-3">Pasajeros</div>
            <div className="col-span-3">Ruta</div>
            <div className="col-span-1">Fecha</div>
            <div className="col-span-1">Precio Venta</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>

          {/* Filas */}
          {filtered.map((boleto) => {
            const segmentos = boleto.segmentos?.map ? boleto.segmentos : [];
            const pasajeros = boleto.pasajeros?.map ? boleto.pasajeros : [];
            const primerSeg = segmentos[0];
            const ruta = buildRoute(segmentos);
            return (
              <div
                key={boleto.id}
                id={`boleto-row-${boleto.id}`}
                onClick={() => onExpediente(boleto.id)}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors items-center cursor-pointer"
              >
                {/* PNR */}
                <div className="col-span-2">
                  <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                    {boleto.pnr}
                  </span>
                </div>

                {/* Pasajeros */}
                <div className="col-span-3">
                  <div className="space-y-0.5">
                    {pasajeros.slice(0, 2).map((p, i) => (
                      <p key={i} className="text-xs text-zinc-700 font-medium leading-tight truncate">
                        {p?.nombre}
                        <span className="ml-1 text-[9px] text-zinc-400 font-bold">{p?.tipo}</span>
                      </p>
                    ))}
                    {pasajeros.length > 2 && (
                      <p className="text-[10px] text-zinc-400 font-medium">
                        +{pasajeros.length - 2} más
                      </p>
                    )}
                  </div>
                </div>

                {/* Ruta */}
                <div className="col-span-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900">
                      {primerSeg?.origen ?? "—"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="text-xs font-bold text-zinc-900">
                      {segmentos[segmentos.length - 1]?.destino ?? "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                    {primerSeg ? getAirlineName(primerSeg.aerolinea) : ""}
                    {segmentos.length > 1 && <span className="font-normal text-zinc-400"> (Multi)</span>}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {segmentos.length} tramo{segmentos.length !== 1 ? "s" : ""} ·{" "}
                    {pasajeros.length} pax
                  </p>
                </div>

                {/* Fecha primer vuelo */}
                <div className="col-span-1">
                  <span className="text-xs text-zinc-600 font-medium">
                    {primerSeg ? formatGDSDate(primerSeg.fecha) : "—"}
                  </span>
                </div>

                {/* Precio venta */}
                <div className="col-span-1">
                  <span className="text-xs font-bold text-zinc-900">
                    ${(boleto.precioVenta || 0).toLocaleString("es-VE")}
                  </span>
                </div>

                {/* Estado vinculación / Facturación */}
                <div className="col-span-1">
                  <div className="space-y-1.5">
                    <Badge variant={boleto.vinculadoAExpediente ? "success" : "warning"}>
                      {boleto.vinculadoAExpediente ? "Vinculado" : "Libre"}
                    </Badge>
                    {boleto.expedienteAereo && boleto.expedienteAereo.status !== "Borrador" && (
                      <div className="block">
                        <Badge variant={boleto.expedienteAereo.status === "Facturado" || boleto.expedienteAereo.status === "PagadoAerolinea" ? "info" : "default"}>
                          {boleto.expedienteAereo.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="col-span-1 flex items-center justify-end gap-1 flex-wrap">
                  {(boleto.expedienteAereo?.status === "Facturado" || boleto.expedienteAereo?.status === "PagadoAerolinea") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowVoucher(boleto);
                      }}
                      title="Descargar Voucher de Vuelo"
                      className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-toggle-${boleto.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVinculo(boleto.id);
                    }}
                    title={boleto.vinculadoAExpediente ? "Desvincular" : "Marcar vinculado"}
                    className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    {boleto.vinculadoAExpediente ? (
                      <Unlink className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-VISTA: NUEVO BOLETO (PARSER + FORMULARIO)
// ═══════════════════════════════════════════════════════════════════════════════

function NuevoBoletoView({
  onGuardar,
  onCancelar,
}: {
  onGuardar: (boleto: FlightTicket) => void;
  onCancelar: () => void;
}) {
  // Estado del parser
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseAttempted, setParseAttempted] = useState(false);

  // Estado del formulario (editable post-parseo)
  const [pnr, setPnr] = useState("");
  const [pasajeros, setPasajeros] = useState<Passenger[]>([]);
  const [segmentos, setSegmentos] = useState<FlightSegment[]>([]);
  const [precioPvp, setPrecioPvp] = useState("");
  const [costoNetoInput, setCostoNetoInput] = useState("");
  const [baseCalculo, setBaseCalculo] = useState<'PVP' | 'NETO'>('PVP');
  const [tipoComision, setTipoComision] = useState<'Porcentaje' | 'Fee'>('Porcentaje');
  const [comisionB2B, setComisionB2B] = useState<number>(10);
  const [comisionMayorista, setComisionMayorista] = useState<number>(12);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  // ─ Modo de entrada ───────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<'parser' | 'manual'>('parser');
  const [manualPaxNombre, setManualPaxNombre] = useState("");
  const [manualPaxTipo, setManualPaxTipo] = useState<"MR" | "MRS" | "MS" | "CHD" | "INF">("MR");
  const [manualPaxDoc, setManualPaxDoc] = useState("");
  const [manualSeg, setManualSeg] = useState({
    aerolinea: "", numeroVuelo: "", origen: "", destino: "",
    fecha: "", horaSalida: "", horaLlegada: "", clase: "Y", status: "HK1",
  });

  // ─ Acción: Analizar PNR ────────────────────────────────────────────────────
  const handleAnalizar = useCallback(() => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setParseAttempted(true);

    // Simular procesamiento async (en producción sería una llamada)
    setTimeout(() => {
      const result = parseGDS(rawText);
      setPnr(result.data.pnr ?? "");
      setPasajeros(result.data.pasajeros ?? []);
      setSegmentos(result.data.segmentos ?? []);
      setParseWarnings(result.warnings);
      setIsParsing(false);
    }, 400);
  }, [rawText]);

  // ─ Acción: Cargar ejemplo ─────────────────────────────────────────────────
  const handleLoadSample = () => {
    setRawText(SAMPLE_GDS_TEXT);
    setParseAttempted(false);
    setPnr("");
    setPasajeros([]);
    setSegmentos([]);
    setParseWarnings([]);
  };

  // Manejadores bidireccionales
  const handleCostoNetoChange = (val: string) => {
    setCostoNetoInput(val);
    setBaseCalculo('NETO');
    const num = parseFloat(val) || 0;
    const suma = comisionB2B + comisionMayorista;
    if (tipoComision === 'Porcentaje') {
      setPrecioPvp(num > 0 ? (num * (1 + suma / 100)).toFixed(2) : "");
    } else {
      setPrecioPvp(num > 0 ? (num + suma).toFixed(2) : "");
    }
  };

  const handlePvpChange = (val: string) => {
    setPrecioPvp(val);
    setBaseCalculo('PVP');
    const num = parseFloat(val) || 0;
    const suma = comisionB2B + comisionMayorista;
    if (tipoComision === 'Porcentaje') {
      setCostoNetoInput(num > 0 ? (num / (1 + suma / 100)).toFixed(2) : "");
    } else {
      setCostoNetoInput(num > 0 ? (num - suma).toFixed(2) : "");
    }
  };

  const handleComisionB2BChange = (val: number) => {
    setComisionB2B(val);
    const suma = val + comisionMayorista;
    if (tipoComision === 'Porcentaje') {
      if (baseCalculo === 'PVP') {
        const pvpNum = parseFloat(precioPvp) || 0;
        setCostoNetoInput(pvpNum > 0 ? (pvpNum / (1 + suma / 100)).toFixed(2) : "");
      } else {
        const netoNum = parseFloat(costoNetoInput) || 0;
        setPrecioPvp(netoNum > 0 ? (netoNum * (1 + suma / 100)).toFixed(2) : "");
      }
    } else {
      if (baseCalculo === 'PVP') {
        const pvpNum = parseFloat(precioPvp) || 0;
        setCostoNetoInput(pvpNum > 0 ? (pvpNum - suma).toFixed(2) : "");
      } else {
        const netoNum = parseFloat(costoNetoInput) || 0;
        setPrecioPvp(netoNum > 0 ? (netoNum + suma).toFixed(2) : "");
      }
    }
  };

  const handleComisionMayoristaChange = (val: number) => {
    setComisionMayorista(val);
    const suma = comisionB2B + val;
    if (tipoComision === 'Porcentaje') {
      if (baseCalculo === 'PVP') {
        const pvpNum = parseFloat(precioPvp) || 0;
        setCostoNetoInput(pvpNum > 0 ? (pvpNum / (1 + suma / 100)).toFixed(2) : "");
      } else {
        const netoNum = parseFloat(costoNetoInput) || 0;
        setPrecioPvp(netoNum > 0 ? (netoNum * (1 + suma / 100)).toFixed(2) : "");
      }
    } else {
      if (baseCalculo === 'PVP') {
        const pvpNum = parseFloat(precioPvp) || 0;
        setCostoNetoInput(pvpNum > 0 ? (pvpNum - suma).toFixed(2) : "");
      } else {
        const netoNum = parseFloat(costoNetoInput) || 0;
        setPrecioPvp(netoNum > 0 ? (netoNum + suma).toFixed(2) : "");
      }
    }
  };

  const handleTipoComisionToggle = () => {
    setTipoComision(prev => {
      const newType = prev === 'Porcentaje' ? 'Fee' : 'Porcentaje';
      // Recalcular en base al nuevo tipo
      const netoNum = parseFloat(costoNetoInput) || 0;
      const suma = comisionB2B + comisionMayorista;
      if (newType === 'Porcentaje') {
        setPrecioPvp(netoNum > 0 ? (netoNum * (1 + suma / 100)).toFixed(2) : "");
      } else {
        setPrecioPvp(netoNum > 0 ? (netoNum + suma).toFixed(2) : "");
      }
      return newType;
    });
  };

  const pvpFinal = parseFloat(precioPvp) || 0;
  const costoNetoFinal = parseFloat(costoNetoInput) || 0;
  
  let gananciaAgencia = 0;
  let gananciaForatour = 0;
  let netoB2B = 0;

  if (tipoComision === 'Porcentaje') {
    const sumaComisiones = comisionB2B + comisionMayorista;
    const comisionBruta = pvpFinal - costoNetoFinal;
    gananciaAgencia = sumaComisiones > 0 ? comisionBruta * (comisionB2B / sumaComisiones) : 0;
    gananciaForatour = sumaComisiones > 0 ? comisionBruta * (comisionMayorista / sumaComisiones) : 0;
    netoB2B = pvpFinal - gananciaAgencia;
  } else {
    gananciaAgencia = comisionB2B;
    gananciaForatour = comisionMayorista;
    netoB2B = costoNetoFinal + gananciaForatour;
  }

  // ─ Acción: Guardar boleto ─────────────────────────────────────────────────
  const handleGuardar = () => {
    if (!pnr || pasajeros.length === 0 || segmentos.length === 0 || pvpFinal === 0 || costoNetoFinal === 0) return;

    setGuardando(true);
    setTimeout(() => {
      const nuevoBoleto: FlightTicket = {
        id: `BOL-${Date.now()}`,
        pnr,
        pasajeros,
        segmentos,
        costoNeto: costoNetoFinal,
        precioPvp: pvpFinal,
        comisionB2B,
        comisionMayorista,
        tipoComision,
        precioVenta: netoB2B, // Lo que paga la agencia B2B
        vinculadoAExpediente: false,
        notas,
        createdAt: new Date().toISOString(),
      };
      onGuardar(nuevoBoleto);
      setGuardando(false);
    }, 300);
  };

  const canGuardar =
    pnr.trim().length === 6 &&
    pasajeros.length > 0 &&
    segmentos.length > 0 &&
    pvpFinal > 0 &&
    costoNetoFinal > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4 sticky top-16 bg-zinc-50/95 backdrop-blur-xs pt-2 z-10 -mx-8 px-8">
        <button
          id="btn-volver-listado"
          onClick={onCancelar}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al listado
        </button>
        <span className="text-zinc-300">·</span>
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Plane className="w-4 h-4 text-zinc-500" />
          Cargar Nuevo Boleto Aéreo
        </h2>
      </div>

      {/* Toggle de modo de entrada */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setInputMode('parser')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${inputMode === 'parser' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Parser GDS
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${inputMode === 'manual' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Entrada Manual
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── COLUMNA IZQUIERDA: PNR INPUT ── */}
        <div className="space-y-4">

          {/* ── MODO PARSER ── */}
          {inputMode === 'parser' && (
            <>
              {/* Textarea GDS */}
              <div className="bg-white border border-zinc-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Terminal GDS
                    </span>
                  </div>
                  <button
                    id="btn-load-sample"
                    onClick={handleLoadSample}
                    className="text-[10px] text-zinc-400 hover:text-zinc-700 font-semibold uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Cargar Ejemplo
                  </button>
                </div>
                <textarea
                  id="gds-raw-input"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (parseAttempted) setParseAttempted(false);
                  }}
                  placeholder={`Pega el texto de Sabre / KIU / Amadeus aquí...\n\nEjemplo:\nK3W9L2\n 1.1GARCIA/CARLOS MR 2.1LOPEZ/MARIA MRS\n 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825`}
                  rows={14}
                  className="w-full p-4 text-xs font-mono bg-zinc-950 text-emerald-400 placeholder-emerald-700/70 focus:outline-none resize-none leading-relaxed"
                  style={{ fontFamily: "monospace" }}
                />
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {rawText.split("\n").length} líneas · {rawText.length} caracteres
                  </span>
                  <button
                    id="btn-analizar-pnr"
                    onClick={handleAnalizar}
                    disabled={!rawText.trim() || isParsing}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-bold rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isParsing ? (
                      <>
                        <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analizar Reserva
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Advertencias del parser */}
              {parseWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Advertencias del Parser
                  </div>
                  {parseWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700 leading-relaxed">
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── MODO MANUAL: formulario agregar pasajero ── */}
          {inputMode === 'manual' && (
            <div className="bg-white border border-zinc-200 rounded overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Agregar Pasajero
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Nombre (APELLIDO/NOMBRE)
                    </label>
                    <input
                      type="text"
                      value={manualPaxNombre}
                      onChange={(e) => setManualPaxNombre(e.target.value.toUpperCase())}
                      placeholder="GARCIA/CARLOS"
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Tipo
                    </label>
                    <select
                      value={manualPaxTipo}
                      onChange={(e) => setManualPaxTipo(e.target.value as "MR" | "MRS" | "MS" | "CHD" | "INF")}
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                    >
                      <option value="MR">MR (Adulto M)</option>
                      <option value="MRS">MRS (Adulto F)</option>
                      <option value="MS">MS (Adulto F)</option>
                      <option value="CHD">CHD (Niño)</option>
                      <option value="INF">INF (Infante)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Documento
                    </label>
                    <input
                      type="text"
                      value={manualPaxDoc}
                      onChange={(e) => setManualPaxDoc(e.target.value.toUpperCase())}
                      placeholder="Pasaporte / CI"
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-mono text-zinc-700 focus:outline-none focus:border-zinc-500 uppercase"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!manualPaxNombre.trim()) return;
                    setPasajeros(prev => [...prev, { nombre: manualPaxNombre.trim(), tipo: manualPaxTipo, documento: manualPaxDoc.trim() || undefined }]);
                    setManualPaxNombre("");
                    setManualPaxDoc("");
                  }}
                  disabled={!manualPaxNombre.trim()}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold rounded transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Pasajero
                </button>
              </div>
            </div>
          )}

          {/* Lista de pasajeros (parser: solo tras parsear; manual: siempre) */}
          {(inputMode === 'manual' || (parseAttempted && !isParsing)) && (
            <div className="bg-white border border-zinc-200 rounded overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {inputMode === 'manual' ? 'Pasajeros' : 'Pasajeros Detectados'}
                </span>
                <Badge variant={pasajeros.length > 0 ? "success" : "warning"}>
                  {pasajeros.length}
                </Badge>
              </div>
              {pasajeros.length === 0 ? (
                <p className="text-xs text-zinc-400 p-4 font-medium">
                  {inputMode === 'manual' ? 'Agrega pasajeros con el formulario de arriba.' : 'Sin pasajeros detectados. Revisa el formato.'}
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {pasajeros.map((p, i) => (
                    <div key={i} className="flex flex-col gap-2 px-4 py-3 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 font-mono">
                          {p.nombre}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              p.tipo === "CHD" || p.tipo === "INF"
                                ? "info"
                                : p.tipo === "MRS" || p.tipo === "MS"
                                ? "warning"
                                : "default"
                            }
                          >
                            {p.tipo}
                          </Badge>
                          <button
                            onClick={() => setPasajeros(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Doc. Identidad / Pasaporte..."
                        value={p.documento || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPasajeros(prev => {
                            const arr = [...prev];
                            arr[i] = { ...arr[i], documento: val };
                            return arr;
                          });
                        }}
                        className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase text-zinc-700"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: FORMULARIO ── */}
        <div className="space-y-4">
          {/* PNR y datos básicos */}
          <div className="bg-white border border-zinc-200 rounded overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                Datos del Boleto
              </span>
            </div>
            <div className="p-4 space-y-3">
              {/* PNR */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  PNR / Localizador *
                </label>
                <input
                  id="field-pnr"
                  type="text"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  placeholder="XXXXXX"
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 uppercase tracking-widest"
                />
              </div>

              {/* Segmentos */}
              {(segmentos.length > 0 || inputMode === 'manual') && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    Itinerario ({segmentos.length} tramo{segmentos.length !== 1 ? "s" : ""})
                  </label>
                  <div className="space-y-2">
                    {segmentos.map((seg, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-xs"
                      >
                        <span className="font-mono font-bold text-zinc-400 text-[10px]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-bold text-zinc-700 font-mono">
                          {seg.aerolinea}{seg.numeroVuelo}
                        </span>
                        <Badge variant="muted">{seg.clase}</Badge>
                        <span className="font-bold text-zinc-900">
                          {seg.origen}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-300 flex-shrink-0" />
                        <span className="font-bold text-zinc-900">{seg.destino}</span>
                        <span className="ml-auto text-zinc-400 font-mono text-[10px]">
                          {formatGDSDate(seg.fecha)} · {seg.horaSalida}
                        </span>
                        <Badge variant={seg.status.startsWith("HK") ? "success" : "warning"}>
                          {seg.status}
                        </Badge>
                        <button
                          onClick={() => setSegmentos(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-zinc-300 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario para agregar tramo en modo manual */}
              {inputMode === 'manual' && (
                <div className="border border-zinc-200 rounded p-3 space-y-2 bg-zinc-50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agregar Tramo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Aerolínea</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={manualSeg.aerolinea}
                        onChange={(e) => setManualSeg(s => ({ ...s, aerolinea: e.target.value.toUpperCase() }))}
                        placeholder="CM"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">N° Vuelo</label>
                      <input
                        type="text"
                        value={manualSeg.numeroVuelo}
                        onChange={(e) => setManualSeg(s => ({ ...s, numeroVuelo: e.target.value }))}
                        placeholder="224"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Origen</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={manualSeg.origen}
                        onChange={(e) => setManualSeg(s => ({ ...s, origen: e.target.value.toUpperCase() }))}
                        placeholder="CCS"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Destino</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={manualSeg.destino}
                        onChange={(e) => setManualSeg(s => ({ ...s, destino: e.target.value.toUpperCase() }))}
                        placeholder="PTY"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Fecha</label>
                      <input
                        type="text"
                        value={manualSeg.fecha}
                        onChange={(e) => setManualSeg(s => ({ ...s, fecha: e.target.value.toUpperCase() }))}
                        placeholder="15NOV"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Clase</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={manualSeg.clase}
                        onChange={(e) => setManualSeg(s => ({ ...s, clase: e.target.value.toUpperCase() }))}
                        placeholder="Y"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Hora Salida</label>
                      <input
                        type="text"
                        value={manualSeg.horaSalida}
                        onChange={(e) => setManualSeg(s => ({ ...s, horaSalida: e.target.value }))}
                        placeholder="07:00"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-0.5">Hora Llegada</label>
                      <input
                        type="text"
                        value={manualSeg.horaLlegada}
                        onChange={(e) => setManualSeg(s => ({ ...s, horaLlegada: e.target.value }))}
                        placeholder="08:25"
                        className="w-full px-2 py-1.5 border border-zinc-200 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!manualSeg.aerolinea || !manualSeg.origen || !manualSeg.destino) return;
                      setSegmentos(prev => [...prev, {
                        aerolinea: manualSeg.aerolinea,
                        numeroVuelo: manualSeg.numeroVuelo,
                        origen: manualSeg.origen,
                        destino: manualSeg.destino,
                        fecha: manualSeg.fecha,
                        horaSalida: manualSeg.horaSalida,
                        horaLlegada: manualSeg.horaLlegada,
                        clase: manualSeg.clase || "Y",
                        status: manualSeg.status || "HK1",
                        terminal: "",
                      }]);
                      setManualSeg({ aerolinea: "", numeroVuelo: "", origen: "", destino: "", fecha: "", horaSalida: "", horaLlegada: "", clase: "Y", status: "HK1" });
                    }}
                    disabled={!manualSeg.aerolinea || !manualSeg.origen || !manualSeg.destino}
                    className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold rounded transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Tramo
                  </button>
                </div>
              )}

              {/* Estado vacío de segmentos en modo parser */}
              {inputMode === 'parser' && parseAttempted && !isParsing && segmentos.length === 0 && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-center">
                  <p className="text-xs text-zinc-400 font-medium">
                    No se detectaron segmentos. Verifica el formato del texto.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Datos financieros — OBLIGATORIOS (ingreso manual del agente) */}
          <div className="bg-white border border-zinc-200 rounded overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                Datos Financieros{" "}
                <span className="text-[9px] text-zinc-400 normal-case tracking-normal font-medium">
                  (ingreso manual obligatorio)
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Tipo de Ganancia:</span>
                <div className="flex bg-zinc-200/60 p-0.5 rounded-md">
                  <button
                    onClick={() => tipoComision !== 'Porcentaje' && handleTipoComisionToggle()}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${tipoComision === 'Porcentaje' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    onClick={() => tipoComision !== 'Fee' && handleTipoComisionToggle()}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${tipoComision === 'Fee' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Fee Fijo ($)
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Costo Neto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      $
                    </span>
                    <input
                      id="field-costo-neto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costoNetoInput}
                      onChange={(e) => handleCostoNetoChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Precio Venta (PVP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      $
                    </span>
                    <input
                      id="field-precio-pvp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioPvp}
                      onChange={(e) => handlePvpChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 bg-white"
                    />
                  </div>
                </div>
                {tipoComision === 'Porcentaje' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                        Comisión Agencia (%)
                      </label>
                      <div className="relative">
                        <input
                          id="field-comision-b2b"
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={comisionB2B}
                          onChange={(e) => handleComisionB2BChange(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full p-2 pr-8 border border-zinc-200 bg-white rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                        Comisión Foratour (%)
                      </label>
                      <div className="relative">
                        <input
                          id="field-comision-mayorista"
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={comisionMayorista}
                          onChange={(e) => handleComisionMayoristaChange(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full p-2 pr-8 border border-zinc-200 bg-white rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                        Fee Fijo Agencia ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-bold">$</span>
                        <input
                          id="field-fee-agencia"
                          type="number"
                          min="0"
                          step="0.01"
                          value={comisionB2B}
                          onChange={(e) => handleComisionB2BChange(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-3 py-2 border border-emerald-200 bg-emerald-50/50 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                        Fee Fijo Foratour ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-bold">$</span>
                        <input
                          id="field-fee-mayorista"
                          type="number"
                          min="0"
                          step="0.01"
                          value={comisionMayorista}
                          onChange={(e) => handleComisionMayoristaChange(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-3 py-2 border border-emerald-200 bg-emerald-50/50 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Indicador de margen */}
              {pvpFinal > 0 && costoNetoFinal > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-md text-xs space-y-2 text-zinc-700 font-semibold">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Costo Neto (Calculado a pagar a aerolínea):</span>
                    <span className="font-bold">
                      ${costoNetoFinal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {tipoComision === 'Porcentaje' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Neto B2B (a Cobrar por Agencia):</span>
                        <span className="text-zinc-950 font-black">
                          ${netoB2B.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-zinc-200 pt-1.5 mt-1">
                        <span>Nuestra Ganancia Mayorista ({comisionMayorista}%):</span>
                        <span>
                          +${gananciaForatour.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Neto B2B (a Cobrar por Agencia):</span>
                        <span className="text-zinc-950 font-black">
                          ${netoB2B.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-zinc-200 pt-1.5 mt-1">
                        <span>Nuestra Ganancia (Fee Fijo):</span>
                        <span>
                          +${gananciaForatour.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center font-bold text-zinc-900 border-t border-zinc-200 pt-1.5 mt-1">
                    <span>Precio Venta (PVP):</span>
                    <span className="text-sm">
                      ${pvpFinal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="field-notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Restricciones de tarifa, penalidades, solicitudes especiales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Acciones finales */}
          <div className="flex gap-3">
            <button
              id="btn-cancelar-boleto"
              onClick={onCancelar}
              className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-xs font-bold rounded hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-boleto"
              onClick={handleGuardar}
              disabled={!canGuardar || guardando}
              className="flex-1 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {guardando ? (
                <>
                  <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardar Boleto
                </>
              )}
            </button>
          </div>

          {/* Hint de validación */}
          {!canGuardar && (parseAttempted || inputMode === 'manual') && (
            <p className="text-[10px] text-zinc-400 text-center font-medium">
              Requerido: PNR de 6 chars · al menos 1 pasajero · 1 segmento · precio de venta
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-VISTA: EXPEDIENTE AÉREO (CICLO DE FACTURACIÓN)
// ═══════════════════════════════════════════════════════════════════════════════

function ExpedienteAereoView({
  boleto,
  clients,
  onBack,
  onUpdateBoleto,
  onShowVoucher,
}: {
  boleto: FlightTicket;
  clients: B2BClient[];
  onBack: () => void;
  onUpdateBoleto: (boleto: FlightTicket) => void;
  onShowVoucher: (boleto: FlightTicket) => void;
}) {
  const { showAlert, showConfirm } = useDialog();
  // Inicializamos el expediente aéreo si no existe
  const [expediente, setExpediente] = useState(
    boleto.expedienteAereo || {
      id: `AER-${Math.floor(Math.random() * 10000)}`,
      status: "Borrador" as const,
      titular: boleto.pasajeros[0]?.nombre || "",
      createdAt: new Date().toISOString(),
    }
  );

  const agenciasActivas = clients; // Quitamos el filtro "Activo" para mostrar todas las agencias de prueba
  const primerSeg = boleto.segmentos[0];
  const ultimoSeg = boleto.segmentos[boleto.segmentos.length - 1];

  const [agencySearch, setAgencySearch] = useState(expediente.clienteB2BNombre || "");
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);

  const handleSave = () => {
    onUpdateBoleto({ ...boleto, expedienteAereo: expediente });
  };

  const handleSendToBilling = () => {
    const updated = { ...expediente, status: "Solicitado" as const };
    setExpediente(updated);
    onUpdateBoleto({ ...boleto, expedienteAereo: updated });
    showAlert({ title: "Éxito", message: "Expediente enviado a facturación exitosamente.", type: "success" });
  };

  const isCreditAgency = React.useMemo(() => {
    if (!expediente.clienteB2BId) return false;
    const agency = agenciasActivas.find(a => a.id === expediente.clienteB2BId);
    return agency?.tipo === "A Crédito";
  }, [expediente.clienteB2BId, agenciasActivas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 sticky top-16 bg-zinc-50/95 backdrop-blur-xs pt-2 z-10 -mx-8 px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Expediente Aéreo <span className="text-zinc-400 font-normal">{expediente.id}</span>
              </h2>
              <Badge variant={
                expediente.status === "Facturado" || expediente.status === "PagadoAerolinea" ? "success" :
                expediente.status === "Solicitado" ? "info" : "default"
              }>
                {expediente.status}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 font-medium">
              Gestión de cobro al cliente y pago al proveedor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expediente.status === "Borrador" && !boleto.facturarConjunto && (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Guardar Cambios
              </button>
              <button
                onClick={handleSendToBilling}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Enviar a Facturar
              </button>
              {expediente.status === "Borrador" && (
                <button
                  onClick={() => {
                    showConfirm({
                      title: "Anular Expediente Aéreo",
                      message: "Escriba el localizador (PNR) exacto para confirmar la anulación. El expediente cambiará a estado Anulado.",
                      requireInputToConfirm: boleto.pnr,
                      type: "danger",
                      confirmText: "Sí, Anular",
                      onConfirm: () => {
                        const updated = { ...expediente, status: "Anulado" as const };
                        setExpediente(updated);
                        onUpdateBoleto({ ...boleto, expedienteAereo: updated });
                        showAlert({ title: "Expediente Anulado", message: "El expediente ha sido anulado correctamente.", type: "success" });
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Anular
                </button>
              )}
            </>
          )}
          {expediente.status === "Anulado" && !boleto.facturarConjunto && (
            <button
              onClick={() => {
                showConfirm({
                  title: "Reactivar Expediente",
                  message: "¿Está seguro que desea reactivar este expediente? Volverá al estado Borrador para poder ser editado y enviado nuevamente.",
                  type: "warning",
                  confirmText: "Sí, Reactivar",
                  onConfirm: () => {
                    const updated = { ...expediente, status: "Borrador" as const };
                    setExpediente(updated);
                    onUpdateBoleto({ ...boleto, expedienteAereo: updated });
                    showAlert({ title: "Expediente Reactivado", message: "El expediente ha sido devuelto al estado Borrador.", type: "success" });
                  }
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Volver a Activar
            </button>
          )}
          {(expediente.status === "Facturado" || expediente.status === "PagadoAerolinea") && (
            <button
              onClick={() => onShowVoucher(boleto)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Descargar Voucher
            </button>
          )}
          {expediente.status === "Borrador" && boleto.facturarConjunto && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded">
              <Info className="w-3.5 h-3.5" />
              Se facturará junto a la reserva {boleto.expedienteId}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna Izquierda: Detalles del Boleto (Solo lectura) */}
        <div className="col-span-1 space-y-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-zinc-400" /> Detalle del Boleto
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Localizador (PNR)</p>
                <p className="font-mono text-xl font-black text-zinc-900">{boleto.pnr}</p>
              </div>

              <div className="border-t border-zinc-200 pt-3 mt-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Segmentos de Vuelo</p>
                <div className="space-y-3">
                  {(boleto.segmentos?.map ? boleto.segmentos : []).map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-zinc-100 shadow-xs">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-zinc-900">{s.origen}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-400" />
                          <span className="font-bold text-zinc-900">{s.destino}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          {formatGDSDate(s.fecha)} | {s.horaSalida} - {s.horaLlegada}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          {getAirlineName(s.aerolinea)} ({s.aerolinea} {s.numeroVuelo})
                        </span>
                        <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">Clase {s.clase}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Pasajeros ({(boleto.pasajeros?.map ? boleto.pasajeros : []).length})</p>
                <div className="space-y-2">
                  {(boleto.pasajeros?.map ? boleto.pasajeros : []).map((p, i) => (
                    <div key={i} className="flex flex-col">
                      <p className="text-xs text-zinc-700 font-semibold">{p.nombre}</p>
                      {p.documento && (
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID/Pasaporte: {p.documento}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Costo Neto</span>
                  <span className="text-xs font-bold text-zinc-700">${boleto.costoNeto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Precio Venta (PVP)</span>
                  <span className="text-xs font-bold text-zinc-700">${(boleto.precioPvp || boleto.precioVenta).toLocaleString()}</span>
                </div>
                {boleto.comisionB2B !== undefined && boleto.comisionB2B > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Comisión B2B</span>
                    <span className="text-xs font-bold text-amber-600">-{boleto.comisionB2B}% (${((boleto.precioPvp || 0) - boleto.precioVenta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                )}
                {boleto.comisionMayorista !== undefined && boleto.comisionMayorista > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Comisión Foratour</span>
                    <span className="text-xs font-bold text-amber-600">-{boleto.comisionMayorista}% (${(boleto.precioVenta - boleto.costoNeto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-800 font-bold uppercase tracking-wider">Neto B2B a Cobrar</span>
                  <span className="text-sm font-black text-zinc-900">${boleto.precioVenta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ganancia Foratour</span>
                  <span className="text-xs font-bold text-emerald-600">
                    +${(boleto.precioVenta - boleto.costoNeto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formularios de Expediente */}
        <div className="col-span-2 space-y-4">
          
          {/* Cobro al Cliente */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> 1. Cobro al Cliente / Agencia
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Titular del Expediente</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-zinc-200 rounded text-xs font-semibold"
                  value={expediente.titular}
                  onChange={(e) => setExpediente({ ...expediente, titular: e.target.value })}
                  disabled={expediente.status !== "Borrador"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center justify-between">
                  <span>Agencia B2B (Opcional)</span>
                  {expediente.clienteB2BId && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      isCreditAgency ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      {isCreditAgency ? "Línea de Crédito" : "Venta Directa"}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar agencia B2B por nombre..."
                    className="w-full p-2.5 pl-8 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500"
                    value={agencySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAgencySearch(val);
                      setShowAgencyDropdown(true);
                      if (!val) {
                        setExpediente({ ...expediente, clienteB2BId: undefined, clienteB2BNombre: undefined, facturacionTipo: "Pago Contado" });
                      }
                    }}
                    onFocus={() => setShowAgencyDropdown(true)}
                    disabled={expediente.status !== "Borrador"}
                  />
                  <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  
                  {agencySearch && expediente.status === "Borrador" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAgencySearch("");
                        setExpediente({ ...expediente, clienteB2BId: undefined, clienteB2BNombre: undefined, facturacionTipo: "Pago Contado" });
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {showAgencyDropdown && expediente.status === "Borrador" && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowAgencyDropdown(false)}
                      />
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-150">
                        {agenciasActivas.filter(c => {
                          const query = agencySearch.toLowerCase();
                          return (
                            c.nombre.toLowerCase().includes(query) ||
                            c.rif.toLowerCase().includes(query) ||
                            c.id.toLowerCase().includes(query) ||
                            (c.email || "").toLowerCase().includes(query)
                          );
                        }).length === 0 ? (
                          <div className="p-3 text-xs text-zinc-400 italic">
                            Ninguna agencia coincide con "{agencySearch}".
                          </div>
                        ) : (
                          agenciasActivas.filter(c => {
                            const query = agencySearch.toLowerCase();
                            return (
                              c.nombre.toLowerCase().includes(query) ||
                              c.rif.toLowerCase().includes(query) ||
                              c.id.toLowerCase().includes(query) ||
                              (c.email || "").toLowerCase().includes(query)
                            );
                          }).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setAgencySearch(c.nombre);
                                setExpediente({
                                  ...expediente,
                                  clienteB2BId: c.id,
                                  clienteB2BNombre: c.nombre,
                                  facturacionTipo: c.tipo === "A Crédito" ? "Crédito" : "Pago Contado"
                                });
                                setShowAgencyDropdown(false);
                              }}
                              className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors cursor-pointer border-none font-sans"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-zinc-900 block">{c.nombre}</span>
                                <span className="text-[10px] text-zinc-400 font-mono block">
                                  Cod: {c.id} | RIF: {c.rif}
                                </span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                c.tipo === "A Crédito" ? "bg-purple-50 text-purple-700" :
                                c.tipo === "Satélite" ? "bg-blue-50 text-blue-700" :
                                "bg-zinc-100 text-zinc-600"
                              }`}>
                                {c.tipo}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isCreditAgency && expediente.status === "Borrador" && (
              <div className="mb-4 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Modalidad de Envío</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpediente({ ...expediente, facturacionTipo: "Crédito" })}
                    className={`py-2 px-3 border rounded text-xs font-bold transition-all ${
                      expediente.facturacionTipo === "Crédito" || !expediente.facturacionTipo
                        ? "bg-zinc-950 border-zinc-950 text-white"
                        : "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Facturar a Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpediente({ ...expediente, facturacionTipo: "Pago Contado" })}
                    className={`py-2 px-3 border rounded text-xs font-bold transition-all ${
                      expediente.facturacionTipo === "Pago Contado"
                        ? "bg-zinc-950 border-zinc-950 text-white"
                        : "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Pago Contado (Inmediato)
                  </button>
                </div>
              </div>
            )}

            {(!isCreditAgency || expediente.facturacionTipo === "Pago Contado") && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Método de Pago</label>
                  <select
                    className="w-full p-2 border border-zinc-200 rounded text-xs"
                    value={expediente.comprobanteMetodo || ""}
                    onChange={(e) => setExpediente({ ...expediente, comprobanteMetodo: e.target.value })}
                    disabled={expediente.status !== "Borrador"}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Referencia</label>
                  <input
                    type="text"
                    placeholder="Nro ref..."
                    className="w-full p-2 border border-zinc-200 rounded text-xs"
                    value={expediente.comprobanteRef || ""}
                    onChange={(e) => setExpediente({ ...expediente, comprobanteRef: e.target.value })}
                    disabled={expediente.status !== "Borrador"}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Monto Pagado</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="number"
                      className="w-full pl-8 p-2 border border-zinc-200 rounded text-xs font-bold"
                      value={expediente.comprobanteMonto || ""}
                      onChange={(e) => setExpediente({ ...expediente, comprobanteMonto: parseFloat(e.target.value) || 0 })}
                      disabled={expediente.status !== "Borrador"}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Adjuntar Comprobante de Cliente (Simulado)</label>
                  <div className="border border-dashed border-zinc-300 bg-zinc-50 rounded p-2.5 flex items-center justify-center cursor-pointer hover:bg-zinc-100 relative">
                    <input
                      type="file"
                      disabled={expediente.status !== "Borrador"}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setExpediente({ ...expediente, comprobanteArchivo: file.name });
                      }}
                    />
                    <span className="text-[10px] font-bold text-zinc-600">
                      {expediente.comprobanteArchivo ? `✓ ${expediente.comprobanteArchivo}` : "Clic para adjuntar archivo"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pago a Aerolínea / Proveedor */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-500" /> 2. Pago a Aerolínea / GDS
            </h3>
            
            <p className="text-[10px] text-zinc-500 mb-4 font-medium">
              Registra el pago real emitido a la aerolínea por el costo neto de este boleto.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Monto Pagado a Aerolínea</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="number"
                    className="w-full pl-8 p-2 border border-zinc-200 rounded text-xs font-bold"
                    value={expediente.pagoAerolinea?.monto || boleto.costoNeto}
                    onChange={(e) => setExpediente({
                      ...expediente,
                      pagoAerolinea: { ...expediente.pagoAerolinea, monto: parseFloat(e.target.value) || 0 } as any
                    })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Método / Referencia</label>
                <input
                  type="text"
                  placeholder="Ej: BSP, TC Corporativa..."
                  className="w-full p-2 border border-zinc-200 rounded text-xs"
                  value={expediente.pagoAerolinea?.referencia || ""}
                  onChange={(e) => setExpediente({
                    ...expediente,
                    pagoAerolinea: { ...expediente.pagoAerolinea, referencia: e.target.value } as any
                  })}
                />
              </div>
              <div className="space-y-1.5 col-span-2 mt-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Adjuntar Soporte de Pago Aerolínea (Simulado)</label>
                <div className="border border-dashed border-zinc-300 bg-zinc-50 rounded p-2.5 flex items-center justify-center cursor-pointer hover:bg-zinc-100 relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setExpediente({
                        ...expediente,
                        pagoAerolinea: { ...expediente.pagoAerolinea, comprobanteArchivo: file.name } as any
                      });
                    }}
                  />
                  <span className="text-[10px] font-bold text-zinc-600">
                    {expediente.pagoAerolinea?.comprobanteArchivo ? `✓ ${expediente.pagoAerolinea.comprobanteArchivo}` : "Clic para adjuntar soporte"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  if (expediente.status !== "Borrador") return;
                  
                  const updated = {
                    ...expediente,
                    status: "Solicitado" as const,
                    pagoAerolinea: {
                      ...expediente.pagoAerolinea,
                      monto: expediente.pagoAerolinea?.monto || boleto.costoNeto,
                      referencia: expediente.pagoAerolinea?.referencia || "BSP",
                      metodo: "Transferencia",
                      fecha: new Date().toISOString()
                    }
                  };
                  setExpediente(updated);
                  onUpdateBoleto({ ...boleto, expedienteAereo: updated });
                  showAlert({ title: "Solicitud enviada", message: "Solicitud enviada a Facturación. El departamento debe aprobar la emisión de factura y pagos.", type: "success" });
                }}
                disabled={expediente.status !== "Borrador"}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded shadow-xs transition-all ${
                  expediente.status === "Borrador"
                    ? "bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                }`}
              >
                {expediente.status === "Borrador" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Procesar Liquidación y Enviar a Facturación
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {expediente.status === "Solicitado" ? "En Revisión por Facturación" : "Liquidación Procesada"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-14 text-center">
      <div className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <Ticket className="w-6 h-6 text-zinc-300" />
      </div>
      <h3 className="text-sm font-bold text-zinc-700 mb-1">Sin boletos registrados</h3>
      <p className="text-xs text-zinc-400 font-medium mb-5 max-w-xs mx-auto leading-relaxed">
        Carga el texto de una reserva GDS para extraer los datos automáticamente y registrar el boleto.
      </p>
      <button
        id="btn-empty-cargar-pnr"
        onClick={onNuevo}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Cargar primer PNR
      </button>
    </div>
  );
}

// ─── MODAL VOUCHER AÉREO ────────────────────────────────────────────────────────
function FlightVoucherModal({
  boleto,
  onClose
}: {
  boleto: FlightTicket;
  onClose: () => void;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page {
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
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
        <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
          {/* Header UI (Not printed) */}
          <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between print:hidden shrink-0">
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                <Printer className="w-4.5 h-4.5 text-zinc-400" /> Voucher de Vuelo Aéreo
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                Documento de viaje oficial para el pasajero (sin precios expuestos).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Generar PDF / Imprimir
              </button>
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
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
                  Consolidador Mayorista Aéreo y Terrestre
                </p>
              </div>
              
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5 font-sans">
                <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-250 text-blue-800 rounded text-[9px] font-black uppercase tracking-wider">
                  E-TICKET ITINERARY / RECEIPT
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900">PNR: {boleto.pnr}</span>
              </div>
            </div>

            {/* Paid Stamp */}
            <div className="border border-emerald-250 bg-emerald-50/40 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase text-emerald-800 font-sans">Estado: BOLETO EMITIDO Y CONFIRMADO</h4>
                <p className="text-[10.5px] text-zinc-650 leading-relaxed font-semibold font-sans">
                  Este documento certifica la emisión de los boletos aéreos electrónicos detallados a continuación. Por favor presente este recibo junto a su documento de identidad vigente al momento del chequeo en el aeropuerto.
                </p>
              </div>
              <div className="flex-shrink-0 w-24 h-24 border-4 border-emerald-600/40 rounded-full flex flex-col items-center justify-center text-center rotate-12 font-sans select-none">
                <span className="text-[9px] font-black uppercase text-emerald-600/60 leading-none">FORATOUR</span>
                <span className="text-sm font-black text-emerald-600 uppercase tracking-widest mt-1">EMITIDO</span>
                <span className="text-[8px] font-mono text-emerald-500 mt-0.5 leading-none">OK</span>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="mb-6 space-y-4">
              <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Datos de los Pasajeros</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(boleto.pasajeros?.map ? boleto.pasajeros : []).map((p, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-zinc-900 font-mono uppercase">
                      {p.nombre} <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded ml-1">{p.tipo}</span>
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      Doc. Identidad: <span className="text-zinc-800">{p.documento || "No especificado"}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="space-y-4 mb-6">
              <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Itinerario de Vuelos</h5>
              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30 break-inside-avoid print:break-inside-avoid">
                {(boleto.segmentos?.map ? boleto.segmentos : []).map((seg, i) => (
                  <div key={i} className="p-4 bg-white space-y-2 break-inside-avoid print:break-inside-avoid">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-sans">
                        TRAMO {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                        CLASE {seg.clase}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vuelo</span>
                          <span className="font-black text-sm text-zinc-900">
                            {getAirlineName(seg.aerolinea)} <span className="font-mono text-zinc-500 text-xs">({seg.aerolinea} {seg.numeroVuelo})</span>
                          </span>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 mx-2"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Origen</span>
                          <span className="font-black text-base text-zinc-900">{seg.origen}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-300 mx-1" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Destino</span>
                          <span className="font-black text-base text-zinc-900">{seg.destino}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-0.5">Fecha y Hora de Salida</span>
                        <span className="font-bold text-sm text-zinc-800 block">
                          {formatGDSDate(seg.fecha)} · {seg.horaSalida}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Instructions */}
            <div className="bg-zinc-50 border border-zinc-150 rounded p-4 text-[10px] text-zinc-650 font-semibold space-y-2 font-sans mt-8 break-inside-avoid print:break-inside-avoid">
              <span className="text-[9px] font-black text-zinc-800 uppercase tracking-wider block mb-2 border-b border-zinc-200 pb-1">Instrucciones Importantes</span>
              <ul className="list-disc pl-4 space-y-1 text-zinc-600">
                <li>Preséntese en el mostrador de la aerolínea con <strong>al menos 3 horas de antelación</strong> para vuelos internacionales y 2 horas para vuelos domésticos.</li>
                <li>Los mostradores cierran 60 minutos antes de la salida programada del vuelo.</li>
                <li>Verifique los requisitos migratorios, sanitarios y de visado correspondientes a su destino final y puntos de tránsito antes de su viaje.</li>
                <li>La franquicia de equipaje y condiciones de penalidad están determinadas estrictamente por la política de la clase tarifaria adquirida. Consulte a su agente para más detalles.</li>
              </ul>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-8 pt-6 border-t border-zinc-200 text-center text-[9px] font-medium text-zinc-400 font-sans break-inside-avoid print:break-inside-avoid">
              <p>Este boleto electrónico es emitido bajo las condiciones generales de transporte de la aerolínea operadora. {companyConfig.name} opera únicamente como consolidador intermedio y no asume responsabilidad directa por reprogramaciones, cancelaciones o demoras operativas imputables a la aerolínea.</p>
              <p className="mt-1">{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address} | Email: {companyConfig.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

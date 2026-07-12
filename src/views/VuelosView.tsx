import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  XCircle,
  RefreshCw
} from "lucide-react";
import type { FlightLeg, B2BClient, DirectClient, CompanyConfig, PayableObligation, FinancialInvoice, PaymentVoucher } from "../types";
import { nextSequentialId } from "../lib/idGenerator";
import { ProjectView } from "../types";
import type { FlightTicket, Passenger, FlightSegment } from "../types/aereos";
import { AccionPermiso } from "../types/usuarios";
import { usePermissions } from "../hooks/usePermissions";
import { TaxJurisdiction, DEFAULT_JURISDICTION, formatCurrency, formatDualCurrency } from "../lib/taxEngine";
import { parseGDS, buildRoute, formatGDSDate, SAMPLE_GDS_TEXT } from "../lib/parsers/pnrParser";
import { useDialog } from "../components/ui/DialogProvider";
import Button from "../components/ui/Button";

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
  onAddBoleto: (boleto: FlightTicket) => Promise<FlightTicket | void> | void;
  onUpdateBoleto: (boleto: FlightTicket) => void;
  onDeleteBoleto: (id: string) => void;
  clients?: B2BClient[];
  directClients?: DirectClient[];
  payableObligations?: PayableObligation[];
  onAddObligation?: (o: PayableObligation) => void;
  onUpdateObligation?: (o: PayableObligation) => void;
  invoices?: FinancialInvoice[];
  onAddInvoice?: (inv: FinancialInvoice) => void;
  vouchers?: PaymentVoucher[];
  onUpdateClient?: (c: B2BClient) => void;
  onUpdateDirectClient?: (c: DirectClient) => void;
  companyConfig: CompanyConfig;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}

type SubView = "listado" | "nuevo" | "expediente";

// Parsea el time limit ("dd/mm/yyyy hh:mm" o "dd/mm/yyyy") a Date, o null.
function parseTimeLimitDate(tl?: string): Date | null {
  if (!tl) return null;
  const m = tl.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] ?? "23"), Number(m[5] ?? "59"));
  return isNaN(d.getTime()) ? null : d;
}

// Nivel de alerta del time limit de emisión: "vencido" | "proximo" (<48h) | null.
function timeLimitLevel(tl?: string): "vencido" | "proximo" | null {
  const d = parseTimeLimitDate(tl);
  if (!d) return null;
  const hrs = (d.getTime() - Date.now()) / 3600000;
  if (hrs < 0) return "vencido";
  if (hrs < 48) return "proximo";
  return null;
}

// ─── HELPERS UI ───────────────────────────────────────────────────────────────

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "muted" | "danger";
}) {
  const cls = {
    default: "bg-zinc-100 text-zinc-700 border-zinc-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    muted: "bg-zinc-50 text-zinc-400 border-zinc-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

// ─── VISTA PRINCIPAL ──────────────────────────────────────────────────────────

export default function VuelosView({ flights: _flights, boletos, onAddBoleto, onUpdateBoleto, onDeleteBoleto, clients = [], directClients = [], payableObligations = [], onAddObligation, onUpdateObligation, invoices = [], onAddInvoice, vouchers = [], onUpdateClient, onUpdateDirectClient, companyConfig, jurisdiction, currentExchangeRate }: VuelosViewProps) {
  const jur = jurisdiction ?? DEFAULT_JURISDICTION;
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
          jurisdiction={jur}
          currentExchangeRate={currentExchangeRate}
        />
      ) : subView === "nuevo" ? (
        <NuevoBoletoView
          onGuardar={async (boleto) => {
            // Tras guardar, abrir el expediente aéreo recién creado (no volver al listado).
            const created = await onAddBoleto(boleto);
            if (created && created.id) {
              setSelectedBoletoId(created.id);
              setSubView("expediente");
            } else {
              setSubView("listado");
            }
          }}
          onCancelar={() => setSubView("listado")}
        />
      ) : boletos.find((b) => b.id === selectedBoletoId) ? (
        <ExpedienteAereoView
          boleto={boletos.find((b) => b.id === selectedBoletoId)!}
          allBoletos={boletos}
          clients={clients}
          directClients={directClients}
          payableObligations={payableObligations}
          onAddObligation={onAddObligation}
          onUpdateObligation={onUpdateObligation}
          invoices={invoices}
          onAddInvoice={onAddInvoice}
          vouchers={vouchers}
          onUpdateClient={onUpdateClient}
          onUpdateDirectClient={onUpdateDirectClient}
          onBack={() => setSubView("listado")}
          onUpdateBoleto={(updated) => {
            onUpdateBoleto(updated);
          }}
          onShowVoucher={handleOpenVoucher}
          companyConfig={companyConfig}
          jurisdiction={jur}
          currentExchangeRate={currentExchangeRate}
        />
      ) : (
        <div className="p-8 text-center text-zinc-400 text-sm font-semibold">
          Boleto no encontrado. <button className="underline text-zinc-700" onClick={() => setSubView("listado")}>Volver al listado</button>
        </div>
      )}

      {/* MODAL DE VOUCHER DE VUELO */}
      {showVoucherModal && activeVoucherBoleto && (
        <FlightVoucherModal
          boleto={activeVoucherBoleto}
          onClose={() => setShowVoucherModal(false)}
          companyConfig={companyConfig}
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
  jurisdiction,
  currentExchangeRate,
}: {
  boletos: FlightTicket[];
  search: string;
  setSearch: (v: string) => void;
  onNuevo: () => void;
  onExpediente: (id: string) => void;
  onToggleVinculo: (id: string) => void;
  onEliminar: (id: string) => void;
  onShowVoucher: (boleto: FlightTicket) => void;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}) {
  const jur = jurisdiction ?? DEFAULT_JURISDICTION;
  const [activeTab, setActiveTab] = useState<"Activos" | "Anulados">("Activos");
  const { showConfirm } = useDialog();
  const { puede } = usePermissions();

  const filtered = boletos.filter((b) => {
    // filter tab
    const isAnulado = b.expedienteAereo?.status === "Anulado";
    if (activeTab === "Activos" && isAnulado) return false;
    if (activeTab === "Anulados" && !isAnulado) return false;

    // filter search
    const q = search.toLowerCase();
    const paxNames = (b.pasajeros?.map ? b.pasajeros : []).map((p) => (p?.nombre || "").toLowerCase()).join(" ");
    const ruta = buildRoute(b.segmentos?.map ? b.segmentos : []).toLowerCase();
    const expId = (b.expedienteAereo?.id || "").toLowerCase();
    return (b.pnr || "").toLowerCase().includes(q) || paxNames.includes(q) || ruta.includes(q) || expId.includes(q);
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
        <Button id="btn-nuevo-boleto" onClick={onNuevo}>
          <Plus className="w-4 h-4" />
          Cargar PNR
        </Button>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("Activos")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "Activos"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Activos ({boletos.filter((b) => b.expedienteAereo?.status !== "Anulado").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("Anulados")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "Anulados"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
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
          placeholder="Buscar por PNR, expediente (AER-), pasajero o ruta..."
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
        <div className="bg-white border border-zinc-200 rounded overflow-x-auto">
          {/* Header tabla */}
          <div className="grid grid-cols-8 gap-2 px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider min-w-[900px]">
            <div className="col-span-1">Expediente</div>
            <div className="col-span-1">PNR</div>
            <div className="col-span-1">Pasajeros</div>
            <div className="col-span-1">Ruta</div>
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
                className="grid grid-cols-8 gap-2 px-5 py-3.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors items-center cursor-pointer min-w-[900px]"
              >
                {/* Expediente (AER- + RES- si está vinculado a una reserva) */}
                <div className="col-span-1 space-y-1">
                  {boleto.expedienteAereo?.id ? (
                    <span className="w-fit font-mono text-[10.5px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded tracking-wide inline-block">
                      {boleto.expedienteAereo.id}
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-zinc-300 font-semibold italic">Sin exped.</span>
                  )}
                  {boleto.expedienteId && (
                    <span className="w-fit font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-0.5">
                      <Link2 className="w-2.5 h-2.5" /> {boleto.expedienteId}
                    </span>
                  )}
                </div>

                {/* PNR */}
                <div className="col-span-1">
                  <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 inline-block">
                    {boleto.pnr}
                  </span>
                </div>

                {/* Pasajeros */}
                <div className="col-span-1">
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
                <div className="col-span-1">
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
                    {formatDualCurrency(boleto.precioVenta || 0, jur, currentExchangeRate)}
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
                    {boleto.expedienteAereo?.status === "Borrador" && boleto.expedienteAereo.facturacionRechazoMotivo && (
                      <div className="block">
                        <Badge variant="danger">Rechazado</Badge>
                      </div>
                    )}
                    {/* Alerta de time limit de emisión (solo si aún no se facturó) */}
                    {(!boleto.expedienteAereo || boleto.expedienteAereo.status === "Borrador" || boleto.expedienteAereo.status === "Solicitado") && (() => {
                      const lvl = timeLimitLevel(boleto.timeLimit);
                      if (!lvl) return null;
                      return (
                        <div className="block">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${lvl === "vencido" ? "bg-red-50 border-red-200 text-red-700 animate-pulse" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                            {lvl === "vencido" ? "⏱ TL vencido" : `⏱ Emitir: ${boleto.timeLimit}`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Acciones */}
                <div className="col-span-1 flex items-center justify-end gap-1 flex-wrap">
                  {(boleto.expedienteAereo?.status === "Facturado" || boleto.expedienteAereo?.status === "PagadoAerolinea" || boleto.expedienteAereo?.status === "Reembolsado") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowVoucher(boleto);
                      }}
                      title="Descargar Voucher / Constancia"
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
                  {puede(ProjectView.VUELOS, AccionPermiso.ELIMINAR) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm({
                          title: "Eliminar Boleto",
                          message: `¿Estás seguro que deseas eliminar el boleto ${boleto.pnr}? Esta acción no se puede deshacer.`,
                          type: "danger",
                          confirmText: "Eliminar",
                          requireInputToConfirm: boleto.pnr,
                          onConfirm: () => onEliminar(boleto.id)
                        });
                      }}
                      title="Eliminar Boleto"
                      className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

  // ─ Datos de emisión (Fase 2) ───────────────────────────────────────────────
  const [timeLimit, setTimeLimit] = useState("");
  const [ticketNumero, setTicketNumero] = useState("");
  const [aerolineaValidadora, setAerolineaValidadora] = useState("");
  const [tarifaBase, setTarifaBase] = useState<number | undefined>(undefined);
  const [impuestos, setImpuestos] = useState<{ codigo: string; monto: number }[] | undefined>(undefined);
  const [preciosPorPax, setPreciosPorPax] = useState(false);

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
      // Campos comerciales detectados en el PNR
      if (result.data.timeLimit) setTimeLimit(result.data.timeLimit);
      if (result.data.ticketNumero) setTicketNumero(result.data.ticketNumero);
      if (result.data.tarifaBase != null) setTarifaBase(result.data.tarifaBase);
      if (result.data.impuestos) setImpuestos(result.data.impuestos);
      // Prefill del costo neto = tarifa base + impuestos, si se detectaron.
      if (result.data.tarifaBase != null) {
        const tot = result.data.tarifaBase + (result.data.impuestos || []).reduce((s, i) => s + i.monto, 0);
        if (tot > 0) { setCostoNetoInput(tot.toFixed(2)); setBaseCalculo("NETO"); }
      }
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
    setTimeLimit("");
    setTicketNumero("");
    setAerolineaValidadora("");
    setTarifaBase(undefined);
    setImpuestos(undefined);
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

  // Desglose por pasajero (ADT/CHD/INF): cuando está activo, el neto y el PVP totales
  // se derivan de la suma de cada pasajero.
  const sumaNetoPax = pasajeros.reduce((s, p) => s + (p.costoNeto || 0), 0);
  const sumaVentaPax = pasajeros.reduce((s, p) => s + (p.precioVenta || 0), 0);
  const pvpFinal = preciosPorPax ? sumaVentaPax : (parseFloat(precioPvp) || 0);
  const costoNetoFinal = preciosPorPax ? sumaNetoPax : (parseFloat(costoNetoInput) || 0);
  
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
        // Final sequential id assigned by handleAddBoleto in App.tsx, which has visibility over
        // all existing boletos; this placeholder is only used transiently before that override.
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
        ticketNumero: ticketNumero.trim() || undefined,
        aerolineaValidadora: aerolineaValidadora.trim() || undefined,
        timeLimit: timeLimit.trim() || undefined,
        tarifaBase,
        impuestos,
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
        <Button id="btn-volver-listado" variant="ghost" size="sm" onClick={onCancelar}>
          <ChevronLeft className="w-4 h-4" />
          Volver al listado
        </Button>
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

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
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
                  <Button id="btn-load-sample" variant="ghost" size="sm" onClick={handleLoadSample} className="uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    Cargar Ejemplo
                  </Button>
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
                  <Button
                    id="btn-analizar-pnr"
                    variant="success"
                    onClick={handleAnalizar}
                    disabled={!rawText.trim() || isParsing}
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
                  </Button>
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
                <Button
                  onClick={() => {
                    if (!manualPaxNombre.trim()) return;
                    setPasajeros(prev => [...prev, { nombre: manualPaxNombre.trim(), tipo: manualPaxTipo, documento: manualPaxDoc.trim() || undefined }]);
                    setManualPaxNombre("");
                    setManualPaxDoc("");
                  }}
                  disabled={!manualPaxNombre.trim()}
                  className="w-full"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Pasajero
                </Button>
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
                          {p.ticketNumero && (
                            <span className="block text-[9px] font-semibold text-zinc-400 mt-0.5">E-ticket: {p.ticketNumero}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              p.tipo === "CHD" || p.tipo === "INF"
                                ? "info"
                                : p.tipo === "SRC"
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
                      {preciosPorPax && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-0.5">Neto pax</label>
                            <input type="number" step="0.01" placeholder="0.00" value={p.costoNeto ?? ""}
                              onChange={(e) => { const v = parseFloat(e.target.value); setPasajeros(prev => { const arr = [...prev]; arr[i] = { ...arr[i], costoNeto: isNaN(v) ? undefined : v }; return arr; }); }}
                              className="w-full px-2 py-1 border border-zinc-200 rounded text-xs font-mono text-right focus:outline-none focus:border-zinc-500" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-0.5">Venta pax (PVP)</label>
                            <input type="number" step="0.01" placeholder="0.00" value={p.precioVenta ?? ""}
                              onChange={(e) => { const v = parseFloat(e.target.value); setPasajeros(prev => { const arr = [...prev]; arr[i] = { ...arr[i], precioVenta: isNaN(v) ? undefined : v }; return arr; }); }}
                              className="w-full px-2 py-1 border border-zinc-200 rounded text-xs font-mono text-right focus:outline-none focus:border-zinc-500" />
                          </div>
                        </div>
                      )}
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
                  <Button
                    size="sm"
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
                    className="w-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Tramo
                  </Button>
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

          {/* Datos de emisión — time limit (TAW), e-ticket, aerolínea validadora */}
          <div className="bg-white border border-zinc-200 rounded overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-3.5 h-3.5 text-zinc-400" /> Datos de Emisión
                <span className="text-[9px] text-zinc-400 normal-case tracking-normal font-medium">(se autocompletan del PNR si aparecen)</span>
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Time limit de emisión (TAW)</label>
                <input type="text" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                  placeholder="Ej: 12/11/2026 18:00"
                  className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold text-zinc-900 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Nº de e-ticket</label>
                <input type="text" value={ticketNumero} onChange={e => setTicketNumero(e.target.value)}
                  placeholder="Ej: 045-2345678901"
                  className="w-full p-2 border border-zinc-200 rounded text-xs font-mono font-semibold text-zinc-900 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Aerolínea validadora</label>
                <input type="text" value={aerolineaValidadora} onChange={e => setAerolineaValidadora(e.target.value)}
                  placeholder="Ej: COPA AIRLINES"
                  className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold text-zinc-900 focus:outline-none" />
              </div>
            </div>
            {(tarifaBase != null || (impuestos && impuestos.length > 0)) && (
              <div className="px-4 pb-4">
                <div className="bg-zinc-50 border border-zinc-100 rounded p-3 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-zinc-600"><span>Tarifa base</span><span>${(tarifaBase ?? 0).toFixed(2)}</span></div>
                  {(impuestos || []).map((imp, i) => (
                    <div key={i} className="flex justify-between text-zinc-500"><span>Impuesto {imp.codigo}</span><span>+${imp.monto.toFixed(2)}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-zinc-800 border-t border-zinc-200 pt-1">
                    <span>Neto (tarifa + impuestos)</span>
                    <span>${((tarifaBase ?? 0) + (impuestos || []).reduce((s, i) => s + i.monto, 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
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
                <button
                  type="button"
                  onClick={() => setPreciosPorPax(v => !v)}
                  title="Cobrar tarifas distintas por ADT/CHD/INF (el neto y PVP totales se suman del desglose por pasajero)"
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${preciosPorPax ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-700"}`}
                >
                  Precio por pasajero
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {preciosPorPax && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-[10.5px] text-blue-800 font-semibold">
                  Modo desglose por pasajero activo: el neto y el PVP totales se calculan sumando lo ingresado en cada pasajero (columna izquierda).
                </div>
              )}
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
                      value={preciosPorPax ? sumaNetoPax.toFixed(2) : costoNetoInput}
                      onChange={(e) => handleCostoNetoChange(e.target.value)}
                      disabled={preciosPorPax}
                      placeholder="0.00"
                      className={`w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 ${preciosPorPax ? "bg-zinc-100 text-zinc-500" : "bg-white"}`}
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
                      value={preciosPorPax ? sumaVentaPax.toFixed(2) : precioPvp}
                      onChange={(e) => handlePvpChange(e.target.value)}
                      disabled={preciosPorPax}
                      placeholder="0.00"
                      className={`w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 ${preciosPorPax ? "bg-zinc-100 text-zinc-500" : "bg-white"}`}
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
            <Button id="btn-cancelar-boleto" variant="secondary" size="lg" onClick={onCancelar} className="flex-1">
              Cancelar
            </Button>
            <Button
              id="btn-guardar-boleto"
              size="lg"
              onClick={handleGuardar}
              disabled={!canGuardar || guardando}
              className="flex-1"
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
            </Button>
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
  allBoletos,
  clients,
  directClients,
  payableObligations,
  onAddObligation,
  onUpdateObligation,
  invoices,
  onAddInvoice,
  vouchers,
  onUpdateClient,
  onUpdateDirectClient,
  onBack,
  onUpdateBoleto,
  onShowVoucher,
  companyConfig,
  jurisdiction,
  currentExchangeRate,
}: {
  boleto: FlightTicket;
  allBoletos: FlightTicket[];
  clients: B2BClient[];
  directClients: DirectClient[];
  payableObligations: PayableObligation[];
  onAddObligation?: (o: PayableObligation) => void;
  onUpdateObligation?: (o: PayableObligation) => void;
  invoices?: FinancialInvoice[];
  onAddInvoice?: (inv: FinancialInvoice) => void;
  vouchers?: PaymentVoucher[];
  onUpdateClient?: (c: B2BClient) => void;
  onUpdateDirectClient?: (c: DirectClient) => void;
  companyConfig: CompanyConfig;
  onBack: () => void;
  onUpdateBoleto: (boleto: FlightTicket) => void;
  onShowVoucher: (boleto: FlightTicket) => void;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}) {
  const jur = jurisdiction ?? DEFAULT_JURISDICTION;
  const { showAlert, showConfirm } = useDialog();
  // Inicializamos el expediente aéreo si no existe
  const [expediente, setExpediente] = useState(
    boleto.expedienteAereo || {
      // ID secuencial AER-1, AER-2, … a partir de los expedientes ya existentes en los boletos.
      id: nextSequentialId("AER", allBoletos.map(b => b.expedienteAereo?.id)),
      status: "Borrador" as const,
      titular: boleto.pasajeros[0]?.nombre || "",
      createdAt: new Date().toISOString(),
    }
  );

  // Lista unificada de clientes facturables: agencias B2B + clientes directos.
  type ClienteFacturable = { id: string; nombre: string; doc: string; email: string; tipoLabel: string; isCredit: boolean; kind: "B2B" | "Directo" };
  const clientesFacturables = React.useMemo<ClienteFacturable[]>(() => [
    ...clients.map(c => ({ id: c.id, nombre: c.nombre, doc: c.rif, email: c.email || "", tipoLabel: `B2B · ${c.tipo}`, isCredit: c.tipo === "A Crédito", kind: "B2B" as const })),
    ...directClients.map(c => ({ id: c.id, nombre: c.nombre, doc: c.cedula || "—", email: c.email || "", tipoLabel: c.tipo === "A Crédito" ? "Directo · Crédito" : "Directo · Contado", isCredit: c.tipo === "A Crédito", kind: "Directo" as const })),
  ], [clients, directClients]);

  const primerSeg = boleto.segmentos[0];
  const ultimoSeg = boleto.segmentos[boleto.segmentos.length - 1];

  const [agencySearch, setAgencySearch] = useState(expediente.clienteB2BNombre || expediente.clienteDirectoNombre || "");
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);

  const clienteSeleccionadoId = expediente.clienteB2BId || expediente.clienteDirectoId;

  const handleSave = () => {
    onUpdateBoleto({ ...boleto, expedienteAereo: expediente });
  };

  const handleSendToBilling = () => {
    // Al re-enviar se limpia cualquier rechazo previo (motivo/archivos).
    const updated = { ...expediente, status: "Solicitado" as const, facturacionRechazoMotivo: undefined, facturacionRechazoArchivos: undefined };
    setExpediente(updated);
    onUpdateBoleto({ ...boleto, expedienteAereo: updated });
    showAlert({ title: "Éxito", message: "Expediente enviado a facturación exitosamente.", type: "success" });
  };

  // ── Reembolso / anulación con penalidad (post-venta) ──
  const [showReembolso, setShowReembolso] = useState(false);
  const [reembolsoForm, setReembolsoForm] = useState({ penalidad: "", motivo: "" });

  const handleReembolso = (e: React.FormEvent) => {
    e.preventDefault();
    const venta = boleto.precioVenta || 0;
    const penalidad = Math.max(0, parseFloat(reembolsoForm.penalidad) || 0);
    const montoNC = Math.max(0, venta - penalidad); // valor de la nota de crédito: revierte la venta reteniendo la penalidad

    const cliB2B = expediente.clienteB2BId ? clients.find(c => c.id === expediente.clienteB2BId) : undefined;
    const cliDir = expediente.clienteDirectoId ? directClients.find(c => c.id === expediente.clienteDirectoId) : undefined;
    const cliId = cliB2B?.id || cliDir?.id;
    const cliNombre = cliB2B?.nombre || cliDir?.nombre || expediente.titular;

    // Lo que el cliente REALMENTE pagó por este expediente (no la venta total):
    //  · Contado → se pagó completo al facturar (= venta).
    //  · Crédito → suma de comprobantes cobrados (vouchers con locatorId = AER-x, verificados).
    const voucherPaid = (vouchers || [])
      .filter(v => v.locatorId === expediente.id && v.status === "Verificado")
      .reduce((s, v) => s + (v.amount || 0), 0);
    const totalPagado = expediente.facturacionTipo === "Pago Contado" ? venta : voucherPaid;
    const outstanding = Math.max(0, venta - totalPagado); // deuda pendiente del expediente que se cancela
    const netCliente = totalPagado - penalidad;           // >0 → devolver a favor · <0 → aún debe la penalidad
    const saldoFavorGenerado = Math.max(0, netCliente);

    // 1. Nota de crédito al cliente (revierte la venta menos la penalidad retenida).
    let ncId: string | undefined;
    if (onAddInvoice && montoNC > 0) {
      ncId = nextSequentialId("NC", (invoices || []).map(i => i.id));
      onAddInvoice({
        id: ncId,
        clientName: `${cliNombre} - Localizador ${expediente.id} · Boleto ${boleto.pnr} (Nota de Crédito por reembolso aéreo${reembolsoForm.motivo ? ": " + reembolsoForm.motivo.trim() : ""})`,
        clientId: cliId,
        reservationId: expediente.id,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        // Convención del sistema: las notas de crédito llevan monto NEGATIVO (igual que
        // FacturacionView) para que reduzcan correctamente los totales del cliente.
        amount: -montoNC,
        vatAmount: 0,
        type: "Cobro",
        status: "Pagado",
      } as FinancialInvoice);
    }

    // 2. Ajustar saldo del cliente CORRECTAMENTE (basado en lo pagado, no en la venta):
    //    · se cancela la deuda pendiente del expediente (outstanding);
    //    · si pagó MÁS que la penalidad → el excedente va a saldo a favor;
    //    · si pagó MENOS que la penalidad → aún debe la diferencia (saldoDeber).
    //    Robusto aunque saldoDeber esté desincronizado (el cobro de crédito viene por vouchers).
    if (cliB2B && onUpdateClient) {
      const nuevoDeber = Math.max(0, (cliB2B.saldoDeber || 0) - outstanding) + (netCliente < 0 ? -netCliente : 0);
      onUpdateClient({ ...cliB2B, saldoDeber: nuevoDeber, saldoFavor: (cliB2B.saldoFavor || 0) + saldoFavorGenerado });
    } else if (cliDir && onUpdateDirectClient) {
      const nuevoDeber = Math.max(0, (cliDir.saldoDeber || 0) - outstanding) + (netCliente < 0 ? -netCliente : 0);
      onUpdateDirectClient({ ...cliDir, saldoDeber: nuevoDeber, saldoFavor: (cliDir.saldoFavor || 0) + saldoFavorGenerado });
    }

    // 3. Congelar la obligación a la aerolínea (reclamar reembolso / no pagar).
    const obl = (payableObligations || []).find(o => o.locatorId === boleto.id);
    if (obl && onUpdateObligation) {
      onUpdateObligation({ ...obl, status: "Congelado", isFrozen: true, notes: `${obl.notes || ""}\n[Bloqueado] Boleto reembolsado — reclamar reembolso a la aerolínea.` });
    }

    // 4. Cerrar el expediente como Reembolsado.
    const updated = { ...expediente, status: "Reembolsado" as const, reembolso: { fecha: new Date().toISOString(), penalidad, montoReembolsado: montoNC, notaCreditoId: ncId, motivo: reembolsoForm.motivo.trim() || undefined } };
    setExpediente(updated);
    onUpdateBoleto({ ...boleto, expedienteAereo: updated });
    setShowReembolso(false);
    const saldoMsg = saldoFavorGenerado > 0
      ? `Se generó ${formatCurrency(saldoFavorGenerado, "USD")} de saldo a favor al cliente (pagó ${formatCurrency(totalPagado, "USD")}, penalidad ${formatCurrency(penalidad, "USD")}).`
      : netCliente < 0
      ? `El cliente aún debe ${formatCurrency(-netCliente, "USD")} de penalidad (pagó ${formatCurrency(totalPagado, "USD")} de ${formatCurrency(penalidad, "USD")}).`
      : `Sin saldo a favor: lo pagado cubrió exactamente la penalidad.`;
    showAlert({ title: "Reembolso procesado", message: `Nota de crédito emitida por ${formatCurrency(montoNC, "USD")}. ${saldoMsg} La obligación a la aerolínea quedó congelada para reclamo.`, type: "success" });
  };

  // ── Reemisión (reissue): cambio con diferencia de tarifa + penalidad ──
  const [showReemision, setShowReemision] = useState(false);
  const [reemisionForm, setReemisionForm] = useState({ adc: "", penalidad: "", nuevoTicket: "", motivo: "" });

  const handleReemision = (e: React.FormEvent) => {
    e.preventDefault();
    const adc = Math.max(0, parseFloat(reemisionForm.adc) || 0);          // diferencia de tarifa
    const penalidad = Math.max(0, parseFloat(reemisionForm.penalidad) || 0);
    const total = adc + penalidad;
    if (total <= 0) { showAlert({ title: "Nada que cobrar", message: "Ingresa la diferencia de tarifa y/o la penalidad de cambio.", type: "warning" }); return; }

    const cliB2B = expediente.clienteB2BId ? clients.find(c => c.id === expediente.clienteB2BId) : undefined;
    const cliDir = expediente.clienteDirectoId ? directClients.find(c => c.id === expediente.clienteDirectoId) : undefined;
    const cliId = cliB2B?.id || cliDir?.id;
    const cliNombre = cliB2B?.nombre || cliDir?.nombre || expediente.titular;

    // 1. Factura al cliente por la reemisión (ADC + penalidad).
    let facId: string | undefined;
    if (onAddInvoice) {
      facId = nextSequentialId("FAC", (invoices || []).map(i => i.id));
      onAddInvoice({
        id: facId,
        clientName: `${cliNombre} - Localizador ${expediente.id} · Boleto ${boleto.pnr} (Reemisión: dif. tarifa + penalidad${reemisionForm.motivo ? " · " + reemisionForm.motivo.trim() : ""})`,
        clientId: cliId,
        reservationId: expediente.id,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        amount: total,
        vatAmount: 0,
        type: "Cobro",
        status: "Facturado",
      } as FinancialInvoice);
    }

    // 2. Cargar la deuda del cliente por el total de la reemisión.
    if (cliB2B && onUpdateClient) onUpdateClient({ ...cliB2B, saldoDeber: (cliB2B.saldoDeber || 0) + total });
    else if (cliDir && onUpdateDirectClient) onUpdateDirectClient({ ...cliDir, saldoDeber: (cliDir.saldoDeber || 0) + total });

    // 3. Incrementar la obligación a la aerolínea por el total (se debe pagar la reemisión).
    const obl = (payableObligations || []).find(o => o.locatorId === boleto.id);
    if (obl && onUpdateObligation) {
      const newNet = obl.netCost + total;
      onUpdateObligation({ ...obl, netCost: newNet, isFrozen: false, status: obl.paidAmount >= newNet ? "Pagado Total" : obl.paidAmount > 0 ? "Pagado Parcial" : "Pendiente" });
    }

    // 4. Actualizar el boleto: costo y venta suben por la reemisión; nuevo e-ticket si aplica.
    const nb: FlightTicket = {
      ...boleto,
      costoNeto: (boleto.costoNeto || 0) + total,
      precioVenta: (boleto.precioVenta || 0) + total,
      ticketNumero: reemisionForm.nuevoTicket.trim() || boleto.ticketNumero,
    };

    // 5. Registrar la reemisión y re-facturar el expediente.
    const reem = { fecha: new Date().toISOString(), diferenciaTarifa: adc, penalidad, totalCobrado: total, nuevoTicket: reemisionForm.nuevoTicket.trim() || undefined, facturaId: facId, motivo: reemisionForm.motivo.trim() || undefined };
    const updated = { ...expediente, status: "Facturado" as const, reemisiones: [...(expediente.reemisiones || []), reem] };
    setExpediente(updated);
    onUpdateBoleto({ ...nb, expedienteAereo: updated });
    setShowReemision(false);
    showAlert({ title: "Reemisión procesada", message: `Se cobró ${formatCurrency(total, "USD")} al cliente (dif. tarifa ${formatCurrency(adc, "USD")} + penalidad ${formatCurrency(penalidad, "USD")}) y se ajustó la cuenta por pagar a la aerolínea.`, type: "success" });
  };

  // ── EMD: servicios/ancillaries (equipaje, asiento, etc.) sobre el boleto ──
  const [showEmd, setShowEmd] = useState(false);
  const [emdForm, setEmdForm] = useState({ concepto: "Equipaje adicional", montoVenta: "", costoNeto: "", notas: "" });

  // Liquidación al cliente (documento financiero imprimible).
  const [showLiquidacion, setShowLiquidacion] = useState(false);
  const liqCliente = expediente.clienteB2BId
    ? (() => { const c = clients.find(x => x.id === expediente.clienteB2BId); return c ? { nombre: c.nombre, doc: c.rif, tipo: "Agencia B2B" } : undefined; })()
    : expediente.clienteDirectoId
    ? (() => { const c = directClients.find(x => x.id === expediente.clienteDirectoId); return c ? { nombre: c.nombre, doc: c.cedula, tipo: "Cliente Directo" } : undefined; })()
    : undefined;

  const handleEmd = (e: React.FormEvent) => {
    e.preventDefault();
    const montoVenta = Math.max(0, parseFloat(emdForm.montoVenta) || 0);
    const costoNeto = Math.max(0, parseFloat(emdForm.costoNeto) || 0);
    if (montoVenta <= 0) { showAlert({ title: "Monto inválido", message: "Ingresa el monto de venta del EMD.", type: "warning" }); return; }

    const cliB2B = expediente.clienteB2BId ? clients.find(c => c.id === expediente.clienteB2BId) : undefined;
    const cliDir = expediente.clienteDirectoId ? directClients.find(c => c.id === expediente.clienteDirectoId) : undefined;
    const cliId = cliB2B?.id || cliDir?.id;
    const cliNombre = cliB2B?.nombre || cliDir?.nombre || expediente.titular;

    // 1. Factura al cliente por el EMD (monto de venta).
    let facId: string | undefined;
    if (onAddInvoice) {
      facId = nextSequentialId("FAC", (invoices || []).map(i => i.id));
      onAddInvoice({
        id: facId,
        clientName: `${cliNombre} - Localizador ${expediente.id} · Boleto ${boleto.pnr} (EMD: ${emdForm.concepto})`,
        clientId: cliId,
        reservationId: expediente.id,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        amount: montoVenta,
        vatAmount: 0,
        type: "Cobro",
        status: "Facturado",
      } as FinancialInvoice);
    }

    // 2. Cargar la deuda del cliente por el monto de venta.
    if (cliB2B && onUpdateClient) onUpdateClient({ ...cliB2B, saldoDeber: (cliB2B.saldoDeber || 0) + montoVenta });
    else if (cliDir && onUpdateDirectClient) onUpdateDirectClient({ ...cliDir, saldoDeber: (cliDir.saldoDeber || 0) + montoVenta });

    // 3. Sumar el costo neto a la obligación con la aerolínea (si hay costo).
    if (costoNeto > 0) {
      const obl = (payableObligations || []).find(o => o.locatorId === boleto.id);
      if (obl && onUpdateObligation) {
        const newNet = obl.netCost + costoNeto;
        onUpdateObligation({ ...obl, netCost: newNet, isFrozen: false, status: obl.paidAmount >= newNet ? "Pagado Total" : obl.paidAmount > 0 ? "Pagado Parcial" : "Pendiente" });
      }
    }

    // 4. Actualizar el boleto y registrar el EMD en el expediente.
    const nb: FlightTicket = { ...boleto, costoNeto: (boleto.costoNeto || 0) + costoNeto, precioVenta: (boleto.precioVenta || 0) + montoVenta };
    const emd = { fecha: new Date().toISOString(), concepto: emdForm.concepto, montoVenta, costoNeto, facturaId: facId, notas: emdForm.notas.trim() || undefined };
    const updated = { ...expediente, emds: [...(expediente.emds || []), emd] };
    setExpediente(updated);
    onUpdateBoleto({ ...nb, expedienteAereo: updated });
    setShowEmd(false);
    showAlert({ title: "EMD emitido", message: `Se emitió el EMD "${emdForm.concepto}" y se cobró ${formatCurrency(montoVenta, "USD")} al cliente.`, type: "success" });
  };

  // Elegir/limpiar el cliente facturable (B2B o Directo), fijando el tipo de facturación.
  const seleccionarCliente = (c: ClienteFacturable) => {
    setAgencySearch(c.nombre);
    setExpediente(prev => ({
      ...prev,
      clienteB2BId: c.kind === "B2B" ? c.id : undefined,
      clienteB2BNombre: c.kind === "B2B" ? c.nombre : undefined,
      clienteDirectoId: c.kind === "Directo" ? c.id : undefined,
      clienteDirectoNombre: c.kind === "Directo" ? c.nombre : undefined,
      facturacionTipo: c.isCredit ? "Crédito" : "Pago Contado",
    }));
    setShowAgencyDropdown(false);
  };

  const limpiarCliente = () => {
    setAgencySearch("");
    setExpediente(prev => ({ ...prev, clienteB2BId: undefined, clienteB2BNombre: undefined, clienteDirectoId: undefined, clienteDirectoNombre: undefined, facturacionTipo: "Pago Contado" }));
  };

  const isCreditAgency = React.useMemo(() => {
    if (!clienteSeleccionadoId) return false;
    return clientesFacturables.find(c => c.id === clienteSeleccionadoId)?.isCredit ?? false;
  }, [clienteSeleccionadoId, clientesFacturables]);

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
            {boleto.expedienteId && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                <Link2 className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-bold text-blue-700">Venta vinculada a la reserva {boleto.expedienteId}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowLiquidacion(true)}>
            <FileText className="w-3.5 h-3.5" /> Liquidación
          </Button>
          {expediente.status === "Borrador" && !boleto.facturarConjunto && (
            <>
              <Button variant="secondary" size="sm" onClick={handleSave}>
                <Save className="w-3.5 h-3.5" /> Guardar Cambios
              </Button>
              <Button variant="info" size="sm" onClick={handleSendToBilling}>
                <Send className="w-3.5 h-3.5" /> Enviar a Facturar
              </Button>
              {expediente.status === "Borrador" && (
                <Button
                  variant="danger"
                  size="sm"
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
                >
                  <XCircle className="w-3.5 h-3.5" /> Anular
                </Button>
              )}
            </>
          )}
          {expediente.status === "Anulado" && !boleto.facturarConjunto && (
            <Button
              variant="warning"
              size="sm"
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
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Volver a Activar
            </Button>
          )}
          {(expediente.status === "Facturado" || expediente.status === "PagadoAerolinea") && (
            <>
              <Button variant="success" size="sm" onClick={() => onShowVoucher(boleto)}>
                <Download className="w-3.5 h-3.5" /> Descargar Voucher
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setEmdForm({ concepto: "Equipaje adicional", montoVenta: "", costoNeto: "", notas: "" }); setShowEmd(true); }}>
                <FileText className="w-3.5 h-3.5" /> EMD
              </Button>
              <Button variant="warning" size="sm" onClick={() => { setReemisionForm({ adc: "", penalidad: "", nuevoTicket: "", motivo: "" }); setShowReemision(true); }}>
                <RefreshCw className="w-3.5 h-3.5" /> Reemitir
              </Button>
              <Button variant="danger" size="sm" onClick={() => { setReembolsoForm({ penalidad: "", motivo: "" }); setShowReembolso(true); }}>
                <XCircle className="w-3.5 h-3.5" /> Reembolsar
              </Button>
            </>
          )}
          {expediente.status === "Reembolsado" && expediente.reembolso && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded">
                <Info className="w-3.5 h-3.5" />
                Reembolsado: {formatCurrency(expediente.reembolso.montoReembolsado, "USD")} · penalidad {formatCurrency(expediente.reembolso.penalidad, "USD")}
              </div>
              <Button variant="secondary" size="sm" onClick={() => onShowVoucher(boleto)}>
                <Download className="w-3.5 h-3.5" /> Constancia
              </Button>
            </>
          )}
          {expediente.status === "Borrador" && boleto.facturarConjunto && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded">
              <Info className="w-3.5 h-3.5" />
              Se facturará junto a la reserva {boleto.expedienteId}
            </div>
          )}
        </div>
      </div>

      {/* Banner de rechazo de facturación (motivo + adjuntos), igual que en Reservas */}
      {expediente.status === "Borrador" && expediente.facturacionRechazoMotivo && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-red-800 text-sm mb-0.5">Facturación rechazó esta solicitud</span>
              <p className="text-xs text-red-700 whitespace-pre-wrap">{expediente.facturacionRechazoMotivo || "Sin motivo especificado."}</p>
              {expediente.facturacionRechazoArchivos && (() => {
                let urls: string[] = [];
                try { urls = JSON.parse(expediente.facturacionRechazoArchivos); } catch { urls = []; }
                return urls.length > 0 ? (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-zinc-600">Adjuntos:</span>
                    {urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 underline hover:text-red-900">
                        <Download className="w-3 h-3" /> Soporte {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : null;
              })()}
              <p className="text-[10px] text-red-500 mt-2">Corrige lo indicado y vuelve a enviar a facturación.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REEMBOLSO / ANULACIÓN CON PENALIDAD ── */}
      {showReembolso && (() => {
        const venta = boleto.precioVenta || 0;
        const penalidad = Math.max(0, parseFloat(reembolsoForm.penalidad) || 0);
        const montoNC = Math.max(0, venta - penalidad);
        const voucherPaid = (vouchers || [])
          .filter(v => v.locatorId === expediente.id && v.status === "Verificado")
          .reduce((s, v) => s + (v.amount || 0), 0);
        const totalPagado = expediente.facturacionTipo === "Pago Contado" ? venta : voucherPaid;
        const netCliente = totalPagado - penalidad;
        const saldoFavor = Math.max(0, netCliente);
        const deudaResidual = Math.max(0, -netCliente);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans p-4">
            <form onSubmit={handleReembolso} className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Post-venta</span>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mt-0.5">
                    <XCircle className="w-4.5 h-4.5 text-red-400" /> Reembolso del boleto {boleto.pnr}
                  </h4>
                </div>
                <button type="button" onClick={() => setShowReembolso(false)} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4 text-left">
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-zinc-600"><span>Venta al cliente</span><span>{formatCurrency(venta, "USD")}</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Pagado por el cliente</span><span>{formatCurrency(totalPagado, "USD")}</span></div>
                  <div className="flex justify-between text-red-600"><span>Penalidad retenida</span><span>-{formatCurrency(penalidad, "USD")}</span></div>
                  <div className="flex justify-between text-zinc-500 border-t border-zinc-200 pt-1"><span>Nota de crédito (revierte venta)</span><span>-{formatCurrency(montoNC, "USD")}</span></div>
                  {saldoFavor > 0 && <div className="flex justify-between font-black text-emerald-700"><span>Saldo a favor al cliente</span><span>{formatCurrency(saldoFavor, "USD")}</span></div>}
                  {deudaResidual > 0 && <div className="flex justify-between font-black text-red-700"><span>Penalidad que aún debe</span><span>{formatCurrency(deudaResidual, "USD")}</span></div>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Penalidad de la aerolínea (USD)</label>
                  <input type="number" step="0.01" min="0" autoFocus value={reembolsoForm.penalidad}
                    onChange={e => setReembolsoForm(f => ({ ...f, penalidad: e.target.value }))}
                    placeholder="0.00"
                    className="w-full p-2 border border-zinc-200 rounded text-sm font-mono font-bold text-right focus:outline-none focus:border-zinc-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Motivo (opcional)</label>
                  <input type="text" value={reembolsoForm.motivo}
                    onChange={e => setReembolsoForm(f => ({ ...f, motivo: e.target.value }))}
                    placeholder="Ej: cancelación del pasajero"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold focus:outline-none focus:border-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug">Se emitirá una nota de crédito al cliente por el monto a reembolsar, se ajustará su saldo, y la cuenta por pagar a la aerolínea quedará <b>congelada</b> para reclamar el reembolso.</p>
              </div>
              <div className="border-t border-zinc-100 p-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReembolso(false)} className="px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md">Confirmar reembolso</button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── MODAL: REEMISIÓN (REISSUE) ── */}
      {showReemision && (() => {
        const adc = Math.max(0, parseFloat(reemisionForm.adc) || 0);
        const penalidad = Math.max(0, parseFloat(reemisionForm.penalidad) || 0);
        const total = adc + penalidad;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans p-4">
            <form onSubmit={handleReemision} className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Post-venta</span>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mt-0.5">
                    <RefreshCw className="w-4.5 h-4.5 text-amber-400" /> Reemisión del boleto {boleto.pnr}
                  </h4>
                </div>
                <button type="button" onClick={() => setShowReemision(false)} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Diferencia de tarifa (ADC)</label>
                    <input type="number" step="0.01" min="0" autoFocus value={reemisionForm.adc}
                      onChange={e => setReemisionForm(f => ({ ...f, adc: e.target.value }))}
                      placeholder="0.00"
                      className="w-full p-2 border border-zinc-200 rounded text-sm font-mono font-bold text-right focus:outline-none focus:border-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Penalidad de cambio</label>
                    <input type="number" step="0.01" min="0" value={reemisionForm.penalidad}
                      onChange={e => setReemisionForm(f => ({ ...f, penalidad: e.target.value }))}
                      placeholder="0.00"
                      className="w-full p-2 border border-zinc-200 rounded text-sm font-mono font-bold text-right focus:outline-none focus:border-zinc-500" />
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex justify-between items-center text-[11px] font-mono">
                  <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Total a cobrar al cliente</span>
                  <span className="font-black text-zinc-900 text-sm">{formatCurrency(total, "USD")}</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Nuevo nº de e-ticket (opcional)</label>
                  <input type="text" value={reemisionForm.nuevoTicket}
                    onChange={e => setReemisionForm(f => ({ ...f, nuevoTicket: e.target.value }))}
                    placeholder="Ej: 045-2345678902"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-mono font-semibold focus:outline-none focus:border-zinc-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Motivo (opcional)</label>
                  <input type="text" value={reemisionForm.motivo}
                    onChange={e => setReemisionForm(f => ({ ...f, motivo: e.target.value }))}
                    placeholder="Ej: cambio de fecha de regreso"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold focus:outline-none focus:border-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug">Se emitirá una factura al cliente por el total (dif. tarifa + penalidad), se sumará a su saldo y a la cuenta por pagar de la aerolínea. El boleto se re-factura conservando su historial de reemisiones.</p>
              </div>
              <div className="border-t border-zinc-100 p-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReemision(false)} className="px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md">Confirmar reemisión</button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── MODAL: EMD (SERVICIOS / ANCILLARIES) ── */}
      {showEmd && (() => {
        const venta = Math.max(0, parseFloat(emdForm.montoVenta) || 0);
        const neto = Math.max(0, parseFloat(emdForm.costoNeto) || 0);
        const margen = venta - neto;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans p-4">
            <form onSubmit={handleEmd} className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-zinc-950 text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Servicios / ancillaries</span>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 mt-0.5">
                    <FileText className="w-4.5 h-4.5 text-blue-400" /> EMD — Boleto {boleto.pnr}
                  </h4>
                </div>
                <button type="button" onClick={() => setShowEmd(false)} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Concepto</label>
                  <select value={emdForm.concepto} onChange={e => setEmdForm(f => ({ ...f, concepto: e.target.value }))}
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer">
                    <option>Equipaje adicional</option>
                    <option>Selección de asiento</option>
                    <option>Cargo por cambio</option>
                    <option>Upgrade de cabina</option>
                    <option>Otro servicio</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Venta (cliente)</label>
                    <input type="number" step="0.01" min="0" autoFocus value={emdForm.montoVenta}
                      onChange={e => setEmdForm(f => ({ ...f, montoVenta: e.target.value }))} placeholder="0.00"
                      className="w-full p-2 border border-zinc-200 rounded text-sm font-mono font-bold text-right focus:outline-none focus:border-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Neto (aerolínea)</label>
                    <input type="number" step="0.01" min="0" value={emdForm.costoNeto}
                      onChange={e => setEmdForm(f => ({ ...f, costoNeto: e.target.value }))} placeholder="0.00"
                      className="w-full p-2 border border-zinc-200 rounded text-sm font-mono font-bold text-right focus:outline-none focus:border-zinc-500" />
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex justify-between items-center text-[11px] font-mono">
                  <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Margen del EMD</span>
                  <span className={`font-black text-sm ${margen >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(margen, "USD")}</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Notas (opcional)</label>
                  <input type="text" value={emdForm.notas} onChange={e => setEmdForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Ej: 1 pieza extra 23kg" className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold focus:outline-none focus:border-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug">Se emite una factura al cliente por el monto de venta y, si hay costo neto, se suma a la cuenta por pagar de la aerolínea.</p>
              </div>
              <div className="border-t border-zinc-100 p-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEmd(false)} className="px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md">Emitir EMD</button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── MODAL: LIQUIDACIÓN AL CLIENTE ── */}
      {showLiquidacion && (
        <FlightLiquidacionModal
          boleto={{ ...boleto, expedienteAereo: expediente }}
          cliente={liqCliente}
          companyConfig={companyConfig}
          onClose={() => setShowLiquidacion(false)}
        />
      )}

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

              {(boleto.timeLimit || boleto.ticketNumero || boleto.aerolineaValidadora) && (
                <div className="border-t border-zinc-200 pt-3 space-y-2">
                  {boleto.timeLimit && (() => {
                    const lvl = timeLimitLevel(boleto.timeLimit);
                    return (
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Time limit de emisión</p>
                        <p className={`text-xs font-bold ${lvl === "vencido" ? "text-red-600" : lvl === "proximo" ? "text-amber-600" : "text-zinc-900"}`}>
                          {boleto.timeLimit}{lvl === "vencido" ? " · VENCIDO" : lvl === "proximo" ? " · PRÓXIMO" : ""}
                        </p>
                      </div>
                    );
                  })()}
                  {boleto.ticketNumero && (
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Nº de e-ticket</p>
                      <p className="text-xs font-mono font-bold text-zinc-900">{boleto.ticketNumero}</p>
                    </div>
                  )}
                  {boleto.aerolineaValidadora && (
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Aerolínea validadora</p>
                      <p className="text-xs font-bold text-zinc-900">{boleto.aerolineaValidadora}</p>
                    </div>
                  )}
                </div>
              )}

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
                  <span className="text-xs font-bold text-zinc-700">{formatCurrency(boleto.costoNeto, "USD")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Precio Venta (PVP)</span>
                  <span className="text-xs font-bold text-zinc-700">{formatCurrency(boleto.precioPvp || boleto.precioVenta, "USD")}</span>
                </div>
                {boleto.comisionB2B !== undefined && boleto.comisionB2B > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Comisión B2B</span>
                    <span className="text-xs font-bold text-amber-600">-{boleto.comisionB2B}% ({formatCurrency((boleto.precioPvp || 0) - boleto.precioVenta, "USD")})</span>
                  </div>
                )}
                {boleto.comisionMayorista !== undefined && boleto.comisionMayorista > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Comisión Foratour</span>
                    <span className="text-xs font-bold text-amber-600">-{boleto.comisionMayorista}% ({formatCurrency(boleto.precioVenta - boleto.costoNeto, "USD")})</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-800 font-bold uppercase tracking-wider">Neto B2B a Cobrar</span>
                  <span className="text-sm font-black text-zinc-900">{formatDualCurrency(boleto.precioVenta, jur, currentExchangeRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ganancia Foratour</span>
                  <span className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(boleto.precioVenta - boleto.costoNeto, "USD")}
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
                  <span>Cliente (Agencia B2B o Directo) — Opcional</span>
                  {clienteSeleccionadoId && (
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
                    placeholder="Buscar cliente (agencia B2B o directo)..."
                    className="w-full p-2.5 pl-8 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500"
                    value={agencySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAgencySearch(val);
                      setShowAgencyDropdown(true);
                      if (!val) limpiarCliente();
                    }}
                    onFocus={() => setShowAgencyDropdown(true)}
                    disabled={expediente.status !== "Borrador"}
                  />
                  <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

                  {agencySearch && expediente.status === "Borrador" && (
                    <button
                      type="button"
                      onClick={limpiarCliente}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {showAgencyDropdown && expediente.status === "Borrador" && (() => {
                    const query = agencySearch.toLowerCase();
                    const matches = clientesFacturables.filter(c =>
                      c.nombre.toLowerCase().includes(query) ||
                      c.doc.toLowerCase().includes(query) ||
                      c.id.toLowerCase().includes(query) ||
                      c.email.toLowerCase().includes(query)
                    );
                    return (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowAgencyDropdown(false)}
                        />
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-100">
                          {matches.length === 0 ? (
                            <div className="p-3 text-xs text-zinc-400 italic">
                              Ningún cliente coincide con "{agencySearch}".
                            </div>
                          ) : (
                            matches.map(c => (
                              <button
                                key={`${c.kind}-${c.id}`}
                                type="button"
                                onClick={() => seleccionarCliente(c)}
                                className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors cursor-pointer border-none font-sans"
                              >
                                <div className="space-y-0.5">
                                  <span className="font-bold text-zinc-900 block">{c.nombre}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono block">
                                    Cod: {c.id} | {c.kind === "B2B" ? "RIF" : "CI"}: {c.doc}
                                  </span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                                  c.isCredit ? "bg-purple-50 text-purple-700" :
                                  c.kind === "Directo" ? "bg-blue-50 text-blue-700" :
                                  "bg-zinc-100 text-zinc-600"
                                }`}>
                                  {c.tipoLabel}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
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
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
              <Button
                size="lg"
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

                  // Generar la Cuenta por Pagar a la aerolínea/BSP (una sola vez) → Tesorería.
                  const yaTiene = (payableObligations || []).some(o => o.locatorId === boleto.id);
                  const tlDate = parseTimeLimitDate(boleto.timeLimit);
                  if (!yaTiene && onAddObligation && boleto.costoNeto > 0) {
                    onAddObligation({
                      id: nextSequentialId("PAY", (payableObligations || []).map(o => o.id)),
                      dueDate: (tlDate || new Date()).toISOString().split("T")[0],
                      date: new Date().toISOString().split("T")[0],
                      providerName: boleto.aerolineaValidadora?.trim()
                        || (boleto.segmentos?.[0] ? getAirlineName(boleto.segmentos[0].aerolinea) : "")
                        || "Aerolínea / BSP",
                      serviceDetail: `Boleto aéreo ${boleto.pnr} — ${buildRoute(boleto.segmentos || [])}`,
                      locatorId: boleto.id,
                      netCost: boleto.costoNeto,
                      paidAmount: 0,
                      status: "Pendiente",
                      currency: "USD",
                    });
                  }

                  showAlert({ title: "Solicitud enviada", message: "Solicitud enviada a Facturación. Se generó la cuenta por pagar a la aerolínea en Tesorería para su liquidación.", type: "success" });
                }}
                disabled={expediente.status !== "Borrador"}
                className="shadow-xs"
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
              </Button>
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
      <Button id="btn-empty-cargar-pnr" size="lg" onClick={onNuevo}>
        <Plus className="w-4 h-4" />
        Cargar primer PNR
      </Button>
    </div>
  );
}

// CSS de impresión: aísla el modal imprimible (voucher/liquidación) ocultando TODO el
// resto de la app con visibility, y lo posiciona limpio en la hoja. Antes solo hacía
// `static` los elementos .fixed, por lo que el contenido de fondo se imprimía igual.
const PRINT_ISOLATE_CSS = `
  @media print {
    @page { margin: 12mm; }
    html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
    /* El modal imprimible está portalizado a <body>; se oculta el resto de la app. */
    #root { display: none !important; }
    .print-modal-container {
      position: static !important; inset: auto !important; display: block !important;
      width: 100% !important; height: auto !important; min-height: 0 !important;
      background: #fff !important; backdrop-filter: none !important;
      padding: 0 !important; margin: 0 !important; overflow: visible !important;
    }
    .print-modal-content {
      background: #fff !important; border: none !important; box-shadow: none !important;
      max-width: 100% !important; width: 100% !important; max-height: none !important;
      height: auto !important; overflow: visible !important; display: block !important; border-radius: 0 !important;
    }
  }
`;

// ─── MODAL VOUCHER AÉREO ────────────────────────────────────────────────────────
function FlightVoucherModal({
  boleto,
  onClose,
  companyConfig
}: {
  boleto: FlightTicket;
  onClose: () => void;
  companyConfig: CompanyConfig;
}) {
  const exp = boleto.expedienteAereo;
  const reembolsado = exp?.status === "Reembolsado";
  const reemisiones = exp?.reemisiones ?? [];
  const emds = exp?.emds ?? [];
  return createPortal((
    <>
      <style>{PRINT_ISOLATE_CSS}</style>
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
              <Button variant="success" onClick={() => window.print()}>
                <Download className="w-3.5 h-3.5" /> Generar PDF / Imprimir
              </Button>
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
                    {companyConfig.logoLetter}
                  </div>
                  <div>
                    <h2 className="font-black text-base tracking-tight leading-none text-zinc-950 font-sans uppercase">{companyConfig.name}</h2>
                    <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">{companyConfig.subtitle}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                  {companyConfig.tagline || companyConfig.subtitle}
                </p>
              </div>
              
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5 font-sans">
                <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-250 text-blue-800 rounded text-[9px] font-black uppercase tracking-wider">
                  E-TICKET ITINERARY / RECEIPT
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900">PNR: {boleto.pnr}</span>
                {boleto.ticketNumero && (
                  <span className="text-[10px] font-mono font-semibold text-zinc-600">E-TKT: {boleto.ticketNumero}</span>
                )}
                {boleto.aerolineaValidadora && (
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase">{boleto.aerolineaValidadora}</span>
                )}
              </div>
            </div>

            {/* Status Stamp (dinámico: emitido / reembolsado, con nota de reemisión) */}
            <div className={`border rounded-lg p-4 mb-6 flex items-center justify-between gap-4 ${reembolsado ? "border-red-250 bg-red-50/40" : "border-emerald-250 bg-emerald-50/40"}`}>
              <div className="space-y-1">
                <h4 className={`text-xs font-extrabold uppercase font-sans ${reembolsado ? "text-red-800" : "text-emerald-800"}`}>
                  {reembolsado ? "Estado: BOLETO REEMBOLSADO / ANULADO" : "Estado: BOLETO EMITIDO Y CONFIRMADO"}
                </h4>
                <p className="text-[10.5px] text-zinc-600 leading-relaxed font-semibold font-sans">
                  {reembolsado
                    ? "Este boleto ha sido reembolsado/anulado. El itinerario ya no es válido para viajar; conserve este documento como constancia."
                    : "Este documento certifica la emisión de los boletos aéreos electrónicos detallados a continuación. Por favor presente este recibo junto a su documento de identidad vigente al momento del chequeo en el aeropuerto."}
                </p>
                {reemisiones.length > 0 && !reembolsado && (
                  <p className="text-[10px] text-amber-700 font-bold font-sans">↻ Boleto reemitido{reemisiones.length > 1 ? ` ${reemisiones.length} veces` : ""} — este itinerario refleja el cambio más reciente.</p>
                )}
              </div>
              <div className={`flex-shrink-0 w-24 h-24 border-4 rounded-full flex flex-col items-center justify-center text-center rotate-12 font-sans select-none ${reembolsado ? "border-red-600/40" : "border-emerald-600/40"}`}>
                <span className={`text-[9px] font-black uppercase leading-none ${reembolsado ? "text-red-600/60" : "text-emerald-600/60"}`}>FORATOUR</span>
                <span className={`text-sm font-black uppercase tracking-widest mt-1 ${reembolsado ? "text-red-600" : "text-emerald-600"}`}>{reembolsado ? "ANULADO" : "EMITIDO"}</span>
                <span className={`text-[8px] font-mono mt-0.5 leading-none ${reembolsado ? "text-red-500" : "text-emerald-500"}`}>{reembolsado ? "VOID" : "OK"}</span>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="mb-6 space-y-4">
              <h5 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-1.5 font-sans">Datos de los Pasajeros</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(boleto.pasajeros?.map ? boleto.pasajeros : []).map((p, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-zinc-900 font-mono uppercase">
                      {p.nombre} <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded ml-1">{p.tipo}</span>
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      Doc. Identidad: <span className="text-zinc-800">{p.documento || "No especificado"}</span>
                    </span>
                    {p.ticketNumero && (
                      <span className="text-[10px] font-bold text-zinc-500">
                        E-ticket: <span className="text-zinc-800 font-mono">{p.ticketNumero}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="space-y-4 mb-6">
              <h5 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-1.5 font-sans">Itinerario de Vuelos</h5>
              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30 break-inside-avoid print:break-inside-avoid">
                {(boleto.segmentos?.map ? boleto.segmentos : []).map((seg, i) => (
                  <div key={i} className="p-4 bg-white space-y-2 break-inside-avoid print:break-inside-avoid">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-sans">
                        TRAMO {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                        CLASE {seg.clase}{seg.cabina ? ` · ${seg.cabina}` : ""}
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
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-0.5">Salida → Llegada</span>
                        <span className="font-bold text-sm text-zinc-800 block">{formatGDSDate(seg.fecha)}</span>
                        <span className="font-mono text-xs text-zinc-600 block">{seg.horaSalida} → {seg.horaLlegada}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Servicios adicionales (EMD) — sin precios (documento del pasajero) */}
            {emds.length > 0 && (
              <div className="space-y-3 mb-6 break-inside-avoid print:break-inside-avoid">
                <h5 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-1.5 font-sans">Servicios Adicionales Incluidos</h5>
                <ul className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 bg-white">
                  {emds.map((e, i) => (
                    <li key={i} className="flex items-center gap-2 p-3 text-[11px] font-sans">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-800">{e.concepto}</span>
                      {e.notas && <span className="text-zinc-500">— {e.notas}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Historial de reemisiones (cambios del boleto) */}
            {reemisiones.length > 0 && !reembolsado && (
              <div className="space-y-2 mb-6 break-inside-avoid print:break-inside-avoid">
                <h5 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-1.5 font-sans">Historial de Cambios (Reemisiones)</h5>
                <ul className="text-[10.5px] text-zinc-600 space-y-1 font-sans">
                  {reemisiones.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Reemisión del {new Date(r.fecha).toLocaleDateString("es-ES")}{r.motivo ? ` — ${r.motivo}` : ""}{r.nuevoTicket ? ` · nuevo e-ticket ${r.nuevoTicket}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Instructions */}
            <div className="bg-zinc-50 border border-zinc-100 rounded p-4 text-[10px] text-zinc-600 font-semibold space-y-2 font-sans mt-8 break-inside-avoid print:break-inside-avoid">
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
  ), document.body);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LIQUIDACIÓN AL CLIENTE (documento financiero, con precios) — imprimible
// ═══════════════════════════════════════════════════════════════════════════════
function FlightLiquidacionModal({
  boleto,
  cliente,
  companyConfig,
  onClose,
}: {
  boleto: FlightTicket;
  cliente?: { nombre: string; doc?: string; tipo: string };
  companyConfig: CompanyConfig;
  onClose: () => void;
}) {
  const exp = boleto.expedienteAereo;
  const reemisiones = exp?.reemisiones ?? [];
  const emds = exp?.emds ?? [];
  const reembolso = exp?.reembolso;
  const impuestos = boleto.impuestos ?? [];
  const totalActual = boleto.precioVenta || 0;
  const reemTotal = reemisiones.reduce((s, r) => s + r.totalCobrado, 0);
  const emdsTotal = emds.reduce((s, e) => s + e.montoVenta, 0);
  const baseTicket = Math.max(0, totalActual - reemTotal - emdsTotal);
  const totalNeto = totalActual - (reembolso?.montoReembolsado ?? 0);
  const fmt = (n: number) => formatCurrency(n, "USD");
  const ruta = buildRoute(boleto.segmentos || []);
  const hoy = new Date().toLocaleDateString("es-ES");

  // Desglose por pasajero + comisión (para agencias B2B).
  const esB2B = cliente?.tipo === "Agencia B2B";
  const pasajeros = boleto.pasajeros || [];
  const hasPerPax = pasajeros.some(p => p.precioVenta != null || p.costoNeto != null);
  const basePvp = boleto.precioPvp ?? baseTicket;            // PVP del boleto base (venta al público)
  const pvpTotal = basePvp + reemTotal + emdsTotal;          // PVP total (base + reemisión + EMD)
  const comisionAgencia = pvpTotal - totalActual;            // ganancia de la agencia (PVP − neto)

  return createPortal((
    <>
      <style>{PRINT_ISOLATE_CSS}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
        <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
          {/* Header UI (no impreso) */}
          <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between print:hidden shrink-0">
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                <FileText className="w-4.5 h-4.5 text-zinc-400" /> Liquidación al Cliente
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">Documento financiero con el desglose de cargos.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="success" onClick={() => window.print()}>
                <Download className="w-3.5 h-3.5" /> Generar PDF / Imprimir
              </Button>
              <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Área imprimible */}
          <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
            {/* Encabezado */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center font-black text-base">{companyConfig.logoLetter}</div>
                <div>
                  <h2 className="font-black text-base tracking-tight leading-none text-zinc-950 uppercase">{companyConfig.name}</h2>
                  <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block">{companyConfig.subtitle}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="px-2.5 py-0.5 bg-zinc-900 text-white rounded text-[9px] font-black uppercase tracking-wider">Liquidación / Cotización</span>
                <span className="text-xs font-mono font-bold text-zinc-900">PNR: {boleto.pnr}</span>
                {boleto.ticketNumero && <span className="text-[10px] font-mono font-semibold text-zinc-600">E-TKT: {boleto.ticketNumero}</span>}
                <span className="text-[10px] text-zinc-500 font-semibold">Fecha: {hoy}</span>
              </div>
            </div>

            {/* Cliente + boleto */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Cliente</span>
                <p className="text-sm font-black text-zinc-900">{cliente?.nombre || exp?.titular || "—"}</p>
                <p className="text-[10px] text-zinc-500 font-semibold">{cliente?.tipo || "Sin asignar"}{cliente?.doc ? ` · ${cliente.doc}` : ""}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Boleto</span>
                <p className="text-sm font-black text-zinc-900">{ruta}</p>
                <p className="text-[10px] text-zinc-500 font-semibold">{(boleto.pasajeros?.length || 0)} pasajero(s) · {(boleto.segmentos?.length || 0)} tramo(s)</p>
              </div>
            </div>

            {/* Desglose de tarifa (informativo) */}
            {(boleto.tarifaBase != null || impuestos.length > 0) && (
              <div className="mb-4 text-[11px] font-mono bg-zinc-50 border border-zinc-100 rounded p-3 space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1 font-sans">Desglose de tarifa (referencial)</span>
                {boleto.tarifaBase != null && <div className="flex justify-between text-zinc-600"><span>Tarifa base</span><span>{fmt(boleto.tarifaBase)}</span></div>}
                {impuestos.map((imp, i) => (<div key={i} className="flex justify-between text-zinc-500"><span>Impuesto {imp.codigo}</span><span>+{fmt(imp.monto)}</span></div>))}
              </div>
            )}

            {/* Detalle de cargos al cliente */}
            <div className="mb-6">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-1.5 block mb-2 font-sans">Detalle de Cargos</span>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-zinc-100">
                  {/* Boleto: desglosado por pasajero (ADT/CHD/INF) si hay precio por pasajero */}
                  {hasPerPax ? (
                    pasajeros.map((p, i) => (
                      <tr key={`pax-${i}`}>
                        <td className="py-2 text-zinc-700 font-semibold">
                          {p.nombre}
                          <span className="text-[8.5px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded ml-1.5 uppercase font-bold">{p.tipo || p.paxType}</span>
                          <span className="block text-[9px] text-zinc-400 font-normal font-sans">Boleto {boleto.pnr} — {ruta}</span>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-zinc-900 align-top">{fmt(p.precioVenta ?? p.costoNeto ?? 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 text-zinc-700 font-semibold">Boleto aéreo — {ruta} ({boleto.pnr}) · {pasajeros.length} pax</td>
                      <td className="py-2 text-right font-mono font-bold text-zinc-900">{fmt(basePvp)}</td>
                    </tr>
                  )}
                  {reemisiones.map((r, i) => (
                    <tr key={`re-${i}`}>
                      <td className="py-2 text-zinc-700 font-semibold">Reemisión ({new Date(r.fecha).toLocaleDateString("es-ES")}){r.motivo ? ` — ${r.motivo}` : ""}</td>
                      <td className="py-2 text-right font-mono font-bold text-zinc-900">{fmt(r.totalCobrado)}</td>
                    </tr>
                  ))}
                  {emds.map((e, i) => (
                    <tr key={`emd-${i}`}>
                      <td className="py-2 text-zinc-700 font-semibold">EMD — {e.concepto}{e.notas ? ` (${e.notas})` : ""}</td>
                      <td className="py-2 text-right font-mono font-bold text-zinc-900">{fmt(e.montoVenta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resumen financiero (para B2B: comisión + neto a pagar; siempre reconcilia) */}
              <div className="mt-3 border-t border-zinc-200 pt-3 space-y-1.5 text-xs font-sans">
                <div className="flex justify-between text-zinc-600"><span>Subtotal (PVP)</span><span className="font-mono font-bold">{fmt(pvpTotal)}</span></div>
                {Math.abs(comisionAgencia) > 0.005 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{esB2B ? `Comisión de la agencia${boleto.comisionB2B != null ? ` (${boleto.comisionB2B}%)` : ""}` : "Descuento comercial"}</span>
                    <span className="font-mono font-bold">{comisionAgencia >= 0 ? "-" : "+"}{fmt(Math.abs(comisionAgencia))}</span>
                  </div>
                )}
                {reembolso && (
                  <div className="flex justify-between text-red-600">
                    <span>Nota de crédito por reembolso{reembolso.penalidad ? ` (penalidad ${fmt(reembolso.penalidad)})` : ""}</span>
                    <span className="font-mono font-bold">-{fmt(reembolso.montoReembolsado)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-zinc-900 pt-2 mt-1">
                  <span className="text-sm font-black text-zinc-900 uppercase">{esB2B ? `Neto a pagar a ${companyConfig.name}` : "Total a pagar"}</span>
                  <span className="text-base font-black font-mono text-zinc-900">{fmt(totalNeto)}</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-3">Condición de pago: <b>{exp?.facturacionTipo || "Pago Contado"}</b>. Montos expresados en USD.{esB2B ? " El neto a pagar es el monto que la agencia abona a Foratour, ya descontada su comisión." : ""}</p>
            </div>

            {/* Pie */}
            <div className="mt-8 pt-6 border-t border-zinc-200 text-center text-[9px] font-medium text-zinc-400 break-inside-avoid print:break-inside-avoid">
              <p>Documento de liquidación emitido por {companyConfig.name}. Válido como detalle de cargos del boleto aéreo referenciado.</p>
              <p className="mt-1">{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address} | Email: {companyConfig.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  ), document.body);
}

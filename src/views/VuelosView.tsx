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
  Download
} from "lucide-react";
import type { FlightLeg, B2BClient } from "../types";
import type { FlightTicket, Passenger, FlightSegment } from "../types/aereos";
import { parseGDS, buildRoute, formatGDSDate, SAMPLE_GDS_TEXT } from "../lib/parsers/pnrParser";

// ─── TIPOS LOCALES ────────────────────────────────────────────────────────────

interface VuelosViewProps {
  flights: FlightLeg[]; // prop legacy del App.tsx
  boletos: FlightTicket[];
  onBoletosChange: React.Dispatch<React.SetStateAction<FlightTicket[]>>;
  clients?: B2BClient[];
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

export default function VuelosView({ flights: _flights, boletos, onBoletosChange, clients = [] }: VuelosViewProps) {
  const [subView, setSubView] = useState<SubView>("listado");
  const [search, setSearch] = useState("");
  const [selectedBoletoId, setSelectedBoletoId] = useState<string | null>(null);

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
          onToggleVinculo={(id) =>
            onBoletosChange((prev) =>
              prev.map((b) =>
                b.id === id ? { ...b, vinculadoAExpediente: !b.vinculadoAExpediente } : b
              )
            )
          }
          onEliminar={(id) => onBoletosChange((prev) => prev.filter((b) => b.id !== id))}
        />
      ) : subView === "nuevo" ? (
        <NuevoBoletoView
          onGuardar={(boleto) => {
            onBoletosChange((prev) => [boleto, ...prev]);
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
            onBoletosChange((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }}
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
}: {
  boletos: FlightTicket[];
  search: string;
  setSearch: (v: string) => void;
  onNuevo: () => void;
  onExpediente: (id: string) => void;
  onToggleVinculo: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const filtered = boletos.filter((b) => {
    const q = search.toLowerCase();
    const paxNames = b.pasajeros.map((p) => p.nombre.toLowerCase()).join(" ");
    const ruta = buildRoute(b.segmentos).toLowerCase();
    return b.pnr.toLowerCase().includes(q) || paxNames.includes(q) || ruta.includes(q);
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
            const primerSeg = boleto.segmentos[0];
            const ruta = buildRoute(boleto.segmentos);
            return (
              <div
                key={boleto.id}
                id={`boleto-row-${boleto.id}`}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors items-center"
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
                    {boleto.pasajeros.slice(0, 2).map((p, i) => (
                      <p key={i} className="text-xs text-zinc-700 font-medium leading-tight truncate">
                        {p.nombre}
                        <span className="ml-1 text-[9px] text-zinc-400 font-bold">{p.tipo}</span>
                      </p>
                    ))}
                    {boleto.pasajeros.length > 2 && (
                      <p className="text-[10px] text-zinc-400 font-medium">
                        +{boleto.pasajeros.length - 2} más
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
                      {boleto.segmentos[boleto.segmentos.length - 1]?.destino ?? "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {boleto.segmentos.length} tramo{boleto.segmentos.length !== 1 ? "s" : ""} ·{" "}
                    {boleto.pasajeros.length} pax
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
                    ${boleto.precioVenta.toLocaleString("es-VE")}
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
                        <Badge variant={boleto.expedienteAereo.status === "Facturado" || boleto.expedienteAereo.status === "PagadoAerolinea" ? "info" : boleto.expedienteAereo.status === "Cancelado" ? "warning" : "default"}>
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
                        alert(`Generando e imprimiendo Voucher para el boleto: ${boleto.pnr}\n\nLos servicios están confirmados y facturados.`);
                      }}
                      title="Descargar Voucher de Vuelo"
                      className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-expediente-${boleto.id}`}
                    onClick={() => onExpediente(boleto.id)}
                    title="Gestionar Expediente / Facturación"
                    className="p-1.5 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`btn-toggle-${boleto.id}`}
                    onClick={() => onToggleVinculo(boleto.id)}
                    title={boleto.vinculadoAExpediente ? "Desvincular" : "Marcar vinculado"}
                    className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    {boleto.vinculadoAExpediente ? (
                      <Unlink className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    id={`btn-eliminar-${boleto.id}`}
                    onClick={() => onEliminar(boleto.id)}
                    title="Eliminar boleto"
                    className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
  const [costoNeto, setCostoNeto] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

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

  // ─ Acción: Guardar boleto ─────────────────────────────────────────────────
  const handleGuardar = () => {
    if (!pnr || pasajeros.length === 0 || segmentos.length === 0) return;
    const costo = parseFloat(costoNeto) || 0;
    const venta = parseFloat(precioVenta) || 0;
    if (venta === 0) return;

    setGuardando(true);
    setTimeout(() => {
      const nuevoBoleto: FlightTicket = {
        id: `BOL-${Date.now()}`,
        pnr,
        pasajeros,
        segmentos,
        costoNeto: costo,
        precioVenta: venta,
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
    parseFloat(precioVenta) > 0;

  const margenVal =
    parseFloat(precioVenta) > 0 && parseFloat(costoNeto) > 0
      ? ((parseFloat(precioVenta) - parseFloat(costoNeto)) / parseFloat(precioVenta)) * 100
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── COLUMNA IZQUIERDA: PNR INPUT ── */}
        <div className="space-y-4">
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
              className="w-full p-4 text-xs font-mono text-zinc-700 bg-zinc-950 text-emerald-400 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
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

          {/* Resultado del parseo: pasajeros */}
          {parseAttempted && !isParsing && (
            <div className="bg-white border border-zinc-200 rounded overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Pasajeros Detectados
                </span>
                <Badge variant={pasajeros.length > 0 ? "success" : "warning"}>
                  {pasajeros.length}
                </Badge>
              </div>
              {pasajeros.length === 0 ? (
                <p className="text-xs text-zinc-400 p-4 font-medium">
                  Sin pasajeros detectados. Revisa el formato.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {pasajeros.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 font-mono">
                          {p.nombre}
                        </span>
                      </div>
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

              {/* Segmentos detectados */}
              {segmentos.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    Itinerario Detectado ({segmentos.length} tramo{segmentos.length !== 1 ? "s" : ""})
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado vacío de segmentos */}
              {parseAttempted && !isParsing && segmentos.length === 0 && (
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
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                Datos Financieros{" "}
                <span className="text-[9px] text-zinc-400 normal-case tracking-normal font-medium">
                  (ingreso manual obligatorio)
                </span>
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                      value={costoNeto}
                      onChange={(e) => setCostoNeto(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Precio de Venta (PVP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      $
                    </span>
                    <input
                      id="field-precio-venta"
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2 border border-zinc-200 rounded text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {/* Indicador de margen */}
              {margenVal !== null && (
                <div
                  className={`flex items-center justify-between p-2.5 rounded border text-xs font-bold ${
                    margenVal >= 10
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : margenVal >= 5
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <span>Margen estimado</span>
                  <span>{margenVal.toFixed(1)}%</span>
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
          {!canGuardar && parseAttempted && (
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
}: {
  boleto: FlightTicket;
  clients: B2BClient[];
  onBack: () => void;
  onUpdateBoleto: (boleto: FlightTicket) => void;
}) {
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
    alert("Expediente enviado a facturación exitosamente.");
  };

  const isCreditAgency = React.useMemo(() => {
    if (!expediente.clienteB2BId) return false;
    const agency = agenciasActivas.find(a => a.id === expediente.clienteB2BId);
    return agency?.tipo === "A Crédito";
  }, [expediente.clienteB2BId, agenciasActivas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
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
          {expediente.status === "Borrador" && (
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
            </>
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

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Ruta</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800">{primerSeg?.origen ?? "—"}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold text-zinc-800">{ultimoSeg?.destino ?? "—"}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">{primerSeg ? formatGDSDate(primerSeg.fecha) : "—"}</p>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Pasajeros ({boleto.pasajeros.length})</p>
                <div className="space-y-1">
                  {boleto.pasajeros.map((p, i) => (
                    <p key={i} className="text-xs text-zinc-700 font-semibold">{p.nombre}</p>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Costo Neto</span>
                  <span className="text-xs font-bold text-zinc-700">${boleto.costoNeto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Precio Venta (PVP)</span>
                  <span className="text-sm font-black text-zinc-900">${boleto.precioVenta.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Margen</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {boleto.precioVenta > 0 
                      ? ((boleto.precioVenta - boleto.costoNeto) / boleto.precioVenta * 100).toFixed(1) 
                      : 0}%
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
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  const updated = {
                    ...expediente,
                    status: "PagadoAerolinea" as const,
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
                  alert("Pago a aerolínea registrado. El expediente se ha completado.");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Pagado a Aerolínea
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

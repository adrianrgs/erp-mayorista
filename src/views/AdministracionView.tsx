import React, { useState } from "react";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";
import { 
  FinancialInvoice, 
  Reservation, 
  B2BClient, 
  PayableObligation, 
  ServiceType 
} from "../types";
import { Property } from "../types/producto";
import { FlightTicket } from "../types/aereos";
import { 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  Users, 
  Building, 
  Globe, 
  Check, 
  Activity, 
  Layers, 
  Star,
  Settings,
  ShieldCheck,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Percent
} from "lucide-react";

interface AdministracionViewProps {
  invoices: FinancialInvoice[];
  onUpdateInvoice: (updated: FinancialInvoice) => void;
  reservations?: Reservation[];
  boletos?: FlightTicket[];
  clients?: B2BClient[];
  detailedProperties?: Property[];
  payableObligations?: PayableObligation[];
}

export default function AdministracionView({
  invoices = [],
  onUpdateInvoice,
  reservations = [],
  boletos = [],
  clients = [],
  detailedProperties = [],
  payableObligations = []
}: AdministracionViewProps) {
  // 1. KPI Calculations (Health Metrics)
  const activeReservations = reservations.filter(r => r.status !== "Cancelada");

  // Ventas conectadas a la FACTURACIÓN REAL, no a la proyección de reservas. Un servicio
  // cuenta como venta sólo cuando Facturación lo emitió (statusFacturacion === "Facturado").
  // Los servicios aún no facturados (Borrador/Solicitado) forman el pipeline "Por Facturar".
  // Los "Rechazado" (anulaciones/NC) quedan fuera automáticamente.
  let totalGrossSales = 0;       // Venta B2B facturada
  let totalNetCost = 0;          // Costo neto de lo facturado
  let totalPvpSales = 0;         // PVP (tarifa retail) de lo facturado
  let totalB2BCommissions = 0;   // Comisión cedida a la agencia sobre lo facturado
  let totalCompanyMarkup = 0;    // Margen de la empresa sobre lo facturado
  let pipelineB2BSales = 0;      // Reservas confirmadas aún NO facturadas (por facturar)

  activeReservations.forEach(r => {
    (r.servicios || []).forEach(s => {
      const pct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
      const pvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - pct / 100));
      if (s.statusFacturacion === "Facturado") {
        totalGrossSales += s.precioVenta;
        totalNetCost += s.precioNeto;
        totalPvpSales += pvp;
        totalB2BCommissions += (pvp - s.precioVenta);
        totalCompanyMarkup += (s.precioVenta - s.precioNeto);
      } else if (s.statusFacturacion !== "Rechazado") {
        pipelineB2BSales += s.precioVenta;
      }
    });
  });

  boletos.forEach(b => {
    // Flights default to Venta (0% B2B commission unless otherwise noted)
    const st = b.expedienteAereo?.status;
    const facturado = !st || st === "Facturado" || st === "PagadoAerolinea";
    const excluido = st === "Anulado" || st === "Reembolsado";
    if (facturado) {
      totalGrossSales += b.precioVenta;
      totalNetCost += (b.costoNeto || 0);
      totalPvpSales += b.precioVenta;
      totalCompanyMarkup += (b.precioVenta - (b.costoNeto || 0));
    } else if (!excluido) {
      pipelineB2BSales += b.precioVenta;
    }
  });

  // Utilidad Neta sobre lo realmente facturado
  const projectedProfit = totalCompanyMarkup;
  const profitMarginPercent = totalGrossSales > 0 ? Math.round((projectedProfit / totalGrossSales) * 100) : 0;

  // Real Liquidity (Cobros verificados/pagados menos pagos reales a proveedores)
  // Efectivo cobrado: facturas de Cobro efectivamente pagadas (contado + recibos de cobranza,
  // que incluyen los pagos con saldo a favor ya aplicados). Excluye retiros (RET-) y notas de
  // crédito (NC-, montos negativos de anulaciones/reintegros). El efectivo de billetera entra a
  // la liquidez cuando se aplica a una factura (recibo/factura Pagado), no al momento del abono.
  const realCashCollected = invoices
    .filter(i => i.type === "Cobro" && i.status === "Pagado" && !i.id?.startsWith("RET-") && !i.id?.startsWith("NC-") && i.amount > 0)
    .reduce((sum, i) => sum + i.amount, 0);

  // RET- invoices = saldoFavor cash withdrawals (outflow, must be subtracted).
  // El retiro "a favor de la empresa" NO genera RET-, por lo que no reduce la liquidez.
  const realWithdrawals = invoices
    .filter(i => i.id?.startsWith("RET-") && i.status === "Pagado")
    .reduce((sum, i) => sum + i.amount, 0);

  // Egresos reales a proveedores: TODO lo pagado en el libro de obligaciones (parcial + total),
  // no sólo las obligaciones "Pagado Total". Un pago parcial también es salida de caja.
  const realPaymentsMade = invoices
    .filter(i => i.type === "Pago Proveedor" && i.status === "Pagado")
    .reduce((sum, i) => sum + i.amount, 0) +
    payableObligations
      .reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const realLiquidity = realCashCollected - realPaymentsMade - realWithdrawals;

  // 2. Commercial Intelligence calculations
  // Top 5 Agencies
  const agencyStats: { [name: string]: { volume: number; count: number } } = {};
  activeReservations.forEach(r => {
    const agency = r.agenciaName || "Canal Directo";
    if (!agencyStats[agency]) {
      agencyStats[agency] = { volume: 0, count: 0 };
    }
    agencyStats[agency].volume += r.totalPrice;
    agencyStats[agency].count += 1;
  });
  boletos.forEach(b => {
    const agency = b.expedienteAereo?.clienteB2BNombre || "Canal Directo";
    if (!agencyStats[agency]) {
      agencyStats[agency] = { volume: 0, count: 0 };
    }
    agencyStats[agency].volume += b.precioVenta;
    agencyStats[agency].count += 1;
  });

  const topAgencies = Object.entries(agencyStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Sales Distribution by product type
  let alojVolume = 0;
  let vuelosVolume = boletos.reduce((sum, b) => sum + b.precioVenta, 0);
  let trasladoVolume = 0;
  let otrosVolume = 0;

  activeReservations.forEach(r => {
    (r.servicios || []).forEach(s => {
      if (s.tipo === ServiceType.ALOJAMIENTO) {
        alojVolume += s.precioVenta;
      } else if (s.tipo === ServiceType.AEREO) {
        vuelosVolume += s.precioVenta;
      } else if (s.tipo === ServiceType.TRASLADO) {
        trasladoVolume += s.precioVenta;
      } else {
        otrosVolume += s.precioVenta;
      }
    });
  });

  const totalProductVolume = alojVolume + vuelosVolume + trasladoVolume + otrosVolume;
  const alojPercent = totalProductVolume > 0 ? Math.round((alojVolume / totalProductVolume) * 100) : 0;
  const vuelosPercent = totalProductVolume > 0 ? Math.round((vuelosVolume / totalProductVolume) * 100) : 0;
  const trasladoPercent = totalProductVolume > 0 ? Math.round((trasladoVolume / totalProductVolume) * 100) : 0;
  const otrosPercent = totalProductVolume > 0 ? Math.round((otrosVolume / totalProductVolume) * 100) : 0;

  // Best Selling Destinations/Properties
  const normalizeHotelName = (name: string) =>
    name.replace(/\s*\(Hab\s*\d+:.*$/i, '').trim();

  const hotelStats: { [name: string]: { volume: number; count: number; destination: string } } = {};
  activeReservations.forEach(r => {
    const hotel = normalizeHotelName(r.hotelName || "Servicios Varios");
    const prop = detailedProperties.find(p => p.nombre === normalizeHotelName(r.hotelName || ""));
    const dest = prop?.ciudad || "Múltiples destinos";
    if (!hotelStats[hotel]) {
      hotelStats[hotel] = { volume: 0, count: 0, destination: dest };
    }
    hotelStats[hotel].volume += r.totalPrice;
    hotelStats[hotel].count += 1;
  });

  const topHotels = Object.entries(hotelStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  return (
    <div className="space-y-8 font-sans pb-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h2 className="text-zinc-950 font-black text-2xl tracking-tight uppercase">BI & Comando Directivo</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5 uppercase tracking-wider">Monitoreo de Salud Financiera y Rendimiento Comercial Mayorista</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Datos Actualizados en Tiempo Real</span>
        </div>
      </div>

      {/* 1. KPIs DE SALUD FINANCIERA Y RENDIMIENTO COMERCIAL (Bento Premium Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Ventas PVP Proyectadas (Público Final) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Ventas PVP (Tarifa Retail)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(Math.round(totalPvpSales), getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Volumen Público</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Ventas Brutas B2B (Facturación Real) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Ventas B2B (Facturado)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(totalGrossSales, getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Billed to B2B</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {/* Por Facturar (Pipeline) — reservas confirmadas aún no facturadas */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Por Facturar (Pipeline)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight text-sky-700">
              {formatCurrency(Math.round(pipelineB2BSales), getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Confirmado sin facturar</span>
            <RefreshCw className="w-4 h-4 text-sky-500" />
          </div>
        </div>

        {/* Comisiones Cedidas B2B (Descuentos otorgados) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Comisiones B2B Cedidas</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight text-amber-700">
              -{formatCurrency(Math.round(totalB2BCommissions), getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Retenido por Agencias</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Utilidad Neta Mayorista (Margen Propio Foratour) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Utilidad Neta (Neto)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight text-emerald-700">
              {formatCurrency(projectedProfit, getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
            <span>Markup: {profitMarginPercent}%</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Liquidez Real (Caja) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Liquidez Real (Caja)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(realLiquidity, getOperatingCurrency())}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Ratio Cashflow</span>
            <Activity className={`w-4 h-4 ${realLiquidity >= 0 ? "text-emerald-500 animate-pulse" : "text-red-500"}`} />
          </div>
        </div>

      </div>

      {/* 2. PANEL DE INTELIGENCIA COMERCIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Top Agencies & Destination Yield */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Top 5 Agencias B2B */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wider">Top 5 Agencias B2B del Mes</h4>
                <p className="text-[10.5px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wide">Rendimiento por facturación y volumen de reservas</p>
              </div>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] font-black uppercase">
                Ranking MTD
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {topAgencies.map((agency, index) => (
                <div key={agency.name} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-black">
                      {index + 1}
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-black text-xs text-zinc-900 block">{agency.name}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold block uppercase">{agency.count} Expedientes emitidos</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-black text-zinc-900 block">{formatCurrency(agency.volume, getOperatingCurrency())}</span>
                    <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wide">Cliente Preferencial</span>
                  </div>
                </div>
              ))}
              {topAgencies.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-400 font-medium italic">No se registran transacciones activas de agencias.</p>
              )}
            </div>
          </div>

          {/* Rendimiento de Destinos/Hoteles */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div>
              <h4 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wider">Rendimiento de Propiedades & Destinos</h4>
              <p className="text-[10.5px] text-zinc-500 font-semibold mt-0.5 uppercase tracking-wide">Listado de hoteles con mayor tracción comercial</p>
            </div>

            <div className="divide-y divide-zinc-100">
              {topHotels.map((hotel) => (
                <div key={hotel.name} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-black text-xs text-zinc-900 block">{hotel.name}</span>
                    <span className="text-[9.5px] text-zinc-400 font-bold uppercase block tracking-wider">📍 {hotel.destination} · {hotel.count} Noches reservadas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-zinc-950 font-mono text-xs block">{formatCurrency(hotel.volume, getOperatingCurrency())}</span>
                    <div className="flex gap-0.5 justify-end mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {topHotels.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-400 font-medium italic">No hay registros de estadías acumuladas.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Col: Product Distribution & Command Centre Settings */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Distribución de Ventas por Producto */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5 shadow-xs">
            <div>
              <h4 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wider">Distribución de Ingresos</h4>
              <p className="text-[10.5px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wide">Desglose de facturación consolidada por tipo de producto</p>
            </div>

            <div className="space-y-4">
              {/* Alojamiento */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-violet-600" /> Alojamiento (Hotelería)
                  </span>
                  <span>{alojPercent}% ({formatCurrency(alojVolume, getOperatingCurrency())})</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: `${alojPercent}%` }} />
                </div>
              </div>

              {/* Vuelos */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-indigo-600" /> Vuelos (Emisión GDS)
                  </span>
                  <span>{vuelosPercent}% ({formatCurrency(vuelosVolume, getOperatingCurrency())})</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${vuelosPercent}%` }} />
                </div>
              </div>

              {/* Traslados */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-emerald-600" /> Traslados (Receptivos)
                  </span>
                  <span>{trasladoPercent}% ({formatCurrency(trasladoVolume, getOperatingCurrency())})</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${trasladoPercent}%` }} />
                </div>
              </div>

              {/* Otros */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-amber-600" /> Otros Servicios
                  </span>
                  <span>{otrosPercent}% ({formatCurrency(otrosVolume, getOperatingCurrency())})</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: `${otrosPercent}%` }} />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-[10.5px] text-zinc-700 font-semibold leading-relaxed flex gap-2">
              <Info className="w-4.5 h-4.5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p>La distribución porcentual rige la priorización de contratos netos negociados con consolidadores.</p>
            </div>
          </div>


        </div>

      </div>

    </div>
  );
}

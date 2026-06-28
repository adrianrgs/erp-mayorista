import React, { useState } from "react";
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
  exchangeRates: { usdToEur: number; usdToVes: number };
  onExchangeRatesChange: React.Dispatch<React.SetStateAction<{ usdToEur: number; usdToVes: number }>>;
  payableObligations?: PayableObligation[];
}

export default function AdministracionView({
  invoices = [],
  onUpdateInvoice,
  reservations = [],
  boletos = [],
  clients = [],
  detailedProperties = [],
  exchangeRates,
  onExchangeRatesChange,
  payableObligations = []
}: AdministracionViewProps) {
  const [successMsg, setSuccessMsg] = useState("");
  
  // Local states for the Exchange Rate inputs
  const [rateEur, setRateEur] = useState(exchangeRates.usdToEur);
  const [rateVes, setRateVes] = useState(exchangeRates.usdToVes);

  // Local state for the quick calculator
  const [calcUsd, setCalcUsd] = useState(100);
  const [calcTarget, setCalcTarget] = useState<"EUR" | "VES">("EUR");

  // 1. KPI Calculations (Health Metrics)
  const activeReservations = reservations.filter(r => r.status !== "Cancelada");

  // Total Gross Sales (B2B Billing Volume)
  const totalGrossSales = activeReservations.reduce((sum, r) => sum + r.totalPrice, 0) +
                          boletos.reduce((sum, b) => sum + b.precioVenta, 0);

  // Total Net Costs (Cuentas por Pagar a Proveedores)
  const totalNetCost = activeReservations.reduce((sum, r) => sum + r.netPrice, 0) +
                       boletos.reduce((sum, b) => sum + (b.costoNeto || 0), 0);

  // Dynamic PVP, B2B Commission & Profit Margin Calculations
  let totalPvpSales = 0;
  let totalB2BCommissions = 0;
  let totalCompanyMarkup = 0;

  activeReservations.forEach(r => {
    (r.servicios || []).forEach(s => {
      const pct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
      const pvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - pct / 100));
      totalPvpSales += pvp;
      totalB2BCommissions += (pvp - s.precioVenta);
      totalCompanyMarkup += (s.precioVenta - s.precioNeto);
    });
  });

  boletos.forEach(b => {
    // Flights default to Venta (0% B2B commission unless otherwise noted)
    const pvp = b.precioVenta;
    totalPvpSales += pvp;
    totalCompanyMarkup += (b.precioVenta - (b.costoNeto || 0));
  });

  // Utilidad Neta Proyectada (Profit)
  const projectedProfit = totalCompanyMarkup;
  const profitMarginPercent = totalGrossSales > 0 ? Math.round((projectedProfit / totalGrossSales) * 100) : 0;

  // Real Liquidity (Cobros verificados/pagados menos pagos reales a proveedores)
  const realCashCollected = invoices
    .filter(i => i.type === "Cobro" && i.status === "Pagado")
    .reduce((sum, i) => sum + i.amount, 0);

  const realPaymentsMade = invoices
    .filter(i => i.type === "Pago Proveedor" && i.status === "Pagado")
    .reduce((sum, i) => sum + i.amount, 0) +
    payableObligations
      .filter(o => o.status === "Pagado Total")
      .reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const realLiquidity = realCashCollected - realPaymentsMade;

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
  const hotelStats: { [name: string]: { volume: number; count: number; destination: string } } = {};
  activeReservations.forEach(r => {
    const hotel = r.hotelName || "Servicios Varios";
    const prop = detailedProperties.find(p => p.nombre === r.hotelName);
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

  // Exchange rate handler
  const handleUpdateExchangeRates = () => {
    onExchangeRatesChange({
      usdToEur: rateEur,
      usdToVes: rateVes
    });
    setSuccessMsg("✓ Tasas de cambio actualizadas globalmente en el ERP.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const calculatedCalcVal = calcTarget === "EUR" 
    ? Number((calcUsd * rateEur).toFixed(2))
    : Number((calcUsd * rateVes).toFixed(2));

  // Employee ERP Access Summary
  const departments = [
    { name: "Reservas & Ventas B2B", active: 8, total: 10, color: "bg-violet-500" },
    { name: "Operaciones & Traslados", active: 5, total: 6, color: "bg-indigo-500" },
    { name: "Facturación & Cobranzas", active: 4, total: 4, color: "bg-emerald-500" },
    { name: "Dirección & Business Intelligence", active: 2, total: 2, color: "bg-amber-500" }
  ];

  return (
    <div className="space-y-8 font-sans pb-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 pb-5">
        <div>
          <h2 className="text-zinc-950 font-black text-2xl tracking-tight uppercase">BI & Comando Directivo</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5 uppercase tracking-wider">Monitoreo de Salud Financiera y Rendimiento Comercial Mayorista</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-455">Datos Actualizados en Tiempo Real</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-lg text-xs font-bold uppercase tracking-wider animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* 1. KPIs DE SALUD FINANCIERA Y RENDIMIENTO COMERCIAL (Bento Premium Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Ventas PVP Proyectadas (Público Final) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Ventas PVP (Tarifa Retail)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              ${Math.round(totalPvpSales).toLocaleString("es-ES")} <span className="text-[10px] font-bold text-zinc-400">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
            <span>Volumen Público</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Ventas Brutas B2B (Facturación Real) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Ventas B2B (Facturado)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              ${totalGrossSales.toLocaleString("es-ES")} <span className="text-[10px] font-bold text-zinc-400">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
            <span>Billed to B2B</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {/* Comisiones Cedidas B2B (Descuentos otorgados) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-450 block">Comisiones B2B Cedidas</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight text-amber-700">
              -${Math.round(totalB2BCommissions).toLocaleString("es-ES")} <span className="text-[10px] font-bold text-zinc-400">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
            <span>Retenido por Agencias</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Utilidad Neta Mayorista (Margen Propio Foratour) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Utilidad Neta (Neto)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight text-emerald-700">
              ${projectedProfit.toLocaleString("es-ES")} <span className="text-[10px] font-bold text-zinc-400">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-450 font-semibold">
            <span>Markup: {profitMarginPercent}%</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Liquidez Real (Caja) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4.5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block">Liquidez Real (Caja)</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              ${realLiquidity.toLocaleString("es-ES")} <span className="text-[10px] font-bold text-zinc-400">USD</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
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
                <h4 className="font-extrabold text-zinc-955 text-sm uppercase tracking-wider">Top 5 Agencias B2B del Mes</h4>
                <p className="text-[10.5px] text-zinc-450 font-semibold mt-0.5 uppercase tracking-wide">Rendimiento por facturación y volumen de reservas</p>
              </div>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-650 rounded text-[9px] font-black uppercase">
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
                      <span className="text-[10px] text-zinc-450 font-semibold block uppercase">{agency.count} Expedientes emitidos</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-black text-zinc-900 block">${agency.volume.toLocaleString("es-ES")} USD</span>
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
              <h4 className="font-extrabold text-zinc-955 text-sm uppercase tracking-wider">Rendimiento de Propiedades & Destinos</h4>
              <p className="text-[10.5px] text-zinc-455 font-semibold mt-0.5 uppercase tracking-wide">Listado de hoteles con mayor tracción comercial</p>
            </div>

            <div className="divide-y divide-zinc-100">
              {topHotels.map((hotel) => (
                <div key={hotel.name} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-black text-xs text-zinc-900 block">{hotel.name}</span>
                    <span className="text-[9.5px] text-zinc-450 font-bold uppercase block tracking-wider">📍 {hotel.destination} · {hotel.count} Noches reservadas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-zinc-950 font-mono text-xs block">${hotel.volume.toLocaleString("es-ES")} USD</span>
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
              <p className="text-[10.5px] text-zinc-450 font-semibold mt-0.5 uppercase tracking-wide">Desglose de facturación consolidada por tipo de producto</p>
            </div>

            <div className="space-y-4">
              {/* Alojamiento */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-violet-600" /> Alojamiento (Hotelería)
                  </span>
                  <span>{alojPercent}% (${alojVolume.toLocaleString("es-ES")} USD)</span>
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
                  <span>{vuelosPercent}% (${vuelosVolume.toLocaleString("es-ES")} USD)</span>
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
                  <span>{trasladoPercent}% (${trasladoVolume.toLocaleString("es-ES")} USD)</span>
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
                  <span>{otrosPercent}% (${otrosVolume.toLocaleString("es-ES")} USD)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: `${otrosPercent}%` }} />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-3 text-[10.5px] text-zinc-655 font-semibold leading-relaxed flex gap-2">
              <Info className="w-4.5 h-4.5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p>La distribución porcentual rige la priorización de contratos netos negociados con consolidadores.</p>
            </div>
          </div>

          {/* CENTRO DE CONFIGURACIONES GLOBALES */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-xs">
            <div className="border-b border-zinc-150 pb-3 flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-zinc-850 animate-spin-slow" />
              <h4 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wider">Ajustes & Tasa Oficial</h4>
            </div>

            {/* Centro de Tasas de Cambio */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Tasas del Día (Oficiales de Cotización)</label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">1 USD a EUR (€)</span>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none focus:border-zinc-500 font-bold"
                    value={rateEur}
                    onChange={e => setRateEur(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">1 USD a VES (Bs)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none focus:border-zinc-500 font-bold"
                    value={rateVes}
                    onChange={e => setRateVes(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateExchangeRates}
                className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar Tasas ERP
              </button>
            </div>

            {/* Calculadora de Cotizaciones Alimentada por Tasas */}
            <div className="pt-4 border-t border-zinc-150 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Conversor Rápido de Divisas</span>
                <div className="flex rounded border border-zinc-200 overflow-hidden font-bold">
                  <button 
                    onClick={() => setCalcTarget("EUR")}
                    className={`px-2 py-0.5 text-[9px] uppercase cursor-pointer ${calcTarget === "EUR" ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    EUR
                  </button>
                  <button 
                    onClick={() => setCalcTarget("VES")}
                    className={`px-2 py-0.5 text-[9px] uppercase cursor-pointer ${calcTarget === "VES" ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    VES
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider">Entrada USD</span>
                  <input
                    type="number"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500 bg-white font-semibold"
                    value={calcUsd}
                    onChange={e => setCalcUsd(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex-shrink-0 pt-4 text-zinc-450 font-bold">➔</div>
                <div className="flex-1 space-y-1">
                  <span className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider">Resultado ({calcTarget})</span>
                  <div className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-150 rounded-lg text-xs font-black text-zinc-900">
                    {calcTarget === "EUR" ? "€" : "Bs"} {calculatedCalcVal.toLocaleString("es-ES")}
                  </div>
                </div>
              </div>
            </div>

            {/* Accesos de Empleados / Usuarios Activos */}
            <div className="pt-4 border-t border-zinc-150 space-y-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Monitoreo de Accesos (Usuarios Activos)</span>
              
              <div className="grid grid-cols-2 gap-3 text-left">
                {departments.map((dept) => (
                  <div key={dept.name} className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg space-y-1 flex flex-col justify-between shadow-2xs">
                    <span className="text-[9px] font-black text-zinc-650 leading-tight block">{dept.name}</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[11px] font-black text-zinc-900">
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.color}`} /> {dept.active} / {dept.total}
                      </span>
                      <span className="text-[8px] bg-zinc-200 border border-zinc-250 font-black px-1.5 py-0.25 text-zinc-500 rounded uppercase">
                        Activos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

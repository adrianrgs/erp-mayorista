import React from 'react';
import { OperationalTransfer, FleetDriver } from '../../types';

interface DailyDispatchManifestProps {
  title?: string;
  subtitle?: string;
  transfers: OperationalTransfer[];
  drivers: FleetDriver[];
}

export const DailyDispatchManifest: React.FC<DailyDispatchManifestProps> = ({ 
  title = "Board de Despacho Global", 
  subtitle, 
  transfers, 
  drivers 
}) => {

  // Sort by time ascending
  const sortedTransfers = [...transfers].sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());

  // Helper to get driver name
  const getDriverName = (driverId: string | null) => {
    if (!driverId) return "Sin Asignar";
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.nombre : "Desconocido";
  };

  return (
    <div className="print-manifest hidden bg-white w-full max-w-[21cm] min-h-[29.7cm] mx-auto text-black p-8 font-sans">
      
      {/* Encabezado */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">{title}</h1>
          {subtitle && <p className="text-lg font-bold mt-1 text-gray-700">{subtitle}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase text-gray-500">Total Servicios</p>
          <p className="text-2xl font-bold">{sortedTransfers.length}</p>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="w-full">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 px-1 font-bold uppercase w-16">Fecha / Hora</th>
              <th className="py-2 px-1 font-bold uppercase w-32">Conductor</th>
              <th className="py-2 px-1 font-bold uppercase">Lugar (Pick Up - Drop Off)</th>
              <th className="py-2 px-1 font-bold uppercase">Pasajero</th>
              <th className="py-2 px-1 font-bold uppercase text-center w-10">Pax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {sortedTransfers.map((t, idx) => {
              const timeStr = t.fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const dateStr = t.fechaHora.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
              return (
                <tr key={t.id} className="break-inside-avoid hover:bg-gray-50">
                  <td className="py-3 px-1 align-top whitespace-nowrap">
                    <div className="text-[10px] font-bold text-gray-500 uppercase leading-tight">{dateStr}</div>
                    <div className="text-sm font-black text-gray-900 leading-none mt-0.5">{timeStr}</div>
                  </td>
                  <td className="py-3 px-1 font-bold text-gray-800 align-top">
                    {getDriverName(t.conductorId)}
                    {t.vehiculoId && <div className="text-[9px] text-gray-500 font-normal mt-0.5">{t.vehicleType}</div>}
                  </td>
                  <td className="py-3 px-1 align-top max-w-[200px]">
                    <div className="mb-1"><span className="font-bold text-[9px] mr-1">A</span> {t.origen}</div>
                    <div><span className="font-bold text-[9px] mr-1">B</span> {t.destino}</div>
                  </td>
                  <td className="py-3 px-1 align-top">
                    <div className="font-bold">{t.pasajeroPrincipal}</div>
                    {t.telefonoPax && <div className="text-[10px] text-gray-800 font-semibold mt-0.5 font-mono">📞 {t.telefonoPax}</div>}
                    <div className="text-[10px] text-gray-500 mt-0.5 uppercase">{t.reservationId || t.id}</div>
                  </td>
                  <td className="py-3 px-1 font-black text-center text-sm align-top">{t.paxCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTransfers.length === 0 && (
        <div className="text-center py-20 text-gray-500 italic">
          No hay traslados en el sistema para esta fecha.
        </div>
      )}
      
    </div>
  );
};

import React from 'react';
import { OperationalTransfer, FleetDriver, TransferDirection } from '../../types';

interface DriverManifestProps {
  driver: FleetDriver;
  date: Date;
  transfers: OperationalTransfer[];
}

const directionLabels: Record<TransferDirection, string> = {
  IN: "Llegada",
  OUT: "Salida",
  INTERHOTEL: "Interhotel",
  DISPO: "Dispo"
};

export const DriverManifest: React.FC<DriverManifestProps> = ({ driver, date, transfers }) => {
  const dateStr = date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sortedTransfers = [...transfers].sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());

  return (
    <div className="print-manifest hidden bg-white w-full max-w-[21cm] min-h-[29.7cm] mx-auto text-black p-8 font-sans">
      
      {/* Encabezado */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Manifiesto de Ruta</h1>
          <p className="text-lg font-bold mt-1 text-gray-700 capitalize">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase text-gray-500">Conductor</p>
          <p className="text-2xl font-bold">{driver.nombre}</p>
          {driver.telefono && <p className="text-sm">{driver.telefono}</p>}
        </div>
      </div>

      {/* Resumen */}
      <div className="flex gap-8 mb-6 bg-gray-100 p-4 rounded-lg">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Total Servicios</p>
          <p className="text-xl font-bold">{sortedTransfers.length}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Total Pasajeros</p>
          <p className="text-xl font-bold">{sortedTransfers.reduce((acc, t) => acc + t.paxCount, 0)}</p>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="w-full">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-3 px-2 font-bold uppercase w-16">Hora</th>
              <th className="py-3 px-2 font-bold uppercase">Tipo</th>
              <th className="py-3 px-2 font-bold uppercase">Ruta (Origen - Destino)</th>
              <th className="py-3 px-2 font-bold uppercase">Pax</th>
              <th className="py-3 px-2 font-bold uppercase">Pasajero Principal</th>
              <th className="py-3 px-2 font-bold uppercase">Vuelo / Contacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {sortedTransfers.map((t, idx) => {
              const timeStr = t.fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              return (
                <tr key={t.id} className="break-inside-avoid">
                  <td className="py-4 px-2 font-bold text-lg align-top">{timeStr}</td>
                  <td className="py-4 px-2 align-top">
                    <span className="font-bold border border-black px-1.5 py-0.5 rounded text-[10px] uppercase">
                      {directionLabels[t.direction] || t.direction}
                    </span>
                    {t.tipoTraslado === 'Compartido' && (
                      <div className="mt-1 text-[9px] font-bold text-gray-600 bg-gray-100 px-1 rounded inline-block">
                        COMPARTIDO
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-2 align-top max-w-[250px]">
                    <div className="mb-1"><span className="font-bold text-[10px] mr-1">A</span> {t.origen}</div>
                    <div><span className="font-bold text-[10px] mr-1">B</span> {t.destino}</div>
                  </td>
                  <td className="py-4 px-2 font-bold align-top">{t.paxCount}</td>
                  <td className="py-4 px-2 align-top">
                    <div className="font-bold">{t.pasajeroPrincipal}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{t.reservationId || t.id}</div>
                  </td>
                  <td className="py-4 px-2 align-top">
                    {t.datosVuelo && (
                      <div className="text-[11px] mb-2 font-semibold">
                        ✈️ {t.datosVuelo}
                      </div>
                    )}
                    {t.telefonoPax && (
                      <div className="text-[11px] font-mono font-bold">
                        📞 {t.telefonoPax}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTransfers.length === 0 && (
        <div className="text-center py-20 text-gray-500 italic">
          No hay servicios programados para este conductor en esta fecha.
        </div>
      )}

      {/* Firmas */}
      <div className="mt-20 pt-8 border-t border-gray-300 flex justify-between px-10">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2 mx-auto"></div>
          <p className="text-xs font-bold uppercase">Firma del Conductor</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2 mx-auto"></div>
          <p className="text-xs font-bold uppercase">Firma del Despachador</p>
        </div>
      </div>
      
    </div>
  );
};

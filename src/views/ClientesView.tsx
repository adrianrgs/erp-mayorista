import React, { useState } from "react";
import { B2BClient, DirectClient, FinancialInvoice, Reservation } from "../types";
import { FlightTicket } from "../types/aereos";
import { RoomType, RatePlan, Property } from "../types/producto";
import ClientesB2BPanel from "./ClientesB2BPanel";
import ClientesDirectosPanel from "./ClientesDirectosPanel";

interface ClientesViewProps {
  clients: B2BClient[];
  onUpdateClient: (updated: B2BClient) => void;
  onAddClient: (newClient: B2BClient) => void;
  onDeleteClient: (id: string) => void;
  directClients: DirectClient[];
  onUpdateDirectClient: (updated: DirectClient) => void;
  onAddDirectClient: (newClient: DirectClient) => void;
  onDeleteDirectClient: (id: string) => void;
  invoices: FinancialInvoice[];
  reservations: Reservation[];
  boletos?: FlightTicket[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
  onNavigateToCobranzas?: (clientId: string) => void;
}

export default function ClientesView({
  clients,
  onUpdateClient,
  onAddClient,
  onDeleteClient,
  directClients,
  onUpdateDirectClient,
  onAddDirectClient,
  onDeleteDirectClient,
  invoices,
  reservations,
  boletos = [],
  roomTypes,
  ratePlans,
  detailedProperties,
  onNavigateToCobranzas
}: ClientesViewProps) {
  const [activeTab, setActiveTab] = useState<"b2b" | "directos">("b2b");

  return (
    <div className="space-y-6 font-sans">
      <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("b2b")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "b2b"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Clientes B2B
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("directos")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "directos"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Clientes Directos
        </button>
      </div>

      {activeTab === "b2b" ? (
        <ClientesB2BPanel
          clients={clients}
          onUpdateClient={onUpdateClient}
          onAddClient={onAddClient}
          onDeleteClient={onDeleteClient}
          invoices={invoices}
          reservations={reservations}
          boletos={boletos}
          roomTypes={roomTypes}
          ratePlans={ratePlans}
          detailedProperties={detailedProperties}
          onNavigateToCobranzas={onNavigateToCobranzas}
        />
      ) : (
        <ClientesDirectosPanel
          clients={directClients}
          onUpdateClient={onUpdateDirectClient}
          onAddClient={onAddDirectClient}
          onDeleteClient={onDeleteDirectClient}
          invoices={invoices}
          reservations={reservations}
          boletos={boletos}
          roomTypes={roomTypes}
          ratePlans={ratePlans}
          detailedProperties={detailedProperties}
          onNavigateToCobranzas={onNavigateToCobranzas}
        />
      )}
    </div>
  );
}

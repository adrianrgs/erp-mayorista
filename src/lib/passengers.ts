import { PassengerType, Reservation, ReservationPassenger, ServiceItem, ServiceType } from "../types";

const genPassengerId = () => `PAX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const createEmptyPassenger = (esTitular = false): ReservationPassenger => ({
  id: genPassengerId(),
  nombre: "",
  tipo: "Adulto",
  esTitular,
});

export const getTitular = (pasajeros: ReservationPassenger[]): ReservationPassenger | undefined =>
  pasajeros.find(p => p.esTitular) || pasajeros[0];

export const deriveHolderName = (pasajeros: ReservationPassenger[]): string =>
  (getTitular(pasajeros)?.nombre || "").trim();

export const markTitular = (pasajeros: ReservationPassenger[], id: string): ReservationPassenger[] =>
  pasajeros.map(p => ({ ...p, esTitular: p.id === id }));

/**
 * Reconstruye la lista de pasajeros de una reserva que todavía no tiene `pasajeros`
 * persistido, a partir de `holder` + nombres únicos ya escritos en los huéspedes de
 * Alojamiento. Pura, no persiste nada — se usa como fallback de lectura y como semilla
 * al entrar en modo edición de una reserva "legacy".
 */
export function derivePassengersFromLegacyReservation(res: Reservation | undefined | null): ReservationPassenger[] {
  if (!res) return [];
  if (res.pasajeros && res.pasajeros.length > 0) return res.pasajeros;

  const seen = new Map<string, ReservationPassenger>(); // key = nombre normalizado
  const norm = (s: string) => s.trim().toLowerCase();

  const holderName = (res.holder || "").trim();
  if (holderName) {
    seen.set(norm(holderName), { id: genPassengerId(), nombre: holderName, tipo: "Adulto", esTitular: true });
  }

  (res.servicios || [])
    .filter((s: ServiceItem) => s.tipo === ServiceType.ALOJAMIENTO)
    .forEach((s: ServiceItem) => {
      (s.detalles?.lodgingRooms || []).forEach((room: any) => {
        (room.guests || []).forEach((g: { name: string; type: "Adulto" | "Niño" }) => {
          const name = (g.name || "").trim();
          if (!name || seen.has(norm(name))) return;
          seen.set(norm(name), {
            id: genPassengerId(),
            nombre: name,
            tipo: (g.type || "Adulto") as PassengerType,
            esTitular: false,
          });
        });
      });
    });

  return Array.from(seen.values());
}

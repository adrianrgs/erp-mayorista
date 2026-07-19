// Calcula la fecha de vencimiento por defecto de una factura por cobrar.
//
// Regla: el vencimiento normalmente es el check-in del expediente (la mayoría de agencias paga
// antes de viajar). Pero si el check-in es hoy o ya pasó (p.ej. reservas para el mismo día), o el
// expediente no tiene check-in, cae a "fecha de emisión + días de crédito del cliente" (0 si no
// tiene crédito). El valor devuelto es editable por quien factura.
const isDate = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}/.test(s);
const dayOf = (s: string) => s.slice(0, 10);

export function computeDueDate(
  checkIn: string | undefined,
  diasCredito: number | undefined,
  emision: string,
): string {
  const emisionDay = isDate(emision) ? dayOf(emision) : new Date().toISOString().split("T")[0];

  // Check-in futuro → ese es el vencimiento.
  if (isDate(checkIn) && dayOf(checkIn) > emisionDay) return dayOf(checkIn);

  // Check-in hoy/pasado o inexistente → emisión + días de crédito.
  const base = new Date(emisionDay + "T00:00:00");
  if (isNaN(base.getTime())) return isDate(checkIn) ? dayOf(checkIn) : emisionDay;
  base.setDate(base.getDate() + (diasCredito || 0));
  return base.toISOString().split("T")[0];
}

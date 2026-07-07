import { useAuth } from "../context/AuthContext";
import { usePermissions } from "./usePermissions";
import { useDialog } from "../components/ui/DialogProvider";
import { nextSequentialId } from "../lib/idGenerator";
import { ProjectView } from "../types";
import { AccionPermiso, ReglaAutorizacion, SolicitudAutorizacion, RegistroAuditoria } from "../types/usuarios";

interface IntentarAccionOpts {
  modulo: ProjectView;
  accion: AccionPermiso;
  entidadTipo: string;
  entidadId: string;
  descripcion: string;
  ejecutar: () => void;
}

// Punto de entrada único para acciones sensibles: si el usuario ya tiene el
// permiso directo, ejecuta de inmediato; si no, y existe una regla de doble
// aprobación activa para ese módulo+acción, crea una solicitud pendiente en
// vez de ejecutar. Sin regla aplicable, simplemente informa que no hay permiso.
export function useAutorizacion(
  reglasAutorizacion: ReglaAutorizacion[],
  onCreateSolicitud: (solicitud: SolicitudAutorizacion) => void,
  onAddRegistroAuditoria: (registro: Omit<RegistroAuditoria, "createdAt">) => void,
) {
  const { usuario } = useAuth();
  const { puede } = usePermissions();
  const { showAlert } = useDialog();

  function intentarAccionSensible(opts: IntentarAccionOpts) {
    if (puede(opts.modulo, opts.accion)) {
      opts.ejecutar();
      return;
    }
    if (!usuario) return;

    const regla = reglasAutorizacion.find(r => r.modulo === opts.modulo && r.accion === opts.accion && r.activa);
    if (!regla) {
      showAlert({ title: "Sin permiso", message: "No tiene permiso para realizar esta acción y no hay una regla de autorización configurada para solicitarla.", type: "warning" });
      return;
    }

    const solicitud: SolicitudAutorizacion = {
      id: nextSequentialId("SOL", []),
      modulo: opts.modulo,
      accion: opts.accion,
      entidadTipo: opts.entidadTipo,
      entidadId: opts.entidadId,
      descripcion: opts.descripcion,
      solicitanteId: usuario.id,
      solicitanteNombre: usuario.nombre,
      rolAprobadorId: regla.rolAprobadorId,
      estado: "Pendiente",
      createdAt: new Date().toISOString(),
    };
    onCreateSolicitud(solicitud);
    onAddRegistroAuditoria({
      id: nextSequentialId("AUD", []),
      tipo: "SolicitudCreada",
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      detalle: `${opts.descripcion} — enviado a aprobación`,
    });
    showAlert({ title: "Enviado a aprobación", message: "No tiene permiso directo para esta acción. Se envió una solicitud de autorización al rol correspondiente.", type: "info" });
  }

  return { intentarAccionSensible };
}

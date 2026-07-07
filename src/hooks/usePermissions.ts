import { useAuth } from "../context/AuthContext";
import { ProjectView } from "../types";
import { AccionPermiso } from "../types/usuarios";

export function usePermissions() {
  const { usuario } = useAuth();

  const esAdministrador = !!usuario?.rol.esAdministrador;

  function puedeVerModulo(modulo: ProjectView): boolean {
    if (modulo === ProjectView.BUSCADOR) return true; // utilidad de navegación, sin gate
    if (!usuario) return false;
    if (esAdministrador) return true;
    if (modulo === ProjectView.CONFIGURACION) return false; // exclusivo del administrador
    return !!usuario.rol.permisos[modulo]?.includes(AccionPermiso.VER);
  }

  function puede(modulo: ProjectView, accion: AccionPermiso): boolean {
    if (!usuario) return false;
    if (esAdministrador) return true;
    if (modulo === ProjectView.CONFIGURACION) return false;
    return !!usuario.rol.permisos[modulo]?.includes(accion);
  }

  return { puede, puedeVerModulo, esAdministrador };
}

import { ProjectView } from "../types";

export enum AccionPermiso {
  VER = "ver",
  CREAR = "crear",
  EDITAR = "editar",
  ELIMINAR = "eliminar",
  APROBAR = "aprobar",
  ANULAR = "anular",
}

// Única fuente de verdad de qué acciones existen realmente por módulo — determina
// tanto los checkboxes que se muestran en "Permisos y Roles" como las acciones
// válidas al configurar una Regla de Autorización, evitando reglas huérfanas
// (ej. "Eliminar" en Proveedores, que no es una acción que exista en esa vista).
export const ACCIONES_POR_MODULO: Record<ProjectView, AccionPermiso[]> = {
  [ProjectView.PROPIEDADES]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR],
  [ProjectView.SERVICIOS_VARIOS]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR],
  [ProjectView.RESERVAS]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR, AccionPermiso.ANULAR],
  [ProjectView.VUELOS]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR, AccionPermiso.ANULAR],
  [ProjectView.OPERACIONES]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR],
  [ProjectView.CLIENTES]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR],
  [ProjectView.PROVEEDORES]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR],
  [ProjectView.ADMINISTRACION]: [AccionPermiso.VER],
  [ProjectView.FACTURACION]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.APROBAR, AccionPermiso.ANULAR],
  [ProjectView.COBRANZAS]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.APROBAR],
  [ProjectView.CUENTAS_PAGAR]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR],
  [ProjectView.CONTABILIDAD]: [AccionPermiso.VER, AccionPermiso.CREAR, AccionPermiso.EDITAR, AccionPermiso.ELIMINAR],
  [ProjectView.BUSCADOR]: [], // sin gate — utilidad de navegación, accesible siempre
  [ProjectView.CONFIGURACION]: [], // sin gate por matriz — acceso exclusivo vía Rol.esAdministrador
};

// Etiquetas visibles de cada módulo, tomadas del sidebar (App.tsx) — reutilizadas
// en la grilla de permisos para no duplicar/desincronizar nombres.
export const NOMBRE_MODULO: Record<ProjectView, string> = {
  [ProjectView.PROPIEDADES]: "Propiedades y Tarifas",
  [ProjectView.SERVICIOS_VARIOS]: "Servicios Varios",
  [ProjectView.RESERVAS]: "Reservas (Booking)",
  [ProjectView.VUELOS]: "Vuelos (Air Control)",
  [ProjectView.OPERACIONES]: "Ops. Receptivo",
  [ProjectView.CLIENTES]: "Clientes",
  [ProjectView.PROVEEDORES]: "Proveedores",
  [ProjectView.ADMINISTRACION]: "Administración / BI",
  [ProjectView.FACTURACION]: "Dpto. Facturación",
  [ProjectView.COBRANZAS]: "Cuentas por Cobrar",
  [ProjectView.CUENTAS_PAGAR]: "Cuentas por Pagar",
  [ProjectView.CONTABILIDAD]: "Contabilidad / Fiscal",
  [ProjectView.BUSCADOR]: "Buscador Global",
  [ProjectView.CONFIGURACION]: "Configuración",
};

export const NOMBRE_ACCION: Record<AccionPermiso, string> = {
  [AccionPermiso.VER]: "Ver",
  [AccionPermiso.CREAR]: "Crear",
  [AccionPermiso.EDITAR]: "Editar",
  [AccionPermiso.ELIMINAR]: "Eliminar",
  [AccionPermiso.APROBAR]: "Aprobar",
  [AccionPermiso.ANULAR]: "Anular",
};

export type PermissionMatrix = Partial<Record<ProjectView, AccionPermiso[]>>;

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  esAdministrador: boolean; // bypass total, incluida la gestión de Usuarios/Roles/Permisos/Configuración
  permisos: PermissionMatrix; // parseado desde permisosJson al leer del backend
  updatedAt?: string;
}

export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  email: string;
  rolId: string;
  activo: boolean;
  updatedAt?: string;
  // Sin passwordHash a propósito: ese dato nunca debe llegar al frontend.
}

// Lo que devuelven POST /auth/login y GET /auth/me — el usuario con su rol ya resuelto.
export interface UsuarioSesion {
  id: string;
  username: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface ReglaAutorizacion {
  id: string;
  modulo: ProjectView;
  accion: AccionPermiso;
  rolAprobadorId: string;
  activa: boolean;
  updatedAt?: string;
}

export type EstadoSolicitudAutorizacion = "Pendiente" | "Aprobada" | "Rechazada";

export interface SolicitudAutorizacion {
  id: string;
  modulo: ProjectView;
  accion: AccionPermiso;
  entidadTipo: string;
  entidadId: string;
  descripcion: string;
  solicitanteId: string;
  solicitanteNombre: string;
  rolAprobadorId: string;
  estado: EstadoSolicitudAutorizacion;
  comentarioResolucion?: string;
  resolutorId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type TipoRegistroAuditoria = "Login" | "CambioRolUsuario" | "CambioPermisosRol" | "SolicitudCreada" | "SolicitudResuelta";

export interface RegistroAuditoria {
  id: string;
  tipo: TipoRegistroAuditoria;
  usuarioId: string;
  usuarioNombre: string;
  detalle: string;
  createdAt: string;
}

// Espejo (backend) del modelo de permisos del cliente (src/types/usuarios.ts + ProjectView).
// El rol guarda `permisosJson` = { [modulo]: string[] } y `esAdministrador` (bypass total).
export enum Modulo {
  PROPIEDADES = 'propiedades',
  RESERVAS = 'reservas',
  VUELOS = 'vuelos',
  OPERACIONES = 'operaciones',
  ADMINISTRACION = 'administracion',
  CLIENTES = 'clientes',
  FACTURACION = 'facturacion',
  COBRANZAS = 'cobranzas',
  CUENTAS_PAGAR = 'cuentaspagar',
  SERVICIOS_VARIOS = 'servicios_varios',
  CONFIGURACION = 'configuracion',
  PROVEEDORES = 'proveedores',
  CONTABILIDAD = 'contabilidad',
}

export enum Accion {
  VER = 'ver',
  CREAR = 'crear',
  EDITAR = 'editar',
  ELIMINAR = 'eliminar',
  APROBAR = 'aprobar',
  ANULAR = 'anular',
}

import { SetMetadata } from '@nestjs/common';
import { Modulo, Accion } from './permisos';

export const PERMISO_KEY = 'requiere_permiso';

/**
 * Marca un endpoint como sensible: exige que el rol del usuario tenga la `accion` en AL MENOS UNO
 * de los `modulos` indicados (útil para endpoints compartidos como finances, usados por
 * facturación/cobranzas/cuentas). Se aplica con `@UseGuards(JwtAuthGuard, PermissionsGuard)`.
 * `esAdministrador` pasa siempre.
 */
export const RequierePermiso = (accion: Accion, ...modulos: Modulo[]) =>
  SetMetadata(PERMISO_KEY, { accion, modulos });

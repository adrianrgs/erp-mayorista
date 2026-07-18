import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { PERMISO_KEY } from './requiere-permiso.decorator';
import { Modulo } from './permisos';

/**
 * Autorización POR ROL en el servidor (antes solo se validaba en el cliente → bypass trivial con
 * un JWT válido). Lee el permiso requerido del decorador `@RequierePermiso`, carga el rol del
 * usuario (permisosJson + esAdministrador) desde Data Connect y autoriza. Debe ir DESPUÉS de
 * JwtAuthGuard (que puebla request.user). Cachea los roles ~30s para no consultar por request.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private cache: { at: number; roles: any[] } | null = null;

  constructor(
    private reflector: Reflector,
    private dc: DataConnectService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<{ accion: string; modulos: Modulo[] }>(PERMISO_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!meta) return true; // endpoint no marcado → basta el JWT (ya validado)

    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.rolId) throw new ForbiddenException('Usuario sin rol asignado');

    const rol = await this.getRol(user.rolId);
    if (!rol) throw new ForbiddenException('Rol no encontrado o inactivo');
    if (rol.esAdministrador) return true; // el administrador pasa siempre

    let permisos: Record<string, string[]> = {};
    try {
      permisos = rol.permisosJson ? JSON.parse(rol.permisosJson) : {};
    } catch {
      permisos = {};
    }
    // Pasa si tiene la acción en AL MENOS UNO de los módulos requeridos.
    const ok = (meta.modulos || []).some((m) => (permisos[m] || []).includes(meta.accion));
    if (!ok) {
      throw new ForbiddenException(`Sin permiso "${meta.accion}" en ${(meta.modulos || []).join(' / ')}`);
    }
    return true;
  }

  private async getRol(rolId: string) {
    const now = Date.now();
    if (!this.cache || now - this.cache.at > 30_000) {
      const data = await this.dc.executeQuery<{ rols: any[] }>('ListRoles');
      this.cache = { at: now, roles: data.rols || [] };
    }
    return this.cache.roles.find((r) => r.id === rolId && (r.activo === undefined || r.activo));
  }
}

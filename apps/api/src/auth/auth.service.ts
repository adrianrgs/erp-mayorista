import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private dc: DataConnectService,
    private auditoria: AuditoriaService,
  ) {}

  async login(username: string, password: string) {
    const data = await this.dc.executeQuery<{ usuarios: any[] }>('ListUsuarios');
    const user = (data.usuarios || []).find((u) => u.username === username);
    if (!user || !user.activo) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const sesion = await this.buildSesion(user);

    await this.auditoria.create({
      id: `audit-${Date.now()}`,
      tipo: 'Login',
      usuarioId: user.id,
      usuarioNombre: user.nombre,
      detalle: `Login exitoso (${username})`,
    });

    // Marca presencia inmediata al entrar (el heartbeat luego la mantiene fresca).
    await this.touchLastSeen(user.id);

    const payload = { sub: user.id, username: user.username, rolId: user.rolId };
    return { access_token: this.jwt.sign(payload), user: sesion };
  }

  /** Heartbeat de presencia: registra que el usuario sigue activo (Monitoreo de Accesos). */
  async heartbeat(userId: string) {
    await this.touchLastSeen(userId);
    return { ok: true };
  }

  private async touchLastSeen(userId: string) {
    try {
      await this.dc.executeMutation('UpdateUsuarioLastSeen', {
        id: userId,
        lastSeenAt: new Date().toISOString(),
      });
    } catch (e) {
      // La presencia es best-effort: no debe tumbar el login ni el heartbeat.
      console.error('[presence] no se pudo actualizar lastSeenAt', e);
    }
  }

  async me(userId: string) {
    const data = await this.dc.executeQuery<{ usuarios: any[] }>('ListUsuarios');
    const user = (data.usuarios || []).find((u) => u.id === userId);
    if (!user || !user.activo) throw new UnauthorizedException();
    return this.buildSesion(user);
  }

  private async buildSesion(user: any) {
    const roles = await this.dc.executeQuery<{ rols: any[] }>('ListRoles');
    const rolRaw = (roles.rols || []).find((r) => r.id === user.rolId);
    const rol = rolRaw
      ? { ...rolRaw, permisos: rolRaw.permisosJson ? JSON.parse(rolRaw.permisosJson) : {} }
      : { id: user.rolId, nombre: 'Sin Rol', esAdministrador: false, permisos: {} };
    return { id: user.id, username: user.username, nombre: user.nombre, email: user.email, rol };
  }
}

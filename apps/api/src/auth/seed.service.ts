import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

// Siembra el primer Rol "Administrador" + Usuario "admin" si la tabla Usuario
// está vacía. Resuelve el huevo-y-gallina: sin esto, con la BD vacía nadie
// podría loguearse para crear el primer usuario desde la UI. Idempotente —
// seguro de dejar corriendo en cada arranque.
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private dc: DataConnectService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const existentes = await this.dc.executeQuery<{ usuarios: any[] }>('ListUsuarios');
      if (existentes.usuarios?.length > 0) return;

      const rolId = 'rol-admin';
      await this.dc.executeMutation('InsertRol', {
        id: rolId,
        nombre: 'Administrador',
        descripcion: 'Acceso irrestricto a todos los módulos, incluida la gestión de usuarios y permisos.',
        esAdministrador: true,
        permisosJson: '{}',
        updatedAt: new Date().toISOString(),
      });

      const seedPassword = this.config.get<string>('SEED_ADMIN_PASSWORD', 'foratour2026');
      const passwordHash = await bcrypt.hash(seedPassword, 10);
      await this.dc.executeMutation('InsertUsuario', {
        id: 'usr-admin',
        username: 'admin',
        passwordHash,
        nombre: 'Administrador',
        email: 'admin@foratour.local',
        rolId,
        activo: true,
        updatedAt: new Date().toISOString(),
      });

      this.logger.warn('Usuario "admin" creado (seed inicial). Cambie la contraseña en el primer login.');
    } catch (e) {
      this.logger.error(`No se pudo verificar/sembrar el usuario administrador: ${e.message}`);
    }
  }
}

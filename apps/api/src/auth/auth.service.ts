import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Usuarios en memoria para arrancar. Reemplazar por tabla en BD en producción.
const USERS = [
  { id: '1', username: 'admin', password: 'foratour2026', role: 'admin' },
  { id: '2', username: 'operador', password: 'operador123', role: 'operator' },
];

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async login(username: string, password: string) {
    const user = USERS.find((u) => u.username === username && u.password === password);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}

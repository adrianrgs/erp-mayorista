import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getMe, isAuthenticated, logout } from "../lib/api";
import { UsuarioSesion } from "../types/usuarios";

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  setUsuario: (usuario: UsuarioSesion | null) => void;
  refrescarSesion: () => Promise<void>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescarSesion = async () => {
    if (!isAuthenticated()) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    try {
      const sesion = await getMe();
      setUsuario(sesion);
    } catch (e) {
      console.error("No se pudo rehidratar la sesión", e);
      logout();
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    refrescarSesion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, setUsuario, refrescarSesion, cerrarSesion: logout }}>
      {children}
    </AuthContext.Provider>
  );
}

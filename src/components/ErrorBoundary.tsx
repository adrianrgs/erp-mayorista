import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

/**
 * Boundary global: evita que una excepción en el render deje la app en pantalla blanca.
 * Muestra un fallback con opción de recargar y registra el error en consola.
 * (state/props se declaran explícitamente porque el proyecto no tiene @types/react para
 * los genéricos de componentes de clase; el comportamiento en runtime es el estándar de React.)
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  declare props: Props;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Excepción no controlada:", error, info?.componentStack);
  }

  private handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 460, textAlign: "center", background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#18181b", margin: "0 0 8px" }}>Ocurrió un error inesperado</h1>
          <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 20px", lineHeight: 1.5 }}>
            La aplicación encontró un problema y no pudo continuar. Puedes recargar para volver a intentarlo.
            Si el problema persiste, contacta al administrador.
          </p>
          <button onClick={this.handleReload}
            style={{ background: "#18181b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Recargar la aplicación
          </button>
        </div>
      </div>
    );
  }
}

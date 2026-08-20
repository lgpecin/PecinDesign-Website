import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "30px", color: "#ffffff", background: "#0a0c0e", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ color: "#ccff00", fontSize: "24px", marginBottom: "16px" }}>
              Ops! Ocorreu um problema ao carregar a página.
            </h2>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginBottom: "20px" }}>
              {this.state.error?.message || "Erro desconhecido"}
            </p>
            <div style={{ textAlign: "left", background: "#18181b", padding: "16px", borderRadius: "12px", border: "1px solid #27272a", overflow: "auto", maxHeight: "300px", fontSize: "12px", color: "#f87171" }}>
              <pre>{this.state.error?.stack}</pre>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                marginTop: "24px",
                padding: "12px 28px",
                background: "#ccff00",
                color: "#000000",
                border: "none",
                borderRadius: "9999px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

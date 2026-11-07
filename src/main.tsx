import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './app/styles.css';

class ErrorBoundary extends React.Component<React.PropsWithChildren, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-error">
        <h1>No pudimos abrir el editor</h1>
        <p>
          Los proyectos guardados siguen en este navegador. Recargá para intentar recuperar la
          sesión.
        </p>
        <pre>{this.state.error}</pre>
        <button onClick={() => location.reload()}>Recargar</button>
      </main>
    ) : (
      this.props.children
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.warn('No se pudo preparar el modo offline', error));
  });
}

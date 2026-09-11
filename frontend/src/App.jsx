import { useEffect, useState } from 'react';
import './App.css';

const MAX_COP = 2000000;
const API_URL = 'http://localhost:3001';

function App() {
  const [showFormPage, setShowFormPage] = useState(false);
  const [valor, setValor] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empleadoData, setEmpleadoData] = useState(null);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    
    if (!cedula.trim()) {
      setError('Por favor ingresa tu cédula');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/validar-cedula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedula: cedula.trim() })
      });

      const data = await response.json();

      if (data.valido) {
        setError('');
        setEmpleadoData(data.empleado);
        setShowFormPage(true);
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor. Asegúrate de que el backend está ejecutándose.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowFormPage(false);
    setCedula('');
    setValor('');
    setAceptaTerminos(false);
    setError('');
    setSubmitted(false);
  };

  const resetLogin = () => {
    setCedula('');
    setError('');
  };

  useEffect(() => {
    if (!showFormPage) {
      resetLogin();
    }
  }, [showFormPage]);

  const handleValorChange = (event) => {
    setValor(event.target.value);
    if (error) setError('');
    if (submitted) setSubmitted(false);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    if (!aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      setSubmitted(false);
      return;
    }

    const numero = Number(valor);

    if (!valor || Number.isNaN(numero) || numero <= 0) {
      setError('Ingresa un valor válido en pesos colombianos.');
      setSubmitted(false);
      return;
    }

    if (numero > MAX_COP) {
      setError('El valor no puede ser mayor a $2.000.000 COP.');
      setSubmitted(false);
      return;
    }

    setError('');
    setSubmitted(true);
  };

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  if (showFormPage) {
    return (
      <div className="app">
        <header className="navbar">
          <div className="logo">
            <img src="/ChatGPT Image 13 ago 2026, 23_40_33.png" alt="Logo del proyecto" className="logo-image" />
          </div>
        </header>

        <main className="page-container">
          <div className="form-card">
            <div className="page-header">
              <p className="eyebrow">Solicitud de Préstamo</p>
              <h1>Hola {empleadoData?.nombre}</h1>
              <p>Solicita un préstamo no mayor a $2.000.000 de pesos</p>
            </div>

            <form onSubmit={handleFormSubmit} className="amount-form">
              <div className="input-group">
                <label htmlFor="monto">Cantidad</label>
                <input
                  id="monto"
                  type="number"
                  min="0"
                  max={MAX_COP}
                  step="1000"
                  value={valor}
                  onChange={handleValorChange}
                />
                <small className="input-hint">Máximo permitido: $2.000.000 COP</small>
              </div>

              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(event) => setAceptaTerminos(event.target.checked)}
                />
                <span>Acepto los términos y condiciones</span>
              </label>

              {error && <p className="error-message">{error}</p>}

              {submitted && (
                <div className="success-message">
                  Valor registrado correctamente: {formatter.format(Number(valor))}
                </div>
              )}

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={handleBack}>
                  Volver
                </button>
                <button
                  type="submit"
                  className="login-button"
                  disabled={!aceptaTerminos}
                >
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="footer">
          <p>© 2026 Mi Proyecto. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <img src="/ChatGPT Image 13 ago 2026, 23_40_33.png" alt="Logo del proyecto" className="logo-image" />
        </div>

        <nav>
          <a href="#">Inicio</a>
        </nav>
      </header>

      <main className="login-container">
        <div className="login-wrap">
          <h2 className="brand-title">Zona Cash</h2>
          <div className="login-card">
            <div className="login-header">
              <h1>Ingresa tu cédula</h1>
              <p>Proporciona tu número de identificación</p>
            </div>

          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label htmlFor="cedula">Cédula</label>
              <input
                type="text"
                id="cedula"
                value={cedula}
                onChange={(event) => {
                  setCedula(event.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingrese su cédula"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'VALIDANDO...' : 'INGRESAR'}
            </button>
          </form>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 Mi Proyecto. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
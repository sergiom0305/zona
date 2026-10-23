import { useEffect, useState } from 'react';
import './App.css';

const MAX_COP = 2000000;
const MONTHLY_INTEREST_RATE = 0.02;
const MAX_INSTALLMENTS = 6;
const API_URL = 'http://localhost:3001';
const menuPages = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'conocenos', label: 'Conócenos' },
  { id: 'funciones', label: 'Funciones' },
  { id: 'preguntas', label: 'Preguntas frecuentes' },
  { id: 'contacto', label: 'Contacto' },
];
const getPageFromHash = () => {
  const pageId = window.location.hash.slice(1);
  return menuPages.some((page) => page.id === pageId) ? pageId : 'inicio';
};

function App() {
  const [showFormPage, setShowFormPage] = useState(false);
  const [activePage, setActivePage] = useState(getPageFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [valor, setValor] = useState('');
  const [cuotas, setCuotas] = useState('1');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
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
    setCuotas('1');
    setAceptaTerminos(false);
    setError('');
    setSubmitted(false);
    setReviewing(false);
  };

  useEffect(() => {
    const closeMenuOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const syncPageWithHash = () => setActivePage(getPageFromHash());

    window.addEventListener('keydown', closeMenuOnEscape);
    window.addEventListener('hashchange', syncPageWithHash);
    window.addEventListener('popstate', syncPageWithHash);
    return () => {
      window.removeEventListener('keydown', closeMenuOnEscape);
      window.removeEventListener('hashchange', syncPageWithHash);
      window.removeEventListener('popstate', syncPageWithHash);
    };
  }, []);

  const selectPage = (pageId) => {
    setActivePage(pageId);
    setMenuOpen(false);
    const pageUrl = pageId === 'inicio' ? window.location.pathname : `#${pageId}`;
    window.history.pushState(null, '', pageUrl);
  };

  const handleValorChange = (event) => {
    setValor(event.target.value);
    if (error) setError('');
    if (submitted) setSubmitted(false);
    setReviewing(false);
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
    setReviewing(true);
  };

  const handleConfirmLoan = () => {
    setSubmitted(true);
    setReviewing(false);
  };

  const calculateInstallment = (principal, months) => {
    const rate = MONTHLY_INTEREST_RATE;
    return principal * rate / (1 - (1 + rate) ** -months);
  };

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
  const loanAmount = Number(valor) || 0;
  const installmentCount = Number(cuotas);
  const monthlyPayment = loanAmount > 0
    ? Math.round(calculateInstallment(loanAmount, installmentCount))
    : 0;
  const totalToPay = monthlyPayment * installmentCount;
  const totalInterest = totalToPay - loanAmount;

  if (showFormPage) {
    return (
      <div className="app">
        <header className="navbar">
          <div className="logo">
            <img src="/ChatGPT Image 13 ago 2026, 23_40_33.png" alt="Logo del proyecto" className="logo-image" />
          </div>
        </header>

        <main className="page-container">
          <div className="form-card loan-process-card">
            <div className="page-header">
              <p className="eyebrow">Solicitud de Préstamo</p>
              <h1>Hola {empleadoData?.nombre}</h1>
              <p>Solicita un préstamo no mayor a $2.000.000 de pesos</p>
            </div>

            {submitted ? (
              <section className="loan-confirmed" aria-live="polite">
                <div className="confirmation-mark" aria-hidden="true">✓</div>
                <p className="confirmation-kicker">Solicitud confirmada</p>
                <h2>Confirmaste tu solicitud</h2>
                <p className="confirmation-copy">
                  La confirmación se completó en esta interfaz. El equipo de tu empresa deberá continuar
                  con la revisión y confirmarte las condiciones finales.
                </p>
                <div className="loan-summary confirmation-summary">
                  <div><span>Monto solicitado</span><strong>{formatter.format(loanAmount)}</strong></div>
                  <div><span>Plazo</span><strong>{installmentCount} {installmentCount === 1 ? 'mes' : 'meses'}</strong></div>
                  <div><span>Cuota mensual estimada</span><strong>{formatter.format(monthlyPayment)}</strong></div>
                  <div><span>Total estimado</span><strong>{formatter.format(totalToPay)}</strong></div>
                </div>
                <button type="button" className="login-button confirmation-finish" onClick={handleBack}>
                  Finalizar
                </button>
              </section>
            ) : reviewing ? (
              <section className="loan-review" aria-labelledby="loan-review-title">
                <p className="review-kicker">Revisa antes de confirmar</p>
                <h2 id="loan-review-title">Resumen de tu préstamo</h2>
                <p className="review-intro">Confirma que el monto y el plazo sean correctos.</p>
                <div className="loan-summary">
                  <div><span>Monto solicitado</span><strong>{formatter.format(loanAmount)}</strong></div>
                  <div><span>Plazo elegido</span><strong>{installmentCount} {installmentCount === 1 ? 'mes' : 'meses'}</strong></div>
                  <div><span>Tasa mensual</span><strong>2%</strong></div>
                  <div className="installment-highlight"><span>Cuota mensual estimada</span><strong>{formatter.format(monthlyPayment)}</strong></div>
                  <div><span>Intereses estimados</span><strong>{formatter.format(totalInterest)}</strong></div>
                  <div className="summary-total"><span>Total estimado a pagar</span><strong>{formatter.format(totalToPay)}</strong></div>
                </div>
                <p className="calculation-note">
                  Cálculo estimado con cuota fija y tasa efectiva mensual del 2%. El valor definitivo
                  puede variar según las condiciones aprobadas por tu empresa.
                </p>
                {error && <p className="error-message">{error}</p>}
                <div className="button-row">
                  <button type="button" className="secondary-button" onClick={() => setReviewing(false)}>
                    Editar solicitud
                  </button>
                  <button type="button" className="login-button" onClick={handleConfirmLoan}>
                    Confirmar solicitud
                  </button>
                </div>
              </section>
            ) : (
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
                    required
                  />
                  <small className="input-hint">Máximo permitido: $2.000.000 COP</small>
                </div>

                <div className="input-group">
                  <label htmlFor="cuotas">Número de cuotas</label>
                  <select
                    id="cuotas"
                    value={cuotas}
                    onChange={(event) => {
                      setCuotas(event.target.value);
                      setReviewing(false);
                    }}
                  >
                    {Array.from({ length: MAX_INSTALLMENTS }, (_, index) => index + 1).map((months) => (
                      <option key={months} value={months}>
                        {months} {months === 1 ? 'mes' : 'meses'}
                      </option>
                    ))}
                  </select>
                  <small className="input-hint">Plazo máximo: {MAX_INSTALLMENTS} meses · Interés mensual: 2%</small>
                </div>

                {loanAmount > 0 && loanAmount <= MAX_COP && (
                  <div className="installment-preview" aria-live="polite">
                    <span>Cuota mensual estimada</span>
                    <strong>{formatter.format(monthlyPayment)}</strong>
                    <small>{installmentCount} {installmentCount === 1 ? 'cuota' : 'cuotas'} · Total estimado {formatter.format(totalToPay)}</small>
                  </div>
                )}

                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(event) => setAceptaTerminos(event.target.checked)}
                  />
                  <span>Acepto los términos y condiciones</span>
                </label>

                {error && <p className="error-message">{error}</p>}

                <div className="button-row">
                  <button type="button" className="secondary-button" onClick={handleBack}>
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="login-button"
                    disabled={!aceptaTerminos}
                  >
                    Revisar solicitud
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>

        <footer className="footer">
          <p>© 2026 Zona Cash. Información de demostración sujeta a cambios.</p>
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

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="side-menu"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="menu-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="side-menu" id="side-menu" aria-label="Navegación principal">
            <div className="side-menu-header">
              <span>Explorar</span>
              <button
                type="button"
                className="menu-close"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="side-menu-nav">
              {menuPages.map((page) => (
                <button
                  type="button"
                  key={page.id}
                  className={activePage === page.id ? 'side-menu-link active' : 'side-menu-link'}
                  aria-current={activePage === page.id ? 'page' : undefined}
                  onClick={() => selectPage(page.id)}
                >
                  {page.label}
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {activePage === 'inicio' ? (
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
      ) : activePage === 'conocenos' ? (
        <main className="company-page about-page">
          <section className="company-hero">
            <div className="company-hero-copy">
              <p className="eyebrow">Finanzas cercanas para quienes cuidan</p>
              <h1>Una forma más sencilla de acompañar a quienes mantienen todo seguro.</h1>
              <p className="company-lead">
                Zona Cash conecta a los empleados del sector de la seguridad privada con una ruta clara
                para solicitar apoyo financiero, en coordinación con su empresa.
              </p>
              <button type="button" className="company-cta" onClick={() => selectPage('inicio')}>
                Iniciar solicitud <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <span className="hero-visual-kicker">ZONA CASH</span>
              <span className="hero-visual-mark">Z</span>
              <span className="hero-visual-caption">Claridad para avanzar.</span>
            </div>
          </section>

          <section className="content-band about-story">
            <div className="section-heading">
              <p className="eyebrow">Conócenos</p>
              <h2>El respaldo también debe ser fácil de entender.</h2>
            </div>
            <div className="story-copy">
              <p>
                Quienes trabajan en seguridad cumplen una labor esencial y exigente. Frente a un gasto
                inesperado o una necesidad familiar, encontrar orientación financiera puede ser
                complicado. Zona Cash nace para acercar esa posibilidad mediante una experiencia digital
                sencilla, pensada para funcionar junto a las empresas del sector.
              </p>
              <p>
                Nuestro propósito es hacer más claro el primer paso: validar la vinculación, conocer las
                condiciones aplicables y registrar una solicitud desde un mismo lugar. La plataforma
                acompaña el proceso; la evaluación y disponibilidad siempre dependen de las políticas
                vigentes y de la confirmación correspondiente.
              </p>
            </div>
          </section>

          <section className="content-band values-band">
            <div>
              <span className="value-index">01</span>
              <h3>Claridad</h3>
              <p>Información comprensible para que cada persona sepa qué está solicitando y cuáles son los siguientes pasos.</p>
            </div>
            <div>
              <span className="value-index">02</span>
              <h3>Cercanía</h3>
              <p>Una experiencia pensada para las necesidades de los empleados y las empresas del sector de seguridad.</p>
            </div>
            <div>
              <span className="value-index">03</span>
              <h3>Responsabilidad</h3>
              <p>El acceso a una solicitud no representa aprobación automática ni reemplaza la revisión de sus condiciones.</p>
            </div>
          </section>
        </main>
      ) : activePage === 'funciones' ? (
        <main className="company-page functions-page">
          <section className="inner-page-hero">
            <p className="eyebrow">Una experiencia digital, paso a paso</p>
            <h1>Funciones diseñadas para hacer más simple la gestión.</h1>
            <p className="company-lead">
              Desde la validación inicial hasta el registro de una solicitud, Zona Cash organiza el proceso
              en una experiencia directa para el empleado y coordinada con su empresa.
            </p>
          </section>

          <section className="function-list" aria-label="Funciones de Zona Cash">
            <article className="function-row">
              <span className="function-number">01</span>
              <div>
                <h2>Validación de vinculación</h2>
                <p>El empleado ingresa su número de identificación para verificar si sus datos están registrados y si puede continuar con el flujo habilitado por su empresa.</p>
              </div>
              <span className="function-tag">Disponible</span>
            </article>
            <article className="function-row">
              <span className="function-number">02</span>
              <div>
                <h2>Registro de solicitud</h2>
                <p>Cuando la validación es satisfactoria, la plataforma permite indicar el monto deseado dentro del límite configurado y dejar constancia de la solicitud.</p>
              </div>
              <span className="function-tag">Flujo actual</span>
            </article>
            <article className="function-row">
              <span className="function-number">03</span>
              <div>
                <h2>Orientación sobre el proceso</h2>
                <p>La información de ayuda explica los pasos generales y dirige al usuario a los canales definidos por su empresa para resolver dudas sobre evaluación y seguimiento.</p>
              </div>
              <span className="function-tag">Acompañamiento</span>
            </article>
            <article className="function-row future-function">
              <span className="function-number">04</span>
              <div>
                <h2>Mercado para el hogar</h2>
                <p>Como evolución futura, Zona Cash proyecta un espacio para explorar electrodomésticos y productos electrónicos para el hogar, con información y condiciones transparentes antes de cualquier compra.</p>
              </div>
              <span className="function-tag">En desarrollo</span>
            </article>
          </section>

          <aside className="notice-band">
            <strong>Importante</strong>
            <p>Las funciones disponibles, requisitos, montos y condiciones pueden variar según los acuerdos y lineamientos de cada empresa.</p>
          </aside>
        </main>
      ) : activePage === 'preguntas' ? (
        <main className="company-page faq-page">
          <section className="inner-page-hero faq-intro">
            <p className="eyebrow">Centro de ayuda</p>
            <h1>Preguntas frecuentes</h1>
            <p className="company-lead">Respuestas claras para entender cómo funciona Zona Cash y qué esperar en cada etapa.</p>
          </section>

          <section className="faq-list" aria-label="Preguntas frecuentes sobre Zona Cash">
            <details>
              <summary>¿Qué es Zona Cash?</summary>
              <p>Es una plataforma digital orientada a facilitar el acceso y la gestión de solicitudes de apoyo financiero para empleados de empresas vinculadas al sector de la seguridad. La disponibilidad depende de la participación y las condiciones definidas por cada empresa.</p>
            </details>
            <details>
              <summary>¿Quién puede usar la aplicación?</summary>
              <p>Empleados cuya información haya sido registrada por una empresa participante y que cumplan los requisitos vigentes. La validación inicial permite comprobar si el usuario puede avanzar en el flujo disponible.</p>
            </details>
            <details>
              <summary>¿Ingresar mi cédula significa que el crédito está aprobado?</summary>
              <p>No. La validación de identidad o vinculación solo habilita el siguiente paso. Una solicitud puede requerir revisiones adicionales y no garantiza aprobación, desembolso ni una fecha de respuesta.</p>
            </details>
            <details>
              <summary>¿Qué monto puedo solicitar?</summary>
              <p>El formulario actual muestra un límite de hasta $2.000.000 COP. El monto que cada persona pueda solicitar, así como las condiciones y disponibilidad, debe confirmarse con su empresa y puede estar sujeto a cambios.</p>
            </details>
            <details>
              <summary>¿Qué hago si mis datos no aparecen o no puedo continuar?</summary>
              <p>Verifica que hayas ingresado correctamente tu número de identificación. Si el problema continúa, comunícate con el área de gestión humana o con el responsable de Zona Cash en tu empresa para revisar el registro.</p>
            </details>
            <details>
              <summary>¿Cómo consulto el estado de mi solicitud?</summary>
              <p>En esta versión inicial, la plataforma permite registrar la solicitud, pero el seguimiento debe confirmarse a través del canal que indique tu empresa. Conserva cualquier comprobante o comunicación que recibas.</p>
            </details>
            <details>
              <summary>¿Ya puedo comprar electrodomésticos en el mercado virtual?</summary>
              <p>Aún no. El mercado virtual de electrodomésticos y electrónicos para el hogar es una iniciativa futura. Cuando esté disponible se comunicarán sus productos, condiciones de compra, entregas y canales de soporte.</p>
            </details>
            <details>
              <summary>¿Cómo se protegen mis datos personales?</summary>
              <p>El tratamiento de datos debe realizarse conforme a la política de privacidad y las autorizaciones aplicables de la empresa participante. Antes de usar el servicio, consulta los avisos y documentos oficiales que tu empresa ponga a disposición.</p>
            </details>
          </section>

          <div className="faq-contact-note">
            <p>¿Tu duda no aparece aquí?</p>
            <button type="button" className="page-home-link" onClick={() => selectPage('contacto')}>
              Ver canales de contacto <span aria-hidden="true">→</span>
            </button>
          </div>
        </main>
      ) : (
        <main className="company-page contact-page">
          <section className="inner-page-hero">
            <p className="eyebrow">Estamos para orientarte</p>
            <h1>Hablemos.</h1>
            <p className="company-lead">Para resolver dudas sobre tu registro, el proceso de solicitud o la participación de tu empresa, puedes acudir a estos canales de referencia.</p>
          </section>

          <div className="demo-notice">
            <span aria-hidden="true">i</span>
            <p><strong>Información de demostración.</strong> Los nombres y datos que aparecen abajo son ficticios y solo ilustran cómo podría verse esta sección. No corresponden a personas ni canales reales.</p>
          </div>

          <section className="contact-grid" aria-label="Contactos de demostración">
            <article className="contact-item">
              <span className="contact-label">Atención a usuarios</span>
              <h2>Laura Méndez</h2>
              <p>Equipo de experiencia Zona Cash</p>
              <a href="mailto:orientacion@zonacash.example">orientacion@zonacash.example</a>
              <span className="contact-hours">Lunes a viernes · 8:00 a. m. – 5:00 p. m.</span>
            </article>
            <article className="contact-item">
              <span className="contact-label">Alianzas empresariales</span>
              <h2>Andrés Rojas</h2>
              <p>Relación con empresas participantes</p>
              <a href="mailto:empresas@zonacash.example">empresas@zonacash.example</a>
              <span className="contact-hours">Orientación para áreas de gestión humana</span>
            </article>
            <article className="contact-item contact-item-dark">
              <span className="contact-label">¿No puedes validar tus datos?</span>
              <h2>Contacta a tu empresa</h2>
              <p>El equipo de gestión humana o el enlace interno de bienestar puede confirmar si tu registro está actualizado y cuál es el canal adecuado para dar seguimiento.</p>
              <button type="button" className="contact-action" onClick={() => selectPage('preguntas')}>
                Consultar preguntas frecuentes <span aria-hidden="true">→</span>
              </button>
            </article>
          </section>
        </main>
      )}

      <footer className="footer">
        <p>© 2026 Zona Cash. Información de demostración sujeta a cambios.</p>
      </footer>
    </div>
  );
}

export default App;
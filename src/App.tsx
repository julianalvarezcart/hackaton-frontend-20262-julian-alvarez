import { useState } from 'react';

export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  if (isLogged) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dashboard de One Piece</h1>
          <p style={{ marginBottom: '1rem' }}>¡Bienvenido al Grand Line, tripulación!</p>
          <button onClick={() => setIsLogged(false)} style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }}>
      <form onSubmit={(e) => { e.preventDefault(); setIsLogged(true); }} style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.5rem', width: '24rem', border: '1px solid #374151' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#fbbf24' }}>
          {isRegister ? 'Registrar Tripulación' : 'Log Pose Console'}
        </h2>
        
        {isRegister && (
          <input type="text" placeholder="Nombre de la Tripulación" required style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '0.25rem', backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white' }} />
        )}
        
        <input type="email" placeholder="Email" required style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '0.25rem', backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white' }} />
        <input type="password" placeholder="Contraseña" required style={{ width: '100%', padding: '0.5rem', marginBottom: '1.5rem', borderRadius: '0.25rem', backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white' }} />
        
        <button type="submit" style={{ width: '100%', backgroundColor: '#d97706', color: 'black', fontWeight: 'bold', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
          {isRegister ? 'Zarpar' : 'Entrar'}
        </button>
        
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes tripulación? Regístrate'}
          </button>
        </div>
      </form>
    </div>
  );
}
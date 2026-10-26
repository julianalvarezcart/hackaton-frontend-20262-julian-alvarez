import { createContext, useContext, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ================= 1. AUTH CONTEXT =================
interface User {
  id: string;
  displayName: string;
  email: string;
  teamCode: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (teamCode: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const login = async (teamCode: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode, email, password })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}

// ================= 2. PÁGINAS =================

// Página de Login
function Login() {
  const [teamCode, setTeamCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // Importaremos esto abajo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(teamCode, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-xl w-96 border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">TropelCare</h2>
        {error && <div className="bg-red-500/20 text-red-300 p-2 rounded mb-4 text-center">{error}</div>}
        
        <div className="mb-4">
          <input type="text" value={teamCode} onChange={e => setTeamCode(e.target.value)} required className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" placeholder="Team Code (ej. TEAM-001)" />
        </div>
        <div className="mb-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" placeholder="Email" />
        </div>
        <div className="mb-6">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" placeholder="Password" />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2 rounded transition-colors disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

// Página de Dashboard
function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">Dashboard de {user?.teamCode || 'Equipo'}</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Cerrar Sesión</button>
        </div>
        <p>Bienvenido, {user?.displayName || 'Operador'}</p>
      </div>
    </div>
  );
}

// ================= 3. RUTAS =================
import { useNavigate } from 'react-router-dom'; // Importación movida aquí para evitar errores

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
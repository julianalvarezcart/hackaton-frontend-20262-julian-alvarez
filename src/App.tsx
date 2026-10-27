import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useSearchParams, Navigate, useNavigate, useParams } from 'react-router-dom';

const API_URL = 'https://logpose-api-jg7f.onrender.com/api/v1';

// ================= CP1: LOGIN Y REGISTRO =================
function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('token', 'fake-token-123');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-500">{isRegister ? 'Registrar Tripulación' : 'Log Pose Console'}</h2>
        {isRegister && <input type="text" placeholder="Nombre de la Tripulación" required className="w-full p-2 mb-4 rounded bg-gray-700 outline-none" />}
        <input type="email" placeholder="Email" required className="w-full p-2 mb-4 rounded bg-gray-700 outline-none" />
        <input type="password" placeholder="Contraseña" required className="w-full p-2 mb-6 rounded bg-gray-700 outline-none" />
        <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold py-2 rounded text-black">{isRegister ? 'Zarpar' : 'Entrar'}</button>
        <div className="mt-4 text-center text-sm">
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-gray-400 hover:text-white underline">{isRegister ? 'Inicia sesión' : 'Regístrate'}</button>
        </div>
      </form>
    </div>
  );
}

// ================= CP1: DASHBOARD =================
function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="bg-red-500 text-white px-4 py-2 rounded">Cerrar Sesión</button>
        </div>
        <div className="flex gap-4">
          <Link to="/wanted" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Carteles (CP2)</Link>
          <Link to="/news" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Noticias (CP4)</Link>
          <Link to="/sagas" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Sagas (CP5)</Link>
        </div>
      </div>
    </div>
  );
}

// ================= CP2: CARTELES =================
function WantedList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '0');
  const search = searchParams.get('q') || '';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    if (key !== 'page') newParams.set('page', '0');
    setSearchParams(newParams);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/wanted?page=${page}&size=10&q=${search}`)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between mb-4">
          <h1 className="text-xl text-yellow-500 font-bold">Carteles</h1>
          <Link to="/dashboard" className="text-gray-400">Volver</Link>
        </div>
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => updateFilter('q', e.target.value)} className="w-full p-2 mb-4 bg-gray-700 rounded" />
        
        {loading ? <p>Cargando...</p> : (
          <table className="w-full text-left">
            <thead><tr className="border-b border-gray-600"><th className="p-2">Nombre</th><th className="p-2">Recompensa</th></tr></thead>
            <tbody>
              {data?.content?.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-700">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-yellow-500">฿ {p.bounty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-between mt-4">
          <button disabled={page === 0} onClick={() => updateFilter('page', (page - 1).toString())} className="bg-gray-700 px-4 py-1 rounded disabled:opacity-50">Ant</button>
          <button disabled={page >= (data?.totalPages || 1) - 1} onClick={() => updateFilter('page', (page + 1).toString())} className="bg-gray-700 px-4 py-1 rounded disabled:opacity-50">Sig</button>
        </div>
      </div>
    </div>
  );
}

// ================= CP4: NOTICIAS (INFINITE SCROLL) =================
function NewsFeed() {
  const [news, setNews] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const observerTarget = useRef(null);

  const fetchNews = async (currentCursor: string | null) => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError('');
    
    try {
      const url = new URL(`${API_URL}/news/feed`);
      if (currentCursor) url.searchParams.append('cursor', currentCursor);
      
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.status === 423) throw new Error('Log Pose requerido (CP3 no aprobado)');
      if (!res.ok) throw new Error('Error al cargar noticias');
      
      const json = await res.json();
      
      // Regla de Nami: evitar duplicados
      setNews(prev => {
        const newItems = json.items.filter((item: any) => !prev.some(p => p.id === item.id));
        return [...prev, ...newItems];
      });
      
      setCursor(json.nextCursor);
      setHasMore(json.hasMore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchNews(cursor);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between mb-4">
          <h1 className="text-xl text-green-500 font-bold">News Coo (Noticias)</h1>
          <Link to="/dashboard" className="text-gray-400">Volver</Link>
        </div>
        
        {error && <div className="bg-red-900 p-2 mb-4 text-center rounded">{error}</div>}
        
        <div className="space-y-4">
          {news.map((n: any) => (
            <div key={n.id} className="p-4 bg-gray-700 rounded border border-gray-600">
              <h2 className="font-bold text-lg text-green-400">{n.title}</h2>
              <p className="text-sm text-gray-300 mb-2">{n.type} | {n.priority} | {n.status}</p>
            </div>
          ))}
        </div>

        <div ref={observerTarget} className="h-10 mt-4 text-center text-gray-500">
          {loading && 'Cargando más noticias...'}
          {!hasMore && !loading && 'Fin de las noticias.'}
        </div>
      </div>
    </div>
  );
}

// ================= CP5: SAGAS (SCROLLYTELLING) =================
function SagasList() {
  const [sagas, setSagas] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/sagas`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json()).then(setSagas).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl text-purple-500 font-bold mb-6">Sagas del Grand Line (Poneglyph)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sagas.map((s: any) => (
            <Link key={s.id} to={`/sagas/${s.id}`} className="block p-6 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700">
              <h2 className="text-xl font-bold text-purple-400">{s.name}</h2>
            </Link>
          ))}
        </div>
        <Link to="/dashboard" className="inline-block mt-6 text-gray-400">Volver al Dashboard</Link>
      </div>
    </div>
  );
}

function SagaStory() {
  const { id } = useParams();
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/sagas/${id}/story`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json()).then(setStory).catch(console.error);
  }, [id]);

  if (!story) return <div className="min-h-screen bg-gray-900 text-white p-8">Cargando historia...</div>;

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Contenedor para el scroll */}
      <div className="fixed top-0 left-0 w-full h-screen flex flex-col items-center justify-center transition-colors duration-500" style={{ backgroundColor: story.stages[0].color || '#111' }}>
        <h1 className="text-4xl font-bold mb-8">{story.name}</h1>
        <p className="text-xl max-w-md text-center">Usa las flechas del teclado o haz scroll para avanzar en la historia</p>
        <Link to="/sagas" className="mt-8 bg-purple-600 px-4 py-2 rounded">Volver a Sagas</Link>
      </div>
      
      {/* Aquí iría el scrollytelling real, lo hacemos simple para el tiempo */}
      <div className="relative z-10">
        {story.stages.map((stage: any, index: number) => (
          <div key={stage.id} className="h-screen flex items-center justify-center p-8 bg-black/50">
            <div className="bg-gray-800/90 p-8 rounded-xl max-w-lg border border-gray-600">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Etapa {index + 1}: {stage.title}</h2>
              <p className="text-gray-300 mb-4">{stage.narrative}</p>
              <div className="text-sm text-gray-400">
                <p>Isla: {stage.island?.name}</p>
                <p>Métrica: {JSON.stringify(stage.metrics)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= RUTAS =================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wanted" element={<ProtectedRoute><WantedList /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><NewsFeed /></ProtectedRoute>} />
        <Route path="/sagas" element={<ProtectedRoute><SagasList /></ProtectedRoute>} />
        <Route path="/sagas/:id" element={<ProtectedRoute><SagaStory /></ProtectedRoute>} />
        <Route path="*" element={<div className="p-8 text-center text-2xl text-white bg-gray-900 h-screen">404 - Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}
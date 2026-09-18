import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-[#e9e4dc] placeholder:text-[#5a554e] focus:outline-none focus:border-[#ff6b1a]/40 focus:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] transition-all disabled:opacity-50';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (status === 400) {
        setError(err.response?.data?.error || 'Datos inválidos');
      } else {
        setError('No se pudo iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl tracking-wide">
            <span className="text-[#ff6b1a]">SETT</span>
            <span className="text-white">FLIX</span>
          </h1>
          <p className="text-[#8f8a82] text-sm mt-2">
            Inicia sesión para explorar el catálogo
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#161616] border border-white/5 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm text-[#8f8a82] mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              className={INPUT_CLASS}
              placeholder="Tu usuario"
            />
          </div>

          <div>
            <label className="block text-sm text-[#8f8a82] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className={INPUT_CLASS}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#ff6b1a] text-white font-medium hover:bg-[#ff8533] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Factory, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/dashboard' : '/operator');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-ruam-dark">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ruam-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ruam-gold to-amber-600 mb-4 shadow-2xl shadow-ruam-gold/20">
            <Factory size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-ruam-gold via-amber-400 to-yellow-300 bg-clip-text text-transparent">
            INDUSTRIAS RUAM
          </h1>
          <p className="text-sm text-gray-500 mt-2">Plataforma de Gestión MTO — Chinchao, Huánuco</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Usuario</label>
              <input className="input-field" placeholder="admin / operario1" value={username}
                onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Contraseña</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-12" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-gray-600 text-center">Credenciales demo:</p>
            <div className="flex gap-3 mt-2 justify-center">
              <button onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors">
                👔 Admin
              </button>
              <button onClick={() => { setUsername('operario1'); setPassword('op123'); }}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors">
                🔧 Operario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

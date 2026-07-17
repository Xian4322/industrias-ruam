import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Factory, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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
      {/* Background image */}
      <div className="absolute inset-0">
        <img src="/bg-login.png" alt="" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 ${isDark
          ? 'bg-gradient-to-br from-ruam-dark/90 via-ruam-navy/80 to-ruam-dark/90'
          : 'bg-gradient-to-br from-white/70 via-slate-100/60 to-white/70'
        }`} />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ruam-gold/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="absolute top-6 right-6 z-10 p-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
        {isDark ? (
          <Sun size={20} className="text-ruam-gold group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon size={20} className="text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ruam-gold to-amber-600 mb-4 shadow-2xl shadow-ruam-gold/30">
            <Factory size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-ruam-gold via-amber-400 to-yellow-300 bg-clip-text text-transparent">
            INDUSTRIAS RUAM
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Plataforma de Gestión MTO — Chinchao, Huánuco
          </p>
        </div>

        {/* Login Form */}
        <div className={`backdrop-blur-2xl rounded-2xl p-8 border shadow-2xl ${isDark
          ? 'bg-ruam-navy/70 border-white/10'
          : 'bg-white/80 border-slate-200/60 shadow-slate-300/30'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Usuario</label>
              <input className="input-field" placeholder="admin / operario1" value={username}
                onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Contraseña</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-12" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}>
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

          <div className={`mt-6 pt-5 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <p className={`text-xs text-center ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>Credenciales demo:</p>
            <div className="flex gap-3 mt-2 justify-center">
              <button onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                👔 Admin
              </button>
              <button onClick={() => { setUsername('operario1'); setPassword('op123'); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                🔧 Operario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

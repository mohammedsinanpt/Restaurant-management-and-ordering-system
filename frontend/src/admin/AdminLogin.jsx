import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../context/UserContext';

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ');
  return 'Something went wrong. Please try again.';
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.is_staff) {
        logout();
        setError('This account does not have staff access.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
             <Lock className="w-8 h-8 text-orange-500" />
           </div>
           <h2 className="text-2xl font-bold text-white">Staff Portal</h2>
           <p className="text-zinc-500">Sign in with your staff account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
           <input
             type="email"
             placeholder="Staff email"
             required
             value={email}
             onChange={e => setEmail(e.target.value)}
             className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-orange-500 outline-none"
           />
           <div className="relative">
             <input
               type={showPassword ? 'text' : 'password'}
               placeholder="Password"
               required
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full p-4 pr-12 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-orange-500 outline-none"
             />
             <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none p-1"
             >
               {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
             </button>
           </div>
           <button
             disabled={loading}
             className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing In...</> : 'Access Dashboard'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

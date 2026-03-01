import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple mock auth
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      alert('Invalid credentials');
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
           <p className="text-zinc-500">Enter secure access code</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
           <input 
             type="password" 
             placeholder="Passcode" 
             value={password}
             onChange={e => setPassword(e.target.value)}
             className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-orange-500 outline-none"
           />
           <button className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors">
             Access Dashboard
           </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
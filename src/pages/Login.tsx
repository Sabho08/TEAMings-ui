import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import BinaryLoader from '../components/BinaryLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLogin && password.length < 6) {
        setError('Security code must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        if (response.data.user) {
          localStorage.setItem('teamings_user', JSON.stringify(response.data.user));
          localStorage.setItem('isLoggedIn', 'true');
          onLogin(response.data.user);
        } else {
          setError('Authentication failed: Missing user data');
        }
      } else {
        await axios.post(`${API_BASE_URL}/api/auth/signup`, { 
          email, 
          password, 
          full_name: fullName, 
          username 
        });
        setIsLogin(true);
        setError('Account created. Please log in.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Subtle Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]"></div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <BinaryLoader text="Authenticating Team..." />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-card bg-zinc-950/40 relative z-10 border border-zinc-800"
      >
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-2xl shadow-white/10">
            <span className="material-symbols-outlined text-black text-4xl">terminal</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-display font-medium text-white tracking-tight">TEAMings</h1>
            <p className="text-zinc-500 mt-1 uppercase text-[10px] tracking-[0.2em]">Secure Team Interface</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-5 overflow-hidden"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Username</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe_dev"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Security Code</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-[11px] font-medium bg-red-500/10 border border-red-500/20 py-2 px-3 rounded">
              {error}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 mt-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Create Account')}
            {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
          <p className="text-[11px] text-zinc-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-white font-bold hover:underline"
            >
              {isLogin ? 'Request Access' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Footer text */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] text-zinc-800 font-mono tracking-widest uppercase">
          Proprietary Intelligence Grid / V3.2.1
        </p>
      </div>
    </div>
  );
};

export default Login;

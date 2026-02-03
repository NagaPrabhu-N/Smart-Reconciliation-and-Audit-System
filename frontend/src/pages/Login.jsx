// src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://smart-reconciliation-and-audit-syst.vercel.app/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard'); 
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black font-sans">
      <div className="bg-white p-10 rounded-md shadow-2xl border border-gray-200 w-96">
        <h2 className="text-3xl font-bold mb-8 text-center text-black tracking-tight border-b-2 border-black pb-4">Smart Reconciliation & Audit System</h2>
        {error && (
            <div className="bg-black text-white p-3 mb-6 rounded-md text-sm font-medium text-center">
                {error}
            </div>
        )}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-black font-bold mb-2 text-sm uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-gray-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
            />
          </div>
          <div>
            <label className="block text-black font-bold mb-2 text-sm uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-gray-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-black text-white p-3 rounded-md hover:bg-gray-800 transition font-bold tracking-wide mt-4"
          >
            LOGIN
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Demo Credentials</p>
            <p className="text-sm text-gray-800 font-mono bg-gray-100 p-2 rounded inline-block border border-gray-300">
             admin@test.com / password123
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
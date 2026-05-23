import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1a1a1a] p-10 rounded-3xl shadow-2xl border border-[#2a2a2a]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Espace <span className="text-[#b58455]">Administrateur</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Connectez-vous pour gérer vos élèves
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-700 bg-[#222222] placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#b58455] focus:border-transparent sm:text-sm transition-all"
                placeholder="Adresse Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-700 bg-[#222222] placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#b58455] focus:border-transparent sm:text-sm transition-all"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#b58455] hover:bg-[#c49a6c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b58455] transition-all shadow-lg shadow-[#b58455]/20"
            >
              Se Connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

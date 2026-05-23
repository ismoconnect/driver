import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#b58455] selection:text-white">
      {user ? (
        <Dashboard onLogout={() => setUser(null)} />
      ) : (
        <Login onLogin={() => {}} />
      )}
    </div>
  );
}

export default App;

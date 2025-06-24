import React, { useState } from 'react';
import AuthPage from './AuthPage';
import MainApp from './MainApp';

function App() {
  const [token, setToken] = useState(localStorage.getItem('userToken'));

  const handleLogin = (newToken) => {
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
  };

  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <MainApp token={token} onLogout={handleLogout} />;
}

export default App;

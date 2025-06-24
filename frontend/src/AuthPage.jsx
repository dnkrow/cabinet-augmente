import React, { useState } from 'react';
import './AuthPage.css';

const AuthPage = ({ onLogin }) => { 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const backendUrl = "https://super-duper-succotash-q7xvwjv9949jf66p6-8000.app.github.dev";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? `${backendUrl}/api/medecins/login` : `${backendUrl}/api/medecins/signup`;
    
    try {
      let response;
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        response = await fetch(url, { method: 'POST', body: formData });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Une erreur est survenue.');
      }
      
      if (data.access_token) {
        onLogin(data.access_token); 
      } else if (!isLogin) {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="auth-button">
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <p className="toggle-auth">
          {isLogin ? "Pas encore de compte ?" : 'Déjà un compte ?'}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

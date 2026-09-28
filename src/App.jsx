import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';
import InvitePage from './pages/InvitePage';
import AdminInviteSection from './components/AdminInviteSection';
import './App.css';

// ============================================================
// Page Invitations (route /invite/:token)
// ============================================================
function InviteWrapper() {
  const { token } = useParams();
  return <InvitePage token={token} />;
}

// ============================================================
// Composant Principal (annuaire + événements)
// ============================================================
function MainApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('annuaire');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [members] = useState([
    { id: 1, name: 'Sophie Martin', avatar: '🏃‍♀️', level: 'Elite', distance: 856 },
    { id: 2, name: 'Jean Dupont', avatar: '🚴', level: 'Elite+', distance: 1025 },
    { id: 3, name: 'Marie Leclerc', avatar: '⛹️‍♀️', level: 'Pro', distance: 743 },
    { id: 4, name: 'Pierre Blanc', avatar: '🧗‍♂️', level: 'Amateur', distance: 320 },
    { id: 5, name: 'Luc Moreau', avatar: '🏋️', level: 'Pro', distance: 612 },
    { id: 6, name: 'Anne Garnier', avatar: '🤸‍♀️', level: 'Elite', distance: 895 },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.email === 'admin@ligueultra.fr');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // LOGIN FIREBASE
  // ============================================================
  const handleLogin = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      setErrorMessage('Veuillez remplir email et mot de passe');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Firebase auto-déclenche onAuthStateChanged, pas besoin de setUser ici
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <img src="/logo.png" alt="Ligue Ultra" className="login-logo" />
          <h1>LE CLUB</h1>
          <p>Accès membres — Annuaire & Événements</p>
          <input type="email" placeholder="Email" className="login-input" id="email" />
          <input type="password" placeholder="Mot de passe" className="login-input" id="password" />
          <button
            className="btn-login"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Connexion'}
          </button>
          {errorMessage && <p className="login-error">{errorMessage}</p>}
          <p className="login-hint">Démo : member@mail.fr ou admin@ligueultra.fr</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <img src="/logo.png" alt="Ligue Ultra" className="header-logo" />
          <span className="header-title">Ligue Ultra</span>
        </div>
        <div className="header-user">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'annuaire' ? 'active' : ''}`}
          onClick={() => setActiveTab('annuaire')}
        >
          📖 Annuaire
        </button>
        <button
          className={`tab ${activeTab === 'agenda' ? 'active' : ''}`}
          onClick={() => setActiveTab('agenda')}
        >
          📅 Agenda
        </button>
        {isAdmin && (
          <button
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ Admin
          </button>
        )}
      </div>

      <div className="content">
        {activeTab === 'annuaire' && (
          <div className="annuaire-section">
            <h2>Annuaire des Coureurs ({members.length})</h2>
            <div className="members-grid">
              {members.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">{member.avatar}</div>
                  <div className="member-info">
                    <h3>{member.name}</h3>
                    <p className="member-level">{member.level}</p>
                    <p className="member-distance">{member.distance} km</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="agenda-section">
            <h2>Événements Ligue Ultra</h2>
            <p>Prochaines courses à venir...</p>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="admin-section">
            <AdminInviteSection />
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className="nav-item">🏠 Accueil</button>
        <button className="nav-item">📲 Notifications</button>
        <button className="nav-item">👤 Profil</button>
      </nav>
    </div>
  );
}

// ============================================================
// App Principale avec Router
// ============================================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/invite/:token" element={<InviteWrapper />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}
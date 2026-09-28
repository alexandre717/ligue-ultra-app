// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';
import AvatarUpload from '../components/AvatarUpload';
import './InvitePage.css';

export default function InvitePage({ token }) {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEmail(decoded.email);
        setIsValid(true);
      } catch (err) {
        setError('Lien invalide ou expiré');
        setIsValid(false);
      }
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (file) => {
    setForm(prev => ({ ...prev, avatar: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nom et prénom requis');
      return;
    }

    if (form.password.length < 8) {
      setError('Mot de passe min 8 caractères');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const claimInvitation = httpsCallable(functions, 'claimInvitation');
      // eslint-disable-next-line no-unused-vars
      const result = await claimInvitation({
        token,
        firstName: form.firstName,
        lastName: form.lastName,
        avatarUrl: form.avatar?.url || null,
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Erreur création compte');
    } finally {
      setLoading(false);
    }
  };

  if (!isValid) {
    return (
      <div className="invite-container">
        <div className="invite-error">
          <h1>❌ Lien invalide</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invite-container">
        <div className="invite-success">
          <h1>✅ Bienvenue !</h1>
          <p>Ton compte a été créé. Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-card">
        <img src="/logo.png" alt="Ligue Ultra" className="invite-logo" />
        <h1>Rejoins la Ligue Ultra</h1>
        <p className="invite-subtitle">Complète ton profil pour accéder à l'annuaire</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} disabled className="form-input disabled" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Ton prénom"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Ton nom"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo de profil</label>
            <AvatarUpload onAvatarSelect={handleAvatarSelect} />
          </div>

          <div className="form-group">
            <label>Mot de passe *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 caractères"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe *</label>
            <input
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="Retape ton mot de passe"
              className="form-input"
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
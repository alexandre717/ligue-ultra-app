import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';
import './AdminInviteSection.css';

export default function AdminInviteSection() {
  const [emailList, setEmailList] = useState('');
  const [results, setResults] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const listInvitations = httpsCallable(functions, 'listInvitations');
      const result = await listInvitations();
      setInvitations(result.data.invitations || []);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    }
  };

  const handleSendInvitations = async (e) => {
    e.preventDefault();
    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      alert('Ajoute au moins une email');
      return;
    }

    setLoading(true);
    try {
      const sendInvitation = httpsCallable(functions, 'sendInvitation');
      const result = await sendInvitation({ emails });
      setResults(result.data.results);
      setShowResults(true);
      setEmailList('');
      loadInvitations();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const resendInvitation = httpsCallable(functions, 'resendInvitation');
      const result = await resendInvitation({ invitationId });
      const link = result.data.inviteLink;
      navigator.clipboard.writeText(link);
      alert('Lien copié!');
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="admin-invite-section">
      <h2>🎯 Gestion des Invitations</h2>

      <div className="invite-form-group">
        <h3>Envoyer des invitations</h3>
        <form onSubmit={handleSendInvitations}>
          <div className="invite-form-group">
            <label>Emails (une par ligne)</label>
            <textarea
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              placeholder="email1@example.com&#10;email2@example.com"
              rows="5"
              disabled={loading}
            />
            <p className="hint">Chaque email reçoit un lien unique valide 30 jours</p>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || emailList.trim().length === 0}
          >
            {loading ? 'Envoi...' : 'Envoyer les invitations'}
          </button>
        </form>
      </div>

      {showResults && results.length > 0 && (
        <div className="sent-feedback">
          <h3>✅ Résultats</h3>
          <div className="sent-list">
            {results.map((result, idx) => (
              <div key={idx} className={`invite-result ${result.status}`}>
                <span className="email">{result.email}</span>
                <span className="status">
                  {result.status === 'invited' && '✅ Invité'}
                  {result.status === 'already_invited' && '⚠️ Déjà invité'}
                  {result.status === 'error' && '❌ Erreur'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="invite-form-group">
        <h3>Historique ({invitations.length})</h3>
        {invitations.length > 0 ? (
          <div className="table-wrapper">
            <table className="invitations-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Créée</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="email-cell">{inv.email}</td>
                    <td>
                      <span className={`status-badge ${inv.status}`}>
                        {inv.status === 'pending' && '⏳'}
                        {inv.status === 'used' && '✅'}
                        {inv.status === 'expired' && '❌'}
                      </span>
                    </td>
                    <td className="date">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {inv.status === 'pending' && (
                        <button
                          className="btn-small"
                          onClick={() => handleResendInvitation(inv.id)}
                        >
                          Copier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Aucune invitation</p>
        )}
      </div>
    </div>
  );
}
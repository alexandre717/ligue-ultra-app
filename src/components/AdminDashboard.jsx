import { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    lat: '',
    lng: '',
    googleMapsUrl: '',
  });

  const [userForm, setUserForm] = useState({
    email: '',
    role: 'user',
  });

  // Fetch data
  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsCollection = collection(db, 'events');
      const querySnapshot = await getDocs(eventsCollection);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      const usersList = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.date) {
      alert('Nom et date requis');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...eventForm,
        lat: parseFloat(eventForm.lat) || null,
        lng: parseFloat(eventForm.lng) || null,
      });
      setEventForm({
        name: '',
        date: '',
        time: '',
        location: '',
        description: '',
        lat: '',
        lng: '',
        googleMapsUrl: '',
      });
      fetchEvents();
      alert('Événement créé !');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (confirm('Supprimer cet événement ?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email) {
      alert('Email requis');
      return;
    }

    try {
      // Create user document in Firestore
      // Note: In production, you should create actual auth users via backend
      const userRef = doc(db, 'users', userForm.email);
      await setDoc(userRef, {
        email: userForm.email,
        role: userForm.role,
        createdAt: new Date(),
      }, { merge: true });

      setUserForm({ email: '', role: 'user' });
      fetchUsers();
      alert('Utilisateur créé/mis à jour !');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création');
    }
  };

  const handlePromoteUser = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>🛡️ Tableau de bord Administrateur</h2>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📅 Événements
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="admin-section">
          <h3>Créer un événement</h3>
          <form onSubmit={handleCreateEvent} className="admin-form">
            <input
              type="text"
              placeholder="Nom de l'événement"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              required
            />
            <input
              type="date"
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              required
            />
            <input
              type="time"
              value={eventForm.time}
              onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
            />
            <input
              type="text"
              placeholder="Lieu"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Latitude"
              step="0.0001"
              value={eventForm.lat}
              onChange={(e) => setEventForm({ ...eventForm, lat: e.target.value })}
            />
            <input
              type="number"
              placeholder="Longitude"
              step="0.0001"
              value={eventForm.lng}
              onChange={(e) => setEventForm({ ...eventForm, lng: e.target.value })}
            />
            <input
              type="url"
              placeholder="URL Google Maps (optionnel)"
              value={eventForm.googleMapsUrl}
              onChange={(e) => setEventForm({ ...eventForm, googleMapsUrl: e.target.value })}
            />
            <button type="submit">Créer l'événement</button>
          </form>

          <h3>Événements existants</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className="event-item">
                  <div>
                    <strong>{event.name}</strong>
                    <p>{event.date} à {event.time}</p>
                    <p>{event.location}</p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h3>Créer/Ajouter un utilisateur</h3>
          <form onSubmit={handleCreateUser} className="admin-form">
            <input
              type="email"
              placeholder="Email de l'utilisateur"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Créer/Mettre à jour</button>
          </form>

          <h3>Utilisateurs existants</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.uid} className="user-item">
                  <div>
                    <strong>{user.email}</strong>
                    <p>Rôle: <span className="role-badge">{user.role}</span></p>
                  </div>
                  <div className="user-actions">
                    {user.role !== 'admin' && (
                      <button
                        className="promote-btn"
                        onClick={() => handlePromoteUser(user.uid, 'admin')}
                      >
                        Promouvoir en Admin
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        className="demote-btn"
                        onClick={() => handlePromoteUser(user.uid, 'user')}
                      >
                        Rétrograder
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user.uid)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

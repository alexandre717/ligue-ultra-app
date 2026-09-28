import React, { useState, useEffect } from 'react';
import './App.css';

// Mock data
const mockMembers = [
  { id: 1, name: 'Marc Duchesne', level: 'Ultra', avatar: 'MD', distance: 2450 },
  { id: 2, name: 'Sophie Bernard', level: 'Trail', avatar: 'SB', distance: 1820 },
  { id: 3, name: 'Pierre Laurent', level: 'Ultra', avatar: 'PL', distance: 3100 },
  { id: 4, name: 'Céline Moreau', level: 'Trail', avatar: 'CM', distance: 950 },
  { id: 5, name: 'Thierry Petit', level: 'Ultra', avatar: 'TP', distance: 2650 },
  { id: 6, name: 'Nathalie Dubois', level: 'Trail', avatar: 'ND', distance: 1200 },
  { id: 7, name: 'Jean Martin', level: 'Ultra', avatar: 'JM', distance: 2800 },
  { id: 8, name: 'Isabelle Rousseau', level: 'Trail', avatar: 'IR', distance: 1500 },
];

const mockEvents = [
  {
    id: 1,
    name: 'GRK3VM',
    date: '2025-07-27',
    location: 'Moûtiers, Savoie',
    distance: '80 km',
    elevation: '+4500 m',
    participants: 185,
    description: 'Grand Raid KIPRUN 3 Vallées Moûtiers — parcours mythique des Alpes',
  },
  {
    id: 2,
    name: 'Ultra 01',
    date: '2025-09-06',
    location: 'Oyonnax, Ain',
    distance: '100 km',
    elevation: '+3200 m',
    participants: 210,
    description: 'Ultra 01 Tiger Balm — 10e édition de la plus grande course du circuit',
  },
  {
    id: 3,
    name: 'Trace des Maquisards',
    date: '2025-05-18',
    location: 'Corveissiat, Jura',
    distance: '50 km',
    elevation: '+1800 m',
    participants: 95,
    description: 'Trace des Maquisards — parcours historique du Jura méridional',
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userEmail, setUserEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState(mockMembers);
  const [events, setEvents] = useState(mockEvents);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '', distance: '', elevation: '', description: '' });
  const [announcement, setAnnouncement] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMembers = localStorage.getItem('ligue_ultra_members');
    const savedEvents = localStorage.getItem('ligue_ultra_events');
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  // Save data to localStorage
  const saveMembersToStorage = (data) => {
    localStorage.setItem('ligue_ultra_members', JSON.stringify(data));
  };

  const saveEventsToStorage = (data) => {
    localStorage.setItem('ligue_ultra_events', JSON.stringify(data));
  };

  // Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'member@mail.fr') {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setCurrentPage('directory');
    } else if (userEmail === 'admin@ligueultra.fr') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      setCurrentPage('admin');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail('');
    setCurrentPage('login');
  };

  // Event management
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (newEvent.name && newEvent.date) {
      const updatedEvents = [
        ...events,
        {
          id: events.length + 1,
          ...newEvent,
          participants: Math.floor(Math.random() * 150) + 50,
        },
      ];
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);
      setNewEvent({ name: '', date: '', location: '', distance: '', elevation: '', description: '' });
    }
  };

  // Member management
  const handleAddMember = () => {
    const newName = prompt('Nom du nouveau membre :');
    if (newName) {
      const initials = newName.split(' ').map((n) => n[0]).join('').toUpperCase();
      const updatedMembers = [
        ...members,
        {
          id: members.length + 1,
          name: newName,
          level: 'Trail',
          avatar: initials,
          distance: Math.floor(Math.random() * 2000) + 500,
        },
      ];
      setMembers(updatedMembers);
      saveMembersToStorage(updatedMembers);
    }
  };

  // Filtered members
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      {!isLoggedIn && currentPage === 'login' && (
        <LoginPage email={userEmail} setEmail={setUserEmail} onLogin={handleLogin} />
      )}

      {isLoggedIn && (
        <>
          <Header email={userEmail} onLogout={handleLogout} isAdmin={isAdmin} />

          {currentPage === 'directory' && (
            <DirectoryPage members={filteredMembers} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          )}

          {currentPage === 'calendar' && <CalendarPage events={events} />}

          {currentPage === 'event' && <EventPage nextEvent={events[0]} />}

          {currentPage === 'account' && <AccountPage userEmail={userEmail} />}

          {isAdmin && currentPage === 'admin' && (
            <AdminPanel
              events={events}
              members={members}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              onAddEvent={handleAddEvent}
              onAddMember={handleAddMember}
              announcement={announcement}
              setAnnouncement={setAnnouncement}
            />
          )}

          <NavTabs currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={isAdmin} />
        </>
      )}
    </div>
  );
}

function LoginPage({ email, setEmail, onLogin }) {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Ligue Ultra</h1>
        <p>Communauté des membres</p>
        <form onSubmit={onLogin}>
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Se connecter</button>
        </form>
        <div className="login-demo">
          <p>Démo :</p>
          <small>Membre : member@mail.fr</small>
          <small>Admin : admin@ligueultra.fr</small>
        </div>
      </div>
    </div>
  );
}

function Header({ email, onLogout, isAdmin }) {
  return (
    <header className="header">
      <div className="header-content">
        <h2>Ligue Ultra</h2>
        <div className="header-user">
          <span className="user-email">{email}</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
          <button className="logout-btn" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

function DirectoryPage({ members, searchTerm, setSearchTerm }) {
  return (
    <div className="page directory-page">
      <h2>Annuaire</h2>
      <input
        type="text"
        placeholder="Rechercher un membre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <div className="members-grid">
        {members.map((member) => (
          <div key={member.id} className="member-card">
            <div className={`avatar avatar-${member.level.toLowerCase()}`}>{member.avatar}</div>
            <h3>{member.name}</h3>
            <p className="member-level">{member.level}</p>
            <p className="member-distance">{member.distance} km</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPage({ events }) {
  return (
    <div className="page calendar-page">
      <h2>Agenda 2025</h2>
      <div className="events-list">
        {events.map((event) => (
          <div key={event.id} className="event-card-list">
            <div className="event-date">
              {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
            </div>
            <div className="event-info">
              <h3>{event.name}</h3>
              <p className="event-location">{event.location}</p>
              <p className="event-details">
                {event.distance} • {event.elevation}
              </p>
              <p className="event-participants">{event.participants} inscrits</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventPage({ nextEvent }) {
  if (!nextEvent) return <div className="page">Aucun événement prévu</div>;

  return (
    <div className="page event-page">
      <h2>Prochain Événement</h2>
      <div className="event-detail">
        <h3>{nextEvent.name}</h3>
        <div className="event-info-block">
          <div className="info-row">
            <span className="label">📅 Date</span>
            <span>{new Date(nextEvent.date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="info-row">
            <span className="label">📍 Lieu</span>
            <span>{nextEvent.location}</span>
          </div>
          <div className="info-row">
            <span className="label">📏 Distance</span>
            <span>{nextEvent.distance}</span>
          </div>
          <div className="info-row">
            <span className="label">⛰️ Dénivelé</span>
            <span>{nextEvent.elevation}</span>
          </div>
          <div className="info-row">
            <span className="label">👥 Participants</span>
            <span>{nextEvent.participants}</span>
          </div>
        </div>
        <p className="event-description">{nextEvent.description}</p>
      </div>
    </div>
  );
}

function AccountPage({ userEmail }) {
  return (
    <div className="page account-page">
      <h2>Mon Compte</h2>
      <div className="account-info">
        <p>Email : <strong>{userEmail}</strong></p>
        <p>Statut : <strong>Membre actif</strong></p>
        <p>Courses complétées : <strong>3</strong></p>
      </div>
    </div>
  );
}

function AdminPanel({ events, members, newEvent, setNewEvent, onAddEvent, onAddMember, announcement, setAnnouncement }) {
  return (
    <div className="page admin-page">
      <h2>Panneau Admin</h2>

      <div className="admin-section">
        <h3>Ajouter un événement</h3>
        <form onSubmit={onAddEvent} className="admin-form">
          <input
            type="text"
            placeholder="Nom de l'événement"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
          />
          <input
            type="text"
            placeholder="Lieu"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
          <input
            type="text"
            placeholder="Distance (ex: 80 km)"
            value={newEvent.distance}
            onChange={(e) => setNewEvent({ ...newEvent, distance: e.target.value })}
          />
          <input
            type="text"
            placeholder="Dénivelé (ex: +4500 m)"
            value={newEvent.elevation}
            onChange={(e) => setNewEvent({ ...newEvent, elevation: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
          <button type="submit">Ajouter l'événement</button>
        </form>
      </div>

      <div className="admin-section">
        <h3>Ajouter un membre</h3>
        <button onClick={onAddMember} className="admin-btn">
          Ajouter un nouveau membre
        </button>
      </div>

      <div className="admin-section">
        <h3>Envoyer une annonce</h3>
        <textarea
          placeholder="Message d'annonce"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="announcement-textarea"
        />
        <button className="admin-btn" onClick={() => alert('Annonce envoyée : ' + announcement)}>
          Envoyer l'annonce
        </button>
      </div>

      <div className="admin-section">
        <h3>Statistiques</h3>
        <p>Membres : <strong>{members.length}</strong></p>
        <p>Événements : <strong>{events.length}</strong></p>
      </div>
    </div>
  );
}

function NavTabs({ currentPage, setCurrentPage, isAdmin }) {
  return (
    <nav className="nav-tabs">
      <button className={currentPage === 'directory' ? 'active' : ''} onClick={() => setCurrentPage('directory')}>
        Annuaire
      </button>
      <button className={currentPage === 'calendar' ? 'active' : ''} onClick={() => setCurrentPage('calendar')}>
        Agenda
      </button>
      <button className={currentPage === 'event' ? 'active' : ''} onClick={() => setCurrentPage('event')}>
        Événement
      </button>
      <button className={currentPage === 'account' ? 'active' : ''} onClick={() => setCurrentPage('account')}>
        Compte
      </button>
      {isAdmin && (
        <button className={currentPage === 'admin' ? 'active' : ''} onClick={() => setCurrentPage('admin')}>
          Admin
        </button>
      )}
    </nav>
  );
}

export default App;
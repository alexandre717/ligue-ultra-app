import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import './Agenda.css';

export default function Agenda() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsCollection = collection(db, 'events');
        const querySnapshot = await getDocs(eventsCollection);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort events by date
        eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(eventsList);
        setError('');
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Erreur lors du chargement des événements');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="agenda-section">
        <h2>📅 Événements Ligue Ultra</h2>
        <p className="loading-text">Chargement des événements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agenda-section">
        <h2>📅 Événements Ligue Ultra</h2>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="agenda-section">
        <h2>📅 Événements Ligue Ultra</h2>
        <p className="no-events-text">Aucun événement pour le moment</p>
      </div>
    );
  }

  return (
    <div className="agenda-section">
      <h2>📅 Événements Ligue Ultra</h2>
      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <div className="event-header">
              <h3>{event.name}</h3>
            </div>

            <div className="event-details">
              <div className="event-detail">
                <span className="detail-icon">📅</span>
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(event.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="event-detail">
                <span className="detail-icon">🕐</span>
                <span className="detail-label">Heure:</span>
                <span className="detail-value">{event.time}</span>
              </div>

              <div className="event-detail">
                <span className="detail-icon">📍</span>
                <span className="detail-label">Lieu:</span>
                <span className="detail-value">{event.location}</span>
              </div>
            </div>

            {event.description && (
              <div className="event-description">
                <p>{event.description}</p>
              </div>
            )}

            {event.lat && event.lng && (
              <div className="event-map">
                <iframe
                  width="100%"
                  height="250"
                  style={{ border: 0, borderRadius: '8px' }}
                  loading="lazy"
                  allowFullScreen=""
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAjdN-Fg_gf8WzaA5Ui08A0DWV3iJYyhcc&q=${event.lat},${event.lng}&zoom=15`}
                ></iframe>
              </div>
            )}

            {event.googleMapsUrl && (
              <a
                href={event.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="maps-link"
              >
                🗺️ Ouvrir dans Google Maps
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

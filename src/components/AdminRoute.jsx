import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData && userData.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        navigate('/');
      } finally {
        setLoading(false);
      }
    });

    return () => checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Vérification des droits d'accès...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <p>Accès non autorisé. Vous devez être administrateur.</p>
      </div>
    );
  }

  return children;
}

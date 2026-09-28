import { useState, useRef } from 'react';
import { storage } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AvatarUpload.css';

export default function AvatarUpload({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const isMobile = () => {
    return /iPhone|iPad|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  };

  const handleImageSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('❌ Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('❌ L\'image ne doit pas dépasser 5MB');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileName = `avatars/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      onUpload(downloadUrl);
      setUploading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError('❌ Erreur lors de l\'envoi de la photo');
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img src={preview} alt="Avatar" />
        ) : (
          <div className="placeholder">
            <span className="icon">📷</span>
            <span className="text">Ajouter ma photo</span>
          </div>
        )}
      </div>

      <div className="upload-buttons">
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-file"
        >
          📁 Fichier
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e.target.files?.[0])}
          style={{ display: 'none' }}
        />

        <button 
          type="button"
          onClick={() => libraryInputRef.current?.click()}
          disabled={uploading}
          className="btn-library"
        >
          🖼️ Bibliothèque
        </button>
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
      </div>

      {uploading && <p className="uploading">⏳ Envoi en cours...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

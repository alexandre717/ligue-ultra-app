import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAjdN-Fg_gf8WzaA5Ui08A0DWV3iJYyhcc",
  authDomain: "le-club-ligue-ultra.firebaseapp.com",
  projectId: "le-club-ligue-ultra",
  storageBucket: "le-club-ligue-ultra.firebasestorage.app",
  messagingSenderId: "25278484360",
  appId: "1:25278484360:web:40e10caa7a5a3dcd73b43d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
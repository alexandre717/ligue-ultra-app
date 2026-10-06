# 📋 Guide de finalisation — Ligue Ultra App

## État actuel

✅ **APP VERCEL**
- Déployée en prod: https://ligueultra-app.vercel.app
- Design Ki@ki complet
- Branding Ligue Ultra

⚠️ **Cloud Functions** (4/4 bloquées)
- Code corrects mais non déployées
- Node.js 22 configuré
- Erreurs de déploiement Google Cloud Build

⚠️ **Firebase Auth** (login)
- Implémenté en React (SignInWithEmailAndPassword)
- Pas d'utilisateurs de test en production

❌ **Firestore Data**
- Aucune donnée réelle (seulement mockées en local)

❌ **Notifications Push**
- FCM non configuré
- Service worker à créer

---

## 🔧 Étapes de finalisation

### 1️⃣ Obtenir la clé Firebase Admin (OBLIGATOIRE)

Tu dois télécharger `firebase-admin-key.json` depuis la console Firebase.

**Comment:**
1. Va sur: https://console.firebase.google.com/project/le-club-ligue-ultra/settings/serviceaccounts/adminsdk
2. Clique sur "Générer une nouvelle clé privée"
3. Sauvegarde le JSON dans le dossier racine du projet: `firebase-admin-key.json`

⚠️ **NE PAS COMMITER CETTE CLÉ** — déjà dans .gitignore

---

### 2️⃣ Créer les utilisateurs de test & données Firestore

```bash
cd ~/ligue-ultra-app
node setup-firebase.js
```

**Cela va:**
- ✅ Créer 2 utilisateurs de test (admin + member)
- ✅ Populer Firestore avec 5 members + 3 événements
- ✅ Afficher les login/password

**Comptes créés:**
```
Admin:   admin@ligueultra.fr / AdminLU2025!
Member:  member@mail.fr / MemberLU2025!
```

---

### 3️⃣ Déployer les Cloud Functions

```bash
firebase login  # (si pas encore connecté)
firebase deploy --only functions
```

**Vérifier le déploiement:**
```bash
firebase functions:list
```

Tu devrais voir 4 functions actives:
- `sendInvitation`
- `claimInvitation`
- `listInvitations`
- `resendInvitation`

---

### 4️⃣ Tester l'app complète

#### Test 1: Login
1. Va sur https://ligueultra-app.vercel.app
2. Login avec: `member@mail.fr` / `MemberLU2025!`
3. Tu devrais voir:
   - ✅ Onglet Annuaire avec 5 members
   - ✅ Onglet Agenda
   - ✅ Onglet Admin (si admin)

#### Test 2: Invitations (Admin uniquement)
1. Login en admin: `admin@ligueultra.fr` / `AdminLU2025!`
2. Va sur l'onglet Admin
3. Entre des emails et clique "Envoyer invitations"
4. Vérifie les logs des Cloud Functions

#### Test 3: Claim invitation
1. Depuis une invitation reçue (ou URL: `/invite/{token}`)
2. Remplis le formulaire
3. Cloud Function crée le profil Firestore

---

### 5️⃣ Ajouter notifications push (FCM)

Tu peux ajouter cela après si le reste fonctionne.

**Setup:**
1. Va sur la console Firebase → Cloud Messaging
2. Génère une clé Web
3. Crée `public/firebase-messaging-sw.js` (service worker)
4. Ajoute le FCM token au profil member

---

## 🧪 Checklist finale

- [ ] Cloud Functions déployées (firebase deploy --only functions)
- [ ] Utilisateurs de test créés (setup-firebase.js)
- [ ] Login fonctionne avec les 2 comptes
- [ ] Annuaire affiche les 5 members
- [ ] Onglet Admin visible pour admin@ligueultra.fr
- [ ] Invitations peuvent être envoyées (si functions OK)
- [ ] Firestore contient: members, events, invitations

---

## 🆘 Troubleshooting

### "firebase: command not found"
```bash
npm install -g firebase-tools
```

### "PERMISSION_DENIED" sur Firestore
Va sur: https://console.firebase.google.com/project/le-club-ligue-ultra/firestore/rules

Remplace les règles par:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Membres
    match /members/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Événements (lecture publique)
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Invitations (admin uniquement)
    match /invitations/{inviteId} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
```

### Cloud Functions timeout
Vérifier les logs:
```bash
firebase functions:log --lines 50
```

### Mot de passe temporaire non fonctionnel
Récréer l'utilisateur:
```javascript
await auth.deleteUser('uid-du-user');
// Puis relancer setup-firebase.js
```

---

## 📞 Support

Issues récurrentes:
1. **Clé Firebase Admin:** https://console.firebase.google.com/project/le-club-ligue-ultra/settings/serviceaccounts/adminsdk
2. **Logs Cloud Functions:** `firebase functions:log`
3. **Firestore:** https://console.firebase.google.com/project/le-club-ligue-ultra/firestore/data


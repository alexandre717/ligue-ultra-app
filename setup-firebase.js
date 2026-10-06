#!/usr/bin/env node

/**
 * Script de configuration Firebase pour Ligue Ultra App
 * Crée les utilisateurs de test et remplit Firestore
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialiser Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');

// NOTE: Tu dois créer firebase-admin-key.json depuis la console Firebase
// https://console.firebase.google.com/project/le-club-ligue-ultra/settings/serviceaccounts/adminsdk

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'le-club-ligue-ultra',
  });
} catch (err) {
  console.error('❌ Erreur: firebase-admin-key.json non trouvé');
  console.error('Tu dois télécharger la clé depuis:');
  console.error('https://console.firebase.google.com/project/le-club-ligue-ultra/settings/serviceaccounts/adminsdk');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

// ============================================================
// USERS DE TEST
// ============================================================
const testUsers = [
  {
    email: 'admin@ligueultra.fr',
    password: 'AdminLU2025!',
    displayName: 'Admin Ligue Ultra',
    firstName: 'Admin',
    lastName: 'Ligue Ultra',
    role: 'admin',
  },
  {
    email: 'member@mail.fr',
    password: 'MemberLU2025!',
    displayName: 'Sophie Martin',
    firstName: 'Sophie',
    lastName: 'Martin',
    role: 'member',
  },
];

// ============================================================
// DONNÉES MEMBERS (Firestore)
// ============================================================
const members = [
  { id: 'admin-uid', firstName: 'Admin', lastName: 'Ligue Ultra', email: 'admin@ligueultra.fr', level: 'admin', distance_km: 0, role: 'admin', status: 'active' },
  { id: 'member-uid-1', firstName: 'Sophie', lastName: 'Martin', email: 'member@mail.fr', level: 'Elite', distance_km: 856, role: 'member', status: 'active' },
  { id: 'member-uid-2', firstName: 'Jean', lastName: 'Dupont', email: 'jean@mail.fr', level: 'Elite+', distance_km: 1025, role: 'member', status: 'active' },
  { id: 'member-uid-3', firstName: 'Marie', lastName: 'Leclerc', email: 'marie@mail.fr', level: 'Pro', distance_km: 743, role: 'member', status: 'active' },
  { id: 'member-uid-4', firstName: 'Pierre', lastName: 'Blanc', email: 'pierre@mail.fr', level: 'Amateur', distance_km: 320, role: 'member', status: 'active' },
];

// ============================================================
// DONNÉES ÉVÉNEMENTS (Firestore)
// ============================================================
const events = [
  {
    id: 'event-grk3vm',
    name: 'Grand Raid KIPRUN 3 Vallées Moûtiers',
    date: '2026-07-30',
    location: 'Moûtiers, Savoie',
    distance_km: 85,
    difficulty: 'Très difficile',
    description: 'Course ultra-trail en Savoie',
    status: 'registration_open',
  },
  {
    id: 'event-ultra-01',
    name: 'Tiger Balm Ultra 01',
    date: '2026-09-15',
    location: 'Oyonnax, Ain',
    distance_km: 67,
    difficulty: 'Difficile',
    description: '10e édition de l\'Ultra 01',
    status: 'registration_open',
  },
  {
    id: 'event-tmut-2026',
    name: 'Tahiti Moorea Ultra Trail',
    date: '2026-11-20',
    location: 'Polynésie Française',
    distance_km: 110,
    difficulty: 'Extrême',
    description: 'Grande finale polynésienne',
    status: 'registration_open',
  },
];

// ============================================================
// FONCTION PRINCIPALE
// ============================================================
async function setup() {
  console.log('\n🚀 Démarrage setup Firebase pour Ligue Ultra...\n');

  try {
    // 1️⃣ CRÉER LES UTILISATEURS
    console.log('1️⃣ Création des utilisateurs de test...');
    const userMap = {};

    for (const user of testUsers) {
      try {
        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        userMap[user.email] = userRecord.uid;
        console.log(`   ✅ ${user.email} créé (uid: ${userRecord.uid})`);
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          const userRecord = await auth.getUserByEmail(user.email);
          userMap[user.email] = userRecord.uid;
          console.log(`   ℹ️  ${user.email} existe déjà (uid: ${userRecord.uid})`);
        } else {
          console.error(`   ❌ Erreur créer ${user.email}:`, err.message);
        }
      }
    }

    // 2️⃣ CRÉER LES PROFILS MEMBERS EN FIRESTORE
    console.log('\n2️⃣ Création des profils members Firestore...');
    
    // Mapper les UIDs réels
    const adminUid = userMap['admin@ligueultra.fr'];
    const memberUid = userMap['member@mail.fr'];

    const membersWithRealUids = members.map((m) => {
      if (m.email === 'admin@ligueultra.fr') {
        return { ...m, id: adminUid };
      }
      if (m.email === 'member@mail.fr') {
        return { ...m, id: memberUid };
      }
      return m;
    });

    for (const member of membersWithRealUids) {
      await db.collection('members').doc(member.id).set({
        first_name: member.firstName,
        last_name: member.lastName,
        email: member.email,
        level: member.level,
        distance_km: member.distance_km,
        role: member.role,
        status: member.status,
        avatar_url: null,
        created_at: admin.firestore.Timestamp.now(),
      });
      console.log(`   ✅ ${member.firstName} ${member.lastName}`);
    }

    // 3️⃣ CRÉER LES ÉVÉNEMENTS
    console.log('\n3️⃣ Création des événements Firestore...');
    for (const event of events) {
      await db.collection('events').doc(event.id).set({
        name: event.name,
        date: event.date,
        location: event.location,
        distance_km: event.distance_km,
        difficulty: event.difficulty,
        description: event.description,
        status: event.status,
        created_at: admin.firestore.Timestamp.now(),
      });
      console.log(`   ✅ ${event.name} (${event.date})`);
    }

    // 4️⃣ RÉSUMÉ
    console.log('\n✅ Configuration Firebase terminée!\n');
    console.log('📋 Résumé:');
    console.log(`   • ${testUsers.length} utilisateurs créés/vérifiés`);
    console.log(`   • ${membersWithRealUids.length} membres en Firestore`);
    console.log(`   • ${events.length} événements en Firestore`);
    console.log('\n🔐 Comptes de test:');
    console.log('   Admin:   admin@ligueultra.fr / AdminLU2025!');
    console.log('   Member:  member@mail.fr / MemberLU2025!');
    console.log('\n🚀 Prochaines étapes:');
    console.log('   1. Vérifier l\'app sur https://ligueultra-app.vercel.app');
    console.log('   2. Tester login avec les comptes ci-dessus');
    console.log('   3. Déployer Cloud Functions: firebase deploy --only functions');
    console.log('   4. Configurer notifications push (FCM)');
    console.log('\n');

  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setup();

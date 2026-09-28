const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Configure email (tu rempliras avec tes params SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============================================================
// 1. sendInvitation — Admin envoie invitations par email
// ============================================================
exports.sendInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const { emails } = data;
  if (!Array.isArray(emails) || emails.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'emails array required');
  }

  const results = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours

  for (const email of emails) {
    try {
      // Vérifier si invitation existe déjà et est valide
      const existing = await db.collection('invitations').where('email', '==', email).get();
      
      if (!existing.empty && existing.docs[0].data().status === 'pending' && new Date(existing.docs[0].data().expires_at) > now) {
        results.push({
          email,
          status: 'already_invited',
          token: existing.docs[0].data().token,
        });
        continue;
      }

      // Créer token JWT
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });

      // Sauvegarder invitation en Firestore
      await db.collection('invitations').add({
        email,
        token,
        status: 'pending',
        created_by: context.auth.uid,
        created_at: admin.firestore.Timestamp.now(),
        expires_at: admin.firestore.Timestamp.fromDate(expiresAt),
        claimed_at: null,
        user_id: null,
      });

      // Envoyer email
      const inviteLink = `https://ligueultra-app.vercel.app/invite/${token}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Invitation Ligue Ultra — Rejoins la communauté',
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <img src="https://ligueultra-app.vercel.app/logo.png" alt="Ligue Ultra" style="height: 60px; margin-bottom: 20px;">
            <h1>Rejoins la Ligue Ultra 🏃‍♂️</h1>
            <p>Tu as été invité à rejoindre l'annuaire et la communauté Ligue Ultra.</p>
            <p><a href="${inviteLink}" style="background: #00A651; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Créer mon compte</a></p>
            <p style="color: #999; font-size: 12px;">Lien valide 30 jours. ${expiresAt.toLocaleDateString('fr-FR')}</p>
          </div>
        `,
      });

      results.push({
        email,
        status: 'invited',
        token,
      });
    } catch (error) {
      results.push({
        email,
        status: 'error',
        error: error.message,
      });
    }
  }

  return { results };
});

// ============================================================
// 2. claimInvitation — Coureur crée son compte via token
// ============================================================
exports.claimInvitation = functions.https.onCall(async (data, context) => {
  const { token, firstName, lastName, avatarUrl } = data;

  if (!token || !firstName || !lastName) {
    throw new functions.https.HttpsError('invalid-argument', 'token, firstName, lastName required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid or expired token');
  }

  const { email } = decoded;

  // Vérifier invitation
  const inviteSnap = await db.collection('invitations').where('token', '==', token).get();
  if (inviteSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Invitation not found');
  }

  const invitation = inviteSnap.docs[0];
  if (invitation.data().status !== 'pending') {
    throw new functions.https.HttpsError('failed-precondition', 'Invitation already used or expired');
  }

  try {
    // Créer user Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: Math.random().toString(36).slice(-12) + 'Temp123!', // temp password
    });

    // Créer profil membre en Firestore
    await db.collection('members').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl || null,
      level: 'member',
      distance_km: 0,
      role: 'member',
      status: 'active',
      created_at: admin.firestore.Timestamp.now(),
    });

    // Marquer invitation comme utilisée
    await invitation.ref.update({
      status: 'used',
      claimed_at: admin.firestore.Timestamp.now(),
      user_id: userRecord.uid,
    });

    return {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// 3. listInvitations — Admin voit l'historique
// ============================================================
exports.listInvitations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const invitationsSnap = await db.collection('invitations').orderBy('created_at', 'desc').get();
  
  const invitations = invitationsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate?.(),
    expires_at: doc.data().expires_at?.toDate?.(),
    claimed_at: doc.data().claimed_at?.toDate?.(),
  }));

  return { invitations };
});

// ============================================================
// 4. resendInvitation — Admin copie un lien existant
// ============================================================
exports.resendInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const { invitationId } = data;
  if (!invitationId) {
    throw new functions.https.HttpsError('invalid-argument', 'invitationId required');
  }

  const inviteSnap = await db.collection('invitations').doc(invitationId).get();
  if (!inviteSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Invitation not found');
  }

  const invitation = inviteSnap.data();
  const inviteLink = `https://ligueultra-app.vercel.app/invite/${invitation.token}`;

  return {
    email: invitation.email,
    token: invitation.token,
    inviteLink,
    expiresAt: invitation.expires_at?.toDate?.(),
  };
});

# Emergency Notifications (Twilio + Cloud Functions)

This app expects an HTTP endpoint at `/api/notify-guardians` to send SMS/FCM.

## Setup Twilio Cloud Function (example)
1. Enable Functions: `firebase init functions` (Node 18+)
2. Install deps in `functions/`:
   ```bash
   cd functions
   npm i twilio cors express
   ```
3. Create an Express endpoint:
   ```js
   // functions/index.js
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   const express = require('express');
   const cors = require('cors');
   const twilio = require('twilio');
   admin.initializeApp();
   const app = express();
   app.use(cors({ origin: true }));
   const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
   app.post('/notify-guardians', async (req, res) => {
     const { sessionId, locationUrl } = req.body;
     // Lookup user's guardians in Firestore and send SMS
     // await client.messages.create({ to, from: process.env.TWILIO_FROM, body });
     res.json({ ok: true });
   });
   exports.api = functions.https.onRequest(app);
   ```
4. Deploy: `firebase deploy --only functions`
5. In app, set proxy or use full URL: `/api/notify-guardians` -> `https://<region>-<project>.cloudfunctions.net/api/notify-guardians`

Environment variables: set `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`.


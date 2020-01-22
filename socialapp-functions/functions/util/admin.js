const admin = require('firebase-admin');

var serviceAccount = require("../socialapp-5687a-firebase-adminsdk-9cx94-e41f0f937f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialapp-5687a.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
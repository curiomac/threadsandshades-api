const admin = require('firebase-admin');

const serviceAccount = require('../threadsandshades-2023-firebase-adminsdk-j7aqy-d811e076a8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
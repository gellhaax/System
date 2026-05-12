const admin = require('firebase-admin');
const fs = require('fs');

const requiredEnvVars = [
  'FIREBASE_TYPE',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_AUTH_URI',
  'FIREBASE_TOKEN_URI'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Warning: Missing Firebase environment variables:', missingEnvVars);
  console.warn('Please configure your .env file with the required Firebase credentials.');
  
 

  console.warn('⚠️  Using mock Firestore for development. Database functionality will not work!');
  

  module.exports = {
    collection: (collectionName) => {
      console.error(`❌ Firestore not connected! Cannot access collection: ${collectionName}`);
      console.error('💡 Please set up your Firebase credentials in the .env file.');
      return {
        get: () => Promise.reject(new Error('Firestore not connected')),
        add: () => Promise.reject(new Error('Firestore not connected')),
        where: () => ({
          limit: () => ({
            get: () => Promise.reject(new Error('Firestore not connected'))
          })
        }),
        doc: () => ({
          get: () => Promise.reject(new Error('Firestore not connected')),
          update: () => Promise.reject(new Error('Firestore not connected')),
          delete: () => Promise.reject(new Error('Firestore not connected'))
        }),
        orderBy: () => ({
          get: () => Promise.reject(new Error('Firestore not connected'))
        })
      };
    }
  };
} else {
  // Initialize Firebase Admin SDK with service account
  const serviceAccount = {
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Successfully initialized Firebase Admin SDK');
    module.exports = admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}
// firebase-config.js

// Replace these with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGPNR99jwEJARM8MvNcwIB8dwe-5wMa8w",
  authDomain: "bookproject-ec669.firebaseapp.com",
  projectId: "bookproject-ec669",
  storageBucket: "bookproject-ec669.firebasestorage.app",
  messagingSenderId: "168152570853",
  appId: "1:168152570853:web:0a1da374cc9ecea8562d0c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Get a reference to the auth service (if not already initialized)
if (typeof firebase.auth !== 'undefined') {
  const auth = firebase.auth();
}
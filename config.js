import firebase from 'firebase' 
require('@firebase/firestore')
var firebaseConfig = {
    apiKey: "AIzaSyAZx0bIjkVszFTZw5qwt8KXK0uf79OjaAU",
    authDomain: "wily-50533.firebaseapp.com",
    projectId: "wily-50533",
    storageBucket: "wily-50533.appspot.com",
    messagingSenderId: "889189118728",
    appId: "1:889189118728:web:cc26b42d2de18a75f1f2bd"
  };
  // Initialize Firebase 
firebase.initializeApp(firebaseConfig);
export default firebase.firestore();
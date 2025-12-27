import { initializeApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence exists at runtime for React Native
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYIxhD7etNl9LDgBi6eAsJkYFdNAxZth0",
  authDomain: "dailyvibe-4a9bf.firebaseapp.com",
  projectId: "dailyvibe-4a9bf",
  storageBucket: "dailyvibe-4a9bf.firebasestorage.app",
  messagingSenderId: "899618617810",
  appId: "1:899618617810:web:c9c3517c3b832eaf6cf00b",
  measurementId: "G-99R23T2C9G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
// For React Native, Firestore automatically uses AsyncStorage for offline persistence
// No need to manually enable persistence - it's handled automatically
const db = getFirestore(app);

export { auth, db };
export default app;


// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnbXx6I4VqtbUXeq1F5gNiT_XuQedQPTM",
  authDomain: "score-tracker-v1.firebaseapp.com",
  projectId: "score-tracker-v1",
  storageBucket: "score-tracker-v1.appspot.com", // Corrected URL (was `.app` before)
  messagingSenderId: "745737059191",
  appId: "1:745737059191:web:5c17225e7a37fe4d8aff72",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Mesma configuração pública já usada na wiki original — não é segredo, é protegida
// pelas regras de segurança do Firestore, não por estar escondida (ver CLAUDE.md).
const firebaseConfig = {
  apiKey: "AIzaSyC2nVLv97V6D1S6rZ7nwhhyQXgWeFxQLd0",
  authDomain: "rotina-555dd.firebaseapp.com",
  projectId: "rotina-555dd",
  storageBucket: "rotina-555dd.firebasestorage.app",
  messagingSenderId: "979165283716",
  appId: "1:979165283716:web:258160eb92ead2353e89d1",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

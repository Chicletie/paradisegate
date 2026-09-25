import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

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
let functionsBase = "https://us-central1-rotina-555dd.cloudfunctions.net/";
/** Endereço de uma função do Firebase (chamada por fetch, sem o pacote de funções). */
export function functionUrl(name: string): string {
  return functionsBase + name;
}

// Só em desenvolvimento (npm run dev), em localhost e com a chave ligada no navegador
// (localStorage "pg.emulators" = "1"): usa o simulador do Firebase, com dados de mentira. O
// build que vai pro ar nem inclui este trecho.
if (import.meta.env.DEV && typeof location !== "undefined" && location.hostname === "localhost" && localStorage.getItem("pg.emulators") === "1") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  functionsBase = "http://127.0.0.1:5001/rotina-555dd/us-central1/";
}

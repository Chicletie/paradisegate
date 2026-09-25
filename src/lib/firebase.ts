import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { app, usingEmulators } from "./firebaseApp";

export { app, auth, functionUrl } from "./firebaseApp";

export const db = getFirestore(app);
if (usingEmulators) connectFirestoreEmulator(db, "127.0.0.1", 8080);

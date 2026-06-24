const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({});
const db = getFirestore(app);

getDocs(collection(db, "products"))
  .then(() => console.log("success"))
  .catch(e => console.log("ERROR:", e.message));

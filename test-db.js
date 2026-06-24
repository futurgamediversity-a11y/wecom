const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAlr21Y1a8NPqRImYi3fyyyg8KKHXvwFTU",
  authDomain: "w-com-view.firebaseapp.com",
  projectId: "w-com-view"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

getDocs(collection(db, "products"))
  .then(snapshot => {
    console.log("Found " + snapshot.docs.length + " products");
    snapshot.docs.forEach(doc => console.log(doc.id, doc.data()));
  })
  .catch(e => console.error("Error:", e));
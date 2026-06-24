const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAlr21Y1a8NPqRImYi3fyyyg8KKHXvwFTU",
  authDomain: "w-com-view.firebaseapp.com",
  projectId: "w-com-view"
};

console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Fetching products...");
getDocs(collection(db, "products"))
  .then(snapshot => {
    console.log("SUCCESS: Query complete!");
    console.log("Number of docs:", snapshot.size);
    snapshot.docs.forEach(doc => {
      console.log("Doc ID:", doc.id);
      console.log("Doc data:", JSON.stringify(doc.data(), null, 2));
    });
  })
  .catch(error => {
    console.error("ERROR:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  });

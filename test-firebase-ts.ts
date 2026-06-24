import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlr21Y1a8NPqRImYi3fyyyg8KKHXvwFTU",
  authDomain: "w-com-view.firebaseapp.com",
  projectId: "w-com-view",
  storageBucket: "w-com-view.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Testing Firebase...");

getDocs(collection(db, "products"))
  .then(snapshot => {
    console.log("Found", snapshot.docs.length, "products!");
    snapshot.docs.forEach(doc => {
      console.log("Doc ID:", doc.id);
      console.log("Data:", doc.data());
    });
  })
  .catch(error => {
    console.error("Error:", error);
  });

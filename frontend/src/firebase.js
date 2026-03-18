import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAXI40_iiGb1J9H7rJiofrYuiLcrcS0eRg",
  authDomain: "room-booking-bb537.firebaseapp.com",
  projectId: "room-booking-bb537",
  storageBucket: "room-booking-bb537.appspot.com",
  messagingSenderId: "781285922444",
  appId: "1:781285922444:web:e9747301fd1e4866f20da9",
};

const app = initializeApp(firebaseConfig);

export default app;
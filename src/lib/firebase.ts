// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2JgO4SK2Uv24T7NX0tXlQzgQuthZvGzs",
  authDomain: "webgame-mfa.firebaseapp.com",
  projectId: "webgame-mfa",
  storageBucket: "webgame-mfa.firebasestorage.app",
  messagingSenderId: "177849140665",
  appId: "1:177849140665:web:9b3a0928fe252487ff2268",
  measurementId: "G-BGJYM2FXMM"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// CHỖ NÀY LÀ QUAN TRỌNG NHẤT: Bật Auth và xuất nó ra ngoài (export)
export const auth = getAuth(app);

// Ép Firebase gửi tin nhắn SMS bằng Tiếng Việt
auth.languageCode = 'vi';
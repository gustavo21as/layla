// =====================================================
// LAYLA AI - FIREBASE AUTH + FIRESTORE
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKTv_KvmoS7cDnIBYN_NI_r_sj0xxNDgw",
  authDomain: "layla-ai-6f8ea.firebaseapp.com",
  databaseURL: "https://layla-ai-6f8ea-default-rtdb.firebaseio.com",
  projectId: "layla-ai-6f8ea",
  storageBucket: "layla-ai-6f8ea.firebasestorage.app",
  messagingSenderId: "573193078345",
  appId: "1:573193078345:web:5d67cef7b01ec30e6b619b"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// -------------------------------------------------------
// AUTH — estado persistente
// -------------------------------------------------------
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    // Usuario autenticado con Google/Facebook
    const name = firebaseUser.displayName || firebaseUser.email || "Usuario";
    const isGerardo = name.toLowerCase().includes("gerardo") ||
                      (firebaseUser.email || "").toLowerCase().includes("gerardo");
    const newUser = {
      name: isGerardo ? "Gerardo" : name,
      is_creator: isGerardo,
      avatar: name.charAt(0).toUpperCase(),
      uid: firebaseUser.uid,
      photo: firebaseUser.photoURL || null
    };
    localStorage.setItem("layla_user", JSON.stringify(newUser));
    if (window._laylaUpdateUser) window._laylaUpdateUser(newUser);
    if (window._laylaCloseModal) window._laylaCloseModal();
    loadUserConversations(firebaseUser.uid);
  }
});

// -------------------------------------------------------
// LOGIN CON GOOGLE
// -------------------------------------------------------
async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged se encarga del resto
  } catch (e) {
    console.error("Google login error:", e);
    if (e.code !== "auth/popup-closed-by-user") {
      alert("Error al iniciar con Google: " + e.message);
    }
  }
}

// -------------------------------------------------------
// LOGIN CON FACEBOOK
// -------------------------------------------------------
async function loginWithFacebook() {
  try {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Facebook login error:", e);
    if (e.code !== "auth/popup-closed-by-user") {
      alert("Error al iniciar con Facebook: " + e.message);
    }
  }
}

// -------------------------------------------------------
// LOGIN COMO INVITADO — persiste en localStorage
// -------------------------------------------------------
function loginAsGuest() {
  const guest = { name: "Invitado", is_creator: false, avatar: "I", uid: "guest" };
  localStorage.setItem("layla_user", JSON.stringify(guest));
  if (window._laylaUpdateUser) window._laylaUpdateUser(guest);
  if (window._laylaCloseModal) window._laylaCloseModal();
}

// -------------------------------------------------------
// CERRAR SESIÓN
// -------------------------------------------------------
async function logout() {
  try {
    await signOut(auth);
  } catch(e) {}
  const guest = { name: "Invitado", is_creator: false, avatar: "I", uid: "guest" };
  localStorage.setItem("layla_user", JSON.stringify(guest));
  if (window._laylaUpdateUser) window._laylaUpdateUser(guest);
}

// -------------------------------------------------------
// FIRESTORE — guardar conversación
// -------------------------------------------------------
async function saveConversation(title, messages) {
  try {
    const uid = auth.currentUser?.uid || "guest";
    const docRef = await addDoc(collection(db, "conversations"), {
      title,
      messages,
      uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error guardando conversación:", e);
    return null;
  }
}

// -------------------------------------------------------
// FIRESTORE — cargar conversaciones del usuario actual
// -------------------------------------------------------
async function loadUserConversations(uid) {
  try {
    const q = query(
      collection(db, "conversations"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const list = document.getElementById("historyList");
    if (!list) return;
    list.innerHTML = "";
    snapshot.forEach(d => {
      addHistoryItemFirebase(d.id, d.data().title, d.data().messages);
    });
  } catch (e) {
    console.error("Error cargando conversaciones:", e);
  }
}

// -------------------------------------------------------
// FIRESTORE — eliminar conversación
// -------------------------------------------------------
async function deleteConversation(id) {
  try {
    await deleteDoc(doc(db, "conversations", id));
    return true;
  } catch (e) {
    return false;
  }
}

// -------------------------------------------------------
// SIDEBAR — agregar item de historial
// -------------------------------------------------------
function addHistoryItemFirebase(id, title, messages) {
  const list = document.getElementById("historyList");
  if (!list) return;

  const item = document.createElement("div");
  item.className = "history-item";
  item.dataset.fbId = id;
  item.innerText = title || "Conversación";

  let pressTimer = null;
  item.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      if (confirm(`¿Eliminar?\n"${title}"`)) {
        deleteConversation(id).then(ok => { if (ok) item.remove(); });
      }
    }, 600);
  });
  item.addEventListener("touchend",  () => clearTimeout(pressTimer));
  item.addEventListener("touchmove", () => clearTimeout(pressTimer));

  item.addEventListener("click", () => {
    if (!messages?.length) return;
    const feed = document.getElementById("messagesFeed");
    const hero = document.getElementById("heroWelcome");
    if (!feed || !hero) return;
    feed.innerHTML = "";
    hero.style.display = "none";
    messages.forEach(msg => {
      if (msg.role === "user") {
        const row = document.createElement("div");
        row.className = "msg-row user";
        const bubble = document.createElement("div");
        bubble.className = "user-bubble";
        bubble.innerText = msg.text;
        row.appendChild(bubble);
        feed.appendChild(row);
      } else {
        const row = document.createElement("div");
        row.className = "msg-row assistant";
        const orb = document.createElement("div");
        orb.className = "assistant-orb";
        orb.innerText = "L";
        const wrapper = document.createElement("div");
        wrapper.className = "msg-content-wrapper";
        const textEl = document.createElement("div");
        textEl.className = "assistant-text";
        textEl.innerText = msg.text;
        wrapper.appendChild(textEl);
        row.appendChild(orb);
        row.appendChild(wrapper);
        feed.appendChild(row);
      }
    });
    document.getElementById("chatStream").scrollTop = 99999;
  });

  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (confirm(`¿Eliminar?\n"${title}"`)) {
      deleteConversation(id).then(ok => { if (ok) item.remove(); });
    }
  });

  list.appendChild(item);
}

// -------------------------------------------------------
// Exponer funciones globales para app.js
// -------------------------------------------------------
window._laylaFirebase = {
  saveConversation,
  deleteConversation,
  loginWithGoogle,
  loginWithFacebook,
  loginAsGuest,
  logout
};

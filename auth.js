import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { app } from "firebase-init.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Função de conversão username→email (privada)
function _toAuthEmail(username) {
  return `${username}@hermesnews.com`; 
}

// Objeto de serviço de autenticação
export const authService = {
  async login(username, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        _toAuthEmail(username),
        password
      );
      
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      return {
        ...userCredential.user,
        username: userDoc.data()?.username
      };
    } catch (error) {
      throw _translateAuthError(error.code);
    }
  },

  async register(username, password, displayName) {
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        throw new Error("Nome de usuário já existe");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        _toAuthEmail(username),
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        displayName,
        role: "editor",
        createdAt: new Date().toISOString()
      });

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        callback({
          ...user,
          username: userDoc.data()?.username
        });
      } else {
        callback(null);
      }
    });
  }
};

// Função interna para tratamento de erros
function _translateAuthError(code) {
  const errors = {
    'auth/invalid-email': 'Usuário inválido',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.'
  };
  return new Error(errors[code] || 'Falha na autenticação');
}
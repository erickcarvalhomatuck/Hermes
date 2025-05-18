import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { app } from "./firebase-init.js";

const db = getFirestore(app);
const ARTICLES_COLLECTION = "sportsArticles";

export const articleService = {
  /**
   * Adiciona um novo artigo ao Firestore
   * @param {Object} articleData - Dados do artigo
   * @returns {Promise<string>} ID do documento criado
   */
  async addArticle(articleData) {
    try {
      const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
        title: articleData.title,
        category: articleData.category || 'futebol',
        content: articleData.content,
        image: articleData.image || '',
        author: articleData.author || 'Redação Esportes',
        published: articleData.published || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao adicionar artigo:", error);
      throw new Error("Falha ao salvar o artigo");
    }
  },

  /**
   * Atualiza um artigo existente
   * @param {string} id - ID do artigo
   * @param {Object} updates - Campos para atualizar
   */
  async updateArticle(id, updates) {
    try {
      await updateDoc(doc(db, ARTICLES_COLLECTION, id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao atualizar artigo:", error);
      throw new Error("Falha ao atualizar o artigo");
    }
  },

  /**
   * Remove um artigo do Firestore
   * @param {string} id - ID do artigo
   */
  async deleteArticle(id) {
    try {
      await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
    } catch (error) {
      console.error("Erro ao deletar artigo:", error);
      throw new Error("Falha ao excluir o artigo");
    }
  },

  /**
   * Obtém artigos com opções de filtro
   * @param {Object} options - Opções de consulta
   * @param {boolean} options.publishedOnly - Filtra apenas publicados
   * @param {number} options.limit - Limite de resultados
   * @param {string} options.category - Filtro por categoria
   * @returns {Promise<Array>} Lista de artigos
   */

  
  async getArticles(options = {}) {
    try {
      const { 
        publishedOnly = true, 
        limit: qLimit = 10, 
        category = null 
      } = options;

      let q = query(
        collection(db, ARTICLES_COLLECTION),
        orderBy("createdAt", "desc")
      );

      if (publishedOnly) {
        q = query(q, where("published", "==", true));
      }

      if (category) {
        q = query(q, where("category", "==", category));
      }

      if (qLimit) {
        q = query(q, limit(qLimit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
      throw new Error("Falha ao carregar artigos");
    }
  },

  /**
   * Obtém um artigo específico por ID
   * @param {string} id - ID do artigo
   * @returns {Promise<Object|null>} Dados do artigo ou null se não encontrado
   */
  async getArticleById(id) {
    try {
      const docSnap = await getDoc(doc(db, ARTICLES_COLLECTION, id));
      
      if (!docSnap.exists()) {
        return null;
      }

      // Incrementa contador de visualizações
      await updateDoc(doc(db, ARTICLES_COLLECTION, id), {
        views: (docSnap.data().views || 0) + 1
      });

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error("Erro ao buscar artigo:", error);
      throw new Error("Falha ao carregar o artigo");
    }
  },

  /**
   * Obtém artigos mais visualizados
   * @param {number} limit - Quantidade de artigos
   * @returns {Promise<Array>} Lista de artigos populares
   */
  async getPopularArticles(limit = 5) {
    try {
      const q = query(
        collection(db, ARTICLES_COLLECTION),
        where("published", "==", true),
        orderBy("views", "desc"),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao buscar artigos populares:", error);
      return [];
    }
  },

  /**
   * Busca artigos por termo (title e content)
   * @param {string} searchTerm - Termo de busca
   * @returns {Promise<Array>} Lista de artigos encontrados
   */
  async searchArticles(searchTerm) {
    try {
      const allArticles = await this.getArticles({ publishedOnly: true, limit: 50 });
      
      return allArticles.filter(article => {
        const searchContent = `${article.title} ${article.content}`.toLowerCase();
        return searchContent.includes(searchTerm.toLowerCase());
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      return [];
    }
  }
};
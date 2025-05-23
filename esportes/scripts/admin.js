import { logout, onAuthChange } from './auth.js';
import { articleService } from './firebase-db.js';

// Configuração do TinyMCE
let editor;
const initEditor = () => {
  editor = tinymce.init({
    selector: '#article-content',
    apiKey: '66ta1oygks80puzfcekjbeuugi2c96zk9fyf19kovovb34qb',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'link image media | table | code | help | emoticons',
    images_upload_handler: async (blobInfo) => {
      try {
        const url = await uploadImage(blobInfo.blob(), blobInfo.filename());
        return url;
      } catch (error) {
        console.error('Upload failed:', error);
        showNotification('Falha no upload da imagem', 'error');
        return Promise.reject('Upload failed: ' + error.message);
      }
    },
    content_style: 'body { font-family: "Montserrat", sans-serif; font-size: 14px; }',
    skin: 'oxide',
    content_css: 'default',
    automatic_uploads: true,
    paste_data_images: false, // Segurança: evita upload automático de imagens coladas
    image_caption: true,
    image_advtab: true,
    media_live_embeds: true,
    height: 500,
    menubar: 'file edit view insert format tools table help',
    branding: false,
    promotion: false, // Remove anúncios do TinyMCE
    language: 'pt_BR', // Idioma português brasileiro
    emoticons_database: 'emojis', // Adiciona emojis
    setup: (editor) => {
      editor.on('init', () => {
        console.log('Editor TinyMCE inicializado com sucesso');
      });
    }
  });
};

// Upload de imagens para Cloudinary
const uploadImage = async (file, filename) => {
  const formData = new FormData();
  formData.append('file', file, filename);
  formData.append('upload_preset', 'hermes_upload');

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/dv5fajwwl/image/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Gerenciamento de estado
let currentArticleId = null;
const state = {
  user: null,
  articles: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  initEditor();
  setupEventListeners();
  
  // Verifica autenticação
  onAuthChange((user) => {
    state.user = user;
    if (!user) {
      window.location.href = 'login.html';
    } else {
      loadArticles();
      updateUI();
    }
  });
});

// Atualiza a UI com base no estado
const updateUI = () => {
  document.getElementById('user-greeting').textContent = 
    `Olá, ${state.user?.username || 'Editor'}`;
};

// Carrega artigos para gerenciamento
const loadArticles = async () => {
  try {
    state.articles = await articleService.getArticles({ publishedOnly: false });
    renderArticleList();
  } catch (error) {
    showNotification('Erro ao carregar artigos', 'error');
  }
};

// Renderiza lista de artigos
const renderArticleList = () => {
  const container = document.getElementById('articles-container');
  container.innerHTML = state.articles.map(article => `
    <div class="article-item ${article.published ? 'published' : 'draft'}">
      <h4>${article.title}</h4>
      <div class="meta">
        <span class="date">${new Date(article.createdAt).toLocaleDateString()}</span>
        <span class="status">${article.published ? 'Publicado' : 'Rascunho'}</span>
      </div>
      <div class="actions">
        <button class="edit-btn" data-id="${article.id}">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="delete-btn" data-id="${article.id}">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    </div>
  `).join('');

  // Adiciona event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => loadArticleForEditing(btn.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
};

// Carrega artigo para edição
const loadArticleForEditing = async (id) => {
  const article = state.articles.find(a => a.id === id);
  if (!article) return;

  currentArticleId = id;
  document.getElementById('article-title').value = article.title;
  document.getElementById('article-category').value = article.category || 'futebol';
  tinymce.activeEditor.setContent(article.content);
  
  // Pré-visualização da imagem
  const preview = document.getElementById('image-preview');
  preview.innerHTML = article.image ? 
    `<img src="${article.image}" alt="Preview">` : 
    'Nenhuma imagem selecionada';

  showNotification('Artigo carregado para edição', 'success');
};

// Configura event listeners
const setupEventListeners = () => {
  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Upload de imagem
  document.getElementById('featured-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('image-preview').innerHTML = `
          <img src="${event.target.result}" alt="Preview">
        `;
      };
      reader.readAsDataURL(file);
    }
  });

  // Salvar artigo
  document.getElementById('save-article').addEventListener('click', saveArticle);
  document.getElementById('publish-article').addEventListener('click', () => {
    saveArticle(true);
  });
};

// Salva artigo (como rascunho ou publicado)
const saveArticle = async (publish = false) => {
  const articleData = {
    title: document.getElementById('article-title').value,
    category: document.getElementById('article-category').value,
    content: tinymce.activeEditor.getContent(),
    image: document.querySelector('#image-preview img')?.src || '',
    published: publish,
    author: state.user.username
  };

  try {
    if (currentArticleId) {
      await articleService.updateArticle(currentArticleId, articleData);
      showNotification('Artigo atualizado com sucesso!', 'success');
    } else {
      await articleService.addArticle(articleData);
      showNotification('Artigo salvo com sucesso!', 'success');
      resetForm();
    }
    loadArticles(); // Atualiza a lista
  } catch (error) {
    showNotification('Erro ao salvar artigo: ' + error.message, 'error');
  }
};

// Confirma exclusão
const confirmDelete = async (id) => {
  if (confirm('Tem certeza que deseja excluir este artigo?')) {
    try {
      await articleService.deleteArticle(id);
      showNotification('Artigo excluído com sucesso', 'success');
      loadArticles();
    } catch (error) {
      showNotification('Erro ao excluir artigo', 'error');
    }
  }
};

// Reseta o formulário
const resetForm = () => {
  currentArticleId = null;
  document.getElementById('article-form').reset();
  tinymce.activeEditor.setContent('');
  document.getElementById('image-preview').innerHTML = 'Nenhuma imagem selecionada';
};

// Mostra notificação
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
};

import { articleService } from './firebase-db.js';

// Elementos DOM
const featuredContainer = document.querySelector('.featured-articles');
const articlesGrid = document.querySelector('.articles-grid');
const loadingIndicator = document.getElementById('loading-articles');
const errorContainer = document.getElementById('error-container');
const categoryFilter = document.getElementById('category-filter');
const searchInput = document.getElementById('search-articles');
const loadMoreBtn = document.getElementById('load-more');

// Estado da aplicação
let currentPage = 1;
const articlesPerPage = 6;
let currentCategory = 'all';
let currentSearch = '';
let isLoading = false;
let allArticles = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadInitialArticles();
        setupEventListeners();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showError('Falha ao carregar conteúdo. Tente recarregar a página.');
    }
});

// Carrega os artigos iniciais
async function loadInitialArticles() {
    if (isLoading) return;
    
    showLoading(true);
    clearError();
    isLoading = true;

    try {
        allArticles = await articleService.getArticles({
            publishedOnly: true,
            limit: articlesPerPage * 3 // Carrega mais para pré-cache
        });

        if (allArticles.length === 0) {
            showEmptyState();
            return;
        }

        renderFeaturedArticle(allArticles[0]);
        renderArticlesGrid(allArticles.slice(1, articlesPerPage));
        
        // Mostra botão se houver mais artigos
        if (allArticles.length > articlesPerPage) {
            loadMoreBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar artigos:', error);
        showError('Erro ao carregar conteúdo do servidor.');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Renderiza o artigo em destaque
function renderFeaturedArticle(article) {
    if (!article) return;

    featuredContainer.innerHTML = `
        <article class="featured-article" data-id="${article.id}">
            <div class="image-container">
                <img src="${validateImageUrl(article.image)}" 
                     alt="${article.title}"
                     loading="lazy"
                     onerror="handleImageError(this)">
                <span class="category ${article.category || 'futebol'}">
                    ${getCategoryName(article.category)}
                </span>
            </div>
            <div class="content">
                <h2>${article.title}</h2>
                <div class="excerpt">${getExcerpt(article.content, 200)}</div>
                <div class="meta">
                    <span class="author">Por ${article.author || 'Redação Esportes'}</span>
                    <span class="date">${formatDate(article.createdAt)}</span>
                    <span class="views">
                        <i class="fas fa-eye"></i> ${article.views || 0}
                    </span>
                </div>
                <a href="article.html?id=${article.id}" class="read-more">Ler mais</a>
            </div>
        </article>
    `;
}

// Renderiza a grade de artigos
function renderArticlesGrid(articles) {
    if (!articles || articles.length === 0) {
        articlesGrid.innerHTML = '<p class="no-articles">Nenhum artigo encontrado</p>';
        return;
    }

    articlesGrid.innerHTML = articles.map(article => `
        <article class="article-card" data-id="${article.id}">
            <div class="card-image">
                <img src="${validateImageUrl(article.image)}" 
                     alt="${article.title}"
                     loading="lazy"
                     onerror="handleImageError(this)">
                <span class="category-tag ${article.category || 'futebol'}">
                    ${getCategoryName(article.category)}
                </span>
            </div>
            <div class="card-content">
                <h3>${article.title}</h3>
                <div class="excerpt">${getExcerpt(article.content, 100)}</div>
                <div class="card-footer">
                    <span class="date">${formatDate(article.createdAt)}</span>
                    <a href="article.html?id=${article.id}" class="read-more">
                        Ler mais <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');
}

// Carrega mais artigos (paginção)
async function loadMoreArticles() {
    if (isLoading) return;
    
    showLoading(true);
    loadMoreBtn.disabled = true;
    currentPage++;
    isLoading = true;

    try {
        const startIndex = (currentPage - 1) * articlesPerPage;
        const endIndex = startIndex + articlesPerPage;
        
        // Se já tiver todos os artigos carregados em cache
        if (endIndex <= allArticles.length) {
            const moreArticles = allArticles.slice(startIndex, endIndex);
            articlesGrid.innerHTML += moreArticles.map(article => `
                <article class="article-card" data-id="${article.id}">
                    <!-- Mesmo template de renderArticlesGrid -->
                </article>
            `).join('');
        } else {
            // Carrega mais artigos do Firebase
            const newArticles = await articleService.getArticles({
                publishedOnly: true,
                limit: articlesPerPage,
                startAfter: allArticles[allArticles.length - 1].createdAt
            });
            
            if (newArticles.length > 0) {
                allArticles = [...allArticles, ...newArticles];
                renderArticlesGrid(newArticles);
            }
        }

        // Esconde o botão se não houver mais artigos
        if (endIndex >= allArticles.length && allArticles.length < currentPage * articlesPerPage) {
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar mais artigos:', error);
        showError('Erro ao carregar mais conteúdo.');
    } finally {
        isLoading = false;
        loadMoreBtn.disabled = false;
        showLoading(false);
    }
}

// Filtra artigos por categoria
async function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;
    showLoading(true);

    try {
        const articles = await articleService.getArticles({
            publishedOnly: true,
            limit: articlesPerPage,
            category: category === 'all' ? null : category
        });

        if (articles.length > 0) {
            allArticles = articles;
            renderFeaturedArticle(articles[0]);
            renderArticlesGrid(articles.slice(1));
            loadMoreBtn.style.display = articles.length >= articlesPerPage ? 'block' : 'none';
        } else {
            showEmptyState();
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao filtrar artigos:', error);
        showError('Erro ao filtrar conteúdo.');
    } finally {
        showLoading(false);
    }
}

// Busca artigos por termo
async function searchArticles(term) {
    currentSearch = term;
    currentPage = 1;
    showLoading(true);

    try {
        let articles;
        
        if (term.trim() === '') {
            articles = await articleService.getArticles({
                publishedOnly: true,
                limit: articlesPerPage
            });
        } else {
            articles = await articleService.searchArticles(term);
            articles = articles.slice(0, articlesPerPage);
        }

        if (articles.length > 0) {
            allArticles = articles;
            renderFeaturedArticle(articles[0]);
            renderArticlesGrid(articles.slice(1));
            loadMoreBtn.style.display = articles.length >= articlesPerPage ? 'block' : 'none';
        } else {
            showEmptyState();
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        showError('Erro ao buscar conteúdo.');
    } finally {
        showLoading(false);
    }
}

// Configura os event listeners
function setupEventListeners() {
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            filterByCategory(e.target.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            searchArticles(searchInput.value.trim());
        }, 300));
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreArticles);
    }
}

// Funções auxiliares
function validateImageUrl(url) {
    if (!url || !url.startsWith('http')) {
        return 'images/sports-default.jpg';
    }
    return url;
}

function handleImageError(img) {
    img.onerror = null;
    img.src = 'images/sports-default.jpg';
}

function getExcerpt(content, maxLength) {
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const trimmedText = plainText.replace(/\s+/g, ' ').trim();
    return trimmedText.length > maxLength 
        ? trimmedText.substring(0, maxLength) + '...' 
        : trimmedText;
}

function formatDate(dateString) {
    try {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    } catch {
        return '';
    }
}

function getCategoryName(category) {
    const categories = {
        'futebol': 'Futebol',
        'outros': 'Outros Esportes'
    };
    return categories[category] || category;
}

function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    if (loadMoreBtn) {
        loadMoreBtn.style.visibility = show ? 'hidden' : 'visible';
    }
}

function showError(message) {
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Tentar novamente
                </button>
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

function clearError() {
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
}

function showEmptyState() {
    articlesGrid.innerHTML = `
        <div class="empty-state">
            <i class="far fa-newspaper"></i>
            <p>Nenhum artigo encontrado</p>
            ${currentSearch ? `<p>Para a busca: "${currentSearch}"</p>` : ''}
        </div>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Exporta funções para debug (opcional)
window.debugArticles = {
    reload: loadInitialArticles,
    getCurrentArticles: () => allArticles,
    filter: filterByCategory,
    search: searchArticles
};
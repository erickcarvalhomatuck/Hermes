document.addEventListener('DOMContentLoaded', function() {
    // Configurações da API
    const GNEWS_API_KEY = 'b317981e4512355592acdfbbd3b21add'; // Sua chave API
    const GNEWS_ENDPOINT = `https://gnews.io/api/v4/top-headlines?lang=pt&token=${GNEWS_API_KEY}`;

    // Elementos DOM
    const gridContainer = document.querySelector('.grid-container');
    const loadMoreBtn = document.querySelector('.load-more');
    const breakingContent = document.querySelector('.breaking-content');
    const featuredContainer = document.querySelector('.featured-news');
    
    let currentPage = 1;
    let allArticles = [];

    // Função principal para carregar notícias
    async function fetchNews() {
        try {
            const response = await fetch(GNEWS_ENDPOINT);
            if (!response.ok) throw new Error('Falha ao carregar notícias');
            
            const data = await response.json();
            allArticles = data.articles;
            
            // Exibir notícia principal
            displayBreakingNews(allArticles[0]);
            
            // Exibir notícias em destaque
            displayFeaturedNews(allArticles.slice(1, 4));
            
            // Exibir notícias no grid
            loadNews(currentPage);
            
            // Armazenar em cache
            localStorage.setItem('lastNews', JSON.stringify(allArticles));
            
        } catch (error) {
            console.error("Erro:", error);
            loadCachedNews();
        }
    }

    // Exibir notícia principal
    function displayBreakingNews(article) {
        breakingContent.innerHTML = `
            <h2>${article.title}</h2>
            <p>${article.description || 'Leia a matéria completa para mais detalhes'}</p>
            <a href="noticia.html?id=${encodeURIComponent(article.url)}" class="read-more">
                Ler mais <i class="fas fa-arrow-right"></i>
            </a>
        `;
    }

    // Exibir notícias em destaque
    function displayFeaturedNews(articles) {
        featuredContainer.innerHTML = articles.map(article => `
            <article class="featured-card">
                <div class="card-image">
                    <img src="${article.image || 'images/placeholder.jpg'}" 
                         alt="${article.title}"
                         onerror="this.src='images/placeholder.jpg'">
                    <span class="category-tag ${getArticleCategory(article)}">${article.source.name}</span>
                </div>
                <div class="card-content">
                    <h3>${article.title}</h3>
                    <p class="excerpt">${article.description || 'Clique para ler mais'}</p>
                    <div class="card-footer">
                        <span class="author">${article.source.name}</span>
                        <span class="time">${formatDate(article.publishedAt)}</span>
                    </div>
                    <a href="noticia.html?id=${encodeURIComponent(article.url)}" class="hidden-link"></a>
                </div>
            </article>
        `).join('');

        // Tornar cards inteiros clicáveis
        document.querySelectorAll('.featured-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = card.querySelector('a.hidden-link').href;
            });
        });
    }

    // Carregar notícias no grid
    function loadNews(page) {
        const itemsPerPage = 6;
        const startIndex = 4 + ((page - 1) * itemsPerPage); // Pular as 4 primeiras já exibidas
        const endIndex = startIndex + itemsPerPage;
        
        if (page === 1) {
            gridContainer.innerHTML = '';
        }
        
        const articlesToShow = allArticles.slice(startIndex, endIndex);
        
        if (articlesToShow.length === 0) {
            loadMoreBtn.style.display = 'none';
            return;
        }
        
        articlesToShow.forEach(article => {
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';
            newsCard.innerHTML = `
                <div class="card-image">
                    <img src="${article.image || 'images/placeholder.jpg'}" 
                         alt="${article.title}"
                         onerror="this.src='images/placeholder.jpg'">
                    <span class="category-tag ${getArticleCategory(article)}">${article.source.name}</span>
                </div>
                <div class="card-content">
                    <h3>${article.title}</h3>
                    <p class="excerpt">${article.description || 'Clique para ler mais'}</p>
                    <div class="card-footer">
                        <span class="author">${article.source.name}</span>
                        <span class="time">${formatDate(article.publishedAt)}</span>
                    </div>
                    <a href="noticia.html?id=${encodeURIComponent(article.url)}" class="hidden-link"></a>
                </div>
            `;
            gridContainer.appendChild(newsCard);
            
            // Tornar card clicável
            newsCard.addEventListener('click', () => {
                window.location.href = newsCard.querySelector('a.hidden-link').href;
            });
        });
    }

    // Carregar do cache se a API falhar
    function loadCachedNews() {
        const cached = localStorage.getItem('lastNews');
        if (cached) {
            allArticles = JSON.parse(cached);
            displayBreakingNews(allArticles[0]);
            displayFeaturedNews(allArticles.slice(1, 4));
            loadNews(currentPage);
        } else {
            // Exemplo de fallback
            allArticles = [
                {
                    title: "Não foi possível carregar notícias",
                    description: "Por favor, verifique sua conexão com a internet",
                    url: "#",
                    image: "images/placeholder.jpg",
                    source: { name: "Hermes News" },
                    publishedAt: new Date().toISOString()
                }
            ];
            displayBreakingNews(allArticles[0]);
        }
    }

    // Determinar categoria da notícia
    function getArticleCategory(article) {
        const title = article.title.toLowerCase();
        if (title.includes('política') || title.includes('governo')) return 'politics';
        if (title.includes('economia') || title.includes('mercado')) return 'economy';
        if (title.includes('tecnologia') || title.includes('ciência')) return 'technology';
        if (title.includes('esporte') || title.includes('futebol')) return 'sports';
        if (title.includes('cultura') || title.includes('arte')) return 'culture';
        return 'general';
    }

    // Formatar data
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours < 24) {
            return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    // Event listeners
    loadMoreBtn.addEventListener('click', function() {
        currentPage++;
        loadNews(currentPage);
    });
    
    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
    });
    
    // Fechar menu mobile ao clicar em links
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                mainNav.style.display = 'none';
            }
        });
    });

    // Iniciar
    fetchNews();
});

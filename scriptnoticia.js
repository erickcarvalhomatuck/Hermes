document.addEventListener('DOMContentLoaded', function() {
    // Configurações
    const GNEWS_API_KEY = 'b317981e4512355592acdfbbd3b21add'; // Sua chave API
    const ARTICLE_URL = new URLSearchParams(window.location.search).get('id');
    const articleContainer = document.getElementById('article-container');
    const relatedContainer = document.getElementById('related-news-container');

    // Categorias para estilização
    const categoryClasses = {
        'politics': 'politics',
        'business': 'economy',
        'technology': 'technology',
        'entertainment': 'culture',
        'sports': 'sports',
        'science': 'technology',
        'health': 'culture',
        'general': 'politics'
    };

    // Carregar artigo
    async function loadArticle() {
        showLoadingState();
        
        if (!ARTICLE_URL) {
            showError('URL da notícia não especificada. Acesse através da página inicial.');
            return;
        }

        try {
            // Verificar cache primeiro
            const cachedArticle = checkCache();
            if (cachedArticle) {
                renderArticle(cachedArticle);
                loadRelatedNews(cachedArticle.title.split(' ')[0]);
                return;
            }

            // Buscar artigo na API
            const article = await fetchArticleFromAPI();
            if (!article) {
                throw new Error('Notícia não encontrada na API');
            }

            renderArticle(article);
            loadRelatedNews(article.title.split(' ')[0]);
            saveToCache(article);
            
        } catch (error) {
            console.error('Erro ao carregar artigo:', error);
            showError(error.message || 'Erro ao carregar notícia. Tente novamente mais tarde.');
        }
    }

    // Mostrar estado de carregamento
    function showLoadingState() {
        articleContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando notícia...</p>
            </div>
        `;
    }

    // Verificar cache local
    function checkCache() {
        const cachedArticles = localStorage.getItem('cachedArticles');
        if (!cachedArticles) return null;
        
        const articles = JSON.parse(cachedArticles);
        return articles.find(article => article.url === ARTICLE_URL) || null;
    }

    // Buscar artigo da API
    async function fetchArticleFromAPI() {
        try {
            const response = await fetch(`https://gnews.io/api/v4/search?q=url:"${encodeURIComponent(ARTICLE_URL)}"&token=${GNEWS_API_KEY}&lang=pt`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.articles || data.articles.length === 0) {
                return null;
            }

            return data.articles[0];
        } catch (error) {
            console.error('Erro na requisição à API:', error);
            throw new Error('Não foi possível conectar ao servidor de notícias');
        }
    }

    // Salvar no cache
    function saveToCache(article) {
        let cachedArticles = JSON.parse(localStorage.getItem('cachedArticles') || '[]');
        
        // Limitar cache a 20 artigos
        if (cachedArticles.length >= 20) {
            cachedArticles.shift();
        }
        
        cachedArticles.push(article);
        localStorage.setItem('cachedArticles', JSON.stringify(cachedArticles));
    }

    // Renderizar artigo
    function renderArticle(article) {
        const category = detectCategory(article);
        const categoryClass = categoryClasses[category] || 'politics';
        const publishedDate = new Date(article.publishedAt);
        const formattedDate = publishedDate.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        articleContainer.innerHTML = `
            <header class="article-header">
                <span class="article-category ${categoryClass}">${category.toUpperCase()}</span>
                <h1 class="article-title">${article.title}</h1>
                ${article.description ? `<p class="article-subtitle">${article.description}</p>` : ''}
                <div class="article-meta">
                    <div class="article-author">
                        <img src="images/author-avatar.jpg" alt="${article.source.name}" class="author-avatar">
                        <span>${article.source.name}</span>
                    </div>
                    <span class="article-date">Publicado em ${formattedDate}</span>
                </div>
                ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.src='images/placeholder.jpg'">` : 
                  `<div class="article-image" style="background: var(--light-gray); display: flex; align-items: center; justify-content: center;">
                      <i class="fas fa-newspaper" style="font-size: 3rem; color: var(--medium-gray);"></i>
                   </div>`}
            </header>

            <div class="article-content">
                ${formatContent(article.content)}
                
                <div class="article-tags">
                    ${generateTags(article)}
                </div>
                
                <div class="article-actions">
                    <div class="social-share">
                        <a href="#" class="share-btn facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="share-btn twitter"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="share-btn linkedin"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" class="share-btn whatsapp"><i class="fab fa-whatsapp"></i></a>
                    </div>
                    <a href="index.html" class="nav-btn"><i class="fas fa-arrow-left"></i> Voltar</a>
                </div>
            </div>
        `;

        // Atualizar título da página
        document.title = `${article.title} - Hermes News`;

        // Configurar compartilhamento
        setupSocialSharing(article.title);
    }

    // Detectar categoria
    function detectCategory(article) {
        if (!article.title) return 'general';
        
        const title = article.title.toLowerCase();
        const source = article.source?.name?.toLowerCase() || '';

        if (source.includes('política') || title.includes('política') || title.includes('governo')) return 'politics';
        if (source.includes('economia') || title.includes('economia') || title.includes('mercado')) return 'business';
        if (source.includes('tecnologia') || title.includes('tecnologia') || title.includes('ciência')) return 'technology';
        if (source.includes('esporte') || title.includes('esporte') || title.includes('futebol')) return 'sports';
        if (source.includes('cultura') || title.includes('cultura') || title.includes('arte')) return 'entertainment';
        
        return 'general';
    }

    // Formatar conteúdo
    function formatContent(content) {
        if (!content) return '<p>Conteúdo não disponível.</p>';
        
        // Remover contagem de caracteres
        const cleanContent = content.replace(/\[\+\d+ chars\]/g, '');
        
        // Formatação simples
        return cleanContent
            .split('\n')
            .filter(para => para.trim())
            .map(para => `<p>${para}</p>`)
            .join('');
    }

    // Gerar tags
    function generateTags(article) {
        if (!article.title) return '';
        
        const keywords = article.title
            .split(' ')
            .filter(word => word.length > 3)
            .slice(0, 5);
        
        return keywords.map(word => 
            `<a href="index.html?search=${encodeURIComponent(word)}" class="tag">${word}</a>`
        ).join('');
    }

    // Configurar compartilhamento
    function setupSocialSharing(title) {
        const url = window.location.href;
        const encodedTitle = encodeURIComponent(title);
        const encodedUrl = encodeURIComponent(url);

        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (btn.classList.contains('facebook')) {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                } 
                else if (btn.classList.contains('twitter')) {
                    window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
                } 
                else if (btn.classList.contains('linkedin')) {
                    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, '_blank');
                } 
                else if (btn.classList.contains('whatsapp')) {
                    window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
                }
            });
        });
    }

    // Carregar notícias relacionadas
    async function loadRelatedNews(keyword) {
        if (!keyword) return;
        
        try {
            const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&token=${GNEWS_API_KEY}&lang=pt&max=3`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar notícias relacionadas');
            }
            
            const data = await response.json();
            
            if (data.articles && data.articles.length > 0) {
                relatedContainer.innerHTML = data.articles
                    .filter(article => article.url !== ARTICLE_URL) // Remover o artigo atual
                    .map(article => `
                        <article class="related-card">
                            <img src="${article.image || 'images/placeholder.jpg'}" 
                                 alt="${article.title}" 
                                 class="related-image"
                                 onerror="this.src='images/placeholder.jpg'">
                            <div class="related-content">
                                <h3 class="related-title">${article.title}</h3>
                                <p class="related-excerpt">${article.description || ''}</p>
                                <div class="related-meta">${new Date(article.publishedAt).toLocaleDateString('pt-BR')}</div>
                                <a href="noticia.html?id=${encodeURIComponent(article.url)}" class="hidden-link"></a>
                            </div>
                        </article>
                    `).join('');
                
                // Tornar cards clicáveis
                document.querySelectorAll('.related-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (!e.target.closest('a')) {
                            card.querySelector('a.hidden-link').click();
                        }
                    });
                });
            } else {
                showNoRelatedNews();
            }
        } catch (error) {
            console.error('Erro ao carregar notícias relacionadas:', error);
            showNoRelatedNews();
        }
    }

    function showNoRelatedNews() {
        relatedContainer.innerHTML = `
            <div class="no-related">
                <i class="fas fa-info-circle"></i>
                <p>Não encontramos notícias relacionadas no momento</p>
            </div>
        `;
    }

    // Mostrar erro
    function showError(message) {
        articleContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Erro ao carregar notícia</h2>
                <p>${message}</p>
                <a href="index.html" class="nav-btn">Voltar à página inicial</a>
            </div>
        `;
    }

    // Newsletter
    document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = e.target.querySelector('input');
        const email = emailInput.value;
        
        if (email && email.includes('@')) {
            alert(`Obrigado por assinar nossa newsletter! Você receberá nossas atualizações no email ${email}`);
            e.target.reset();
        } else {
            alert('Por favor, insira um endereço de email válido.');
            emailInput.focus();
        }
    });

    // Menu mobile
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
        const nav = document.querySelector('.main-nav');
        nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });

    // Iniciar
    loadArticle();
});
document.addEventListener('DOMContentLoaded', function() {
    // Simulação de carregamento de notícias
    const gridContainer = document.querySelector('.grid-container');
    const loadMoreBtn = document.querySelector('.load-more');
    let currentPage = 1;
    
    // Dados de exemplo (na prática, você buscaria de uma API)
    const newsData = [
        {
            title: "Novas medidas econômicas anunciadas pelo governo",
            category: "economy",
            excerpt: "O ministro da economia anunciou hoje um pacote de medidas para estimular o crescimento...",
            author: "Ana Beatriz",
            time: "5 horas atrás",
            image: "images/news4.jpg"
        },
        {
            title: "Avancos na inteligência artificial preocupam especialistas",
            category: "technology",
            excerpt: "Novos modelos de IA estão mostrando capacidades que surpreendem até seus criadores...",
            author: "Carlos Oliveira",
            time: "7 horas atrás",
            image: "images/news5.jpg"
        },
        {
            title: "Time local vence campeonato após 12 anos",
            category: "sports",
            excerpt: "Em uma virada emocionante, o time da casa conquistou o título na última rodada...",
            author: "Roberto Santos",
            time: "9 horas atrás",
            image: "images/news6.jpg"
        },
        {
            title: "Festival de cinema anuncia programação completa",
            category: "culture",
            excerpt: "O maior festival de cinema do país divulgou hoje a lista completa de filmes selecionados...",
            author: "Juliana Almeida",
            time: "10 horas atrás",
            image: "images/news7.jpg"
        },
        {
            title: "Debate político acirrado na câmara dos deputados",
            category: "politics",
            excerpt: "O projeto de lei que trata da reforma tributária causou acalorados debates hoje...",
            author: "João Silva",
            time: "12 horas atrás",
            image: "images/news8.jpg"
        },
        {
            title: "Mercado de ações reage a notícias internacionais",
            category: "economy",
            excerpt: "Os índices financeiros apresentaram forte volatilidade após anúncios do FED...",
            author: "Maria Souza",
            time: "14 horas atrás",
            image: "images/news9.jpg"
        }
    ];
    
    // Função para carregar notícias
    function loadNews(page) {
        const itemsPerPage = 6;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Limpar o container apenas na primeira página
        if (page === 1) {
            gridContainer.innerHTML = '';
        }
        
        // Adicionar notícias ao container
        newsData.slice(startIndex, endIndex).forEach(news => {
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';
            newsCard.innerHTML = `
                <div class="card-image">
                    <img src="${news.image}" alt="${news.title}">
                    <span class="category-tag ${news.category}">${getCategoryName(news.category)}</span>
                </div>
                <div class="card-content">
                    <h3>${news.title}</h3>
                    <p class="excerpt">${news.excerpt}</p>
                    <div class="card-footer">
                        <span class="author">Por ${news.author}</span>
                        <span class="time">${news.time}</span>
                    </div>
                </div>
            `;
            gridContainer.appendChild(newsCard);
        });
        
        // Esconder o botão se não houver mais notícias
        if (endIndex >= newsData.length) {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    // Mapear categorias para nomes
    function getCategoryName(category) {
        const categories = {
            'politics': 'Política',
            'economy': 'Economia',
            'technology': 'Tecnologia',
            'culture': 'Cultura',
            'sports': 'Esportes'
        };
        return categories[category] || category;
    }
    
    // Carregar primeira página
    loadNews(currentPage);
    
    // Evento do botão "Carregar mais"
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
    
    // Fechar menu ao clicar em um link
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                mainNav.style.display = 'none';
            }
        });
    });
    
    // Animação suave ao rolar para seções
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Efeito de hover nas cards de notícia
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.featured-card, .news-card')) {
            const card = e.target.closest('.featured-card, .news-card');
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.featured-card, .news-card')) {
            const card = e.target.closest('.featured-card, .news-card');
            card.style.transform = '';
            card.style.boxShadow = '';
        }
    });
});
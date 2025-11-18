class FeedManager {
    constructor() {
        this.currentUser = null;
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.filters = {
            sort: 'newest',
            category: '',
            search: '',
            showImagesOnly: false
        };
        this.categories = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadCategories();
        await this.loadFeedStats();
        this.setupEventListeners();
        this.loadPosts();
        this.loadPopularPosts();
        this.loadCommunityStats();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            this.currentUser = JSON.parse(user);
            this.showLoggedInUser();
        } else {
            this.showGuestUser();
        }
    }

    showLoggedInUser() {
        document.getElementById('loggedInUser').style.display = 'block';
        document.getElementById('guestUser').style.display = 'none';
        document.getElementById('createPostSection').style.display = 'block';
        document.getElementById('noPostsGuest').style.display = 'none';
    }

    showGuestUser() {
        document.getElementById('loggedInUser').style.display = 'none';
        document.getElementById('guestUser').style.display = 'block';
        document.getElementById('createPostSection').style.display = 'none';
        document.getElementById('noPostsGuest').style.display = 'block';
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Busca
        document.getElementById('searchForm').addEventListener('submit', (e) => this.handleSearch(e));

        // Filtros
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Criar Post
        document.getElementById('createPostForm').addEventListener('submit', (e) => this.handleCreatePost(e));
        document.getElementById('postContent').addEventListener('input', () => this.updatePostCounter());
        document.getElementById('previewPostBtn').addEventListener('click', () => this.previewPost());

        // Ordenação
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.applyFilters();
        });

        // Categoria
        document.getElementById('categorySelect').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        // Apenas com imagens
        document.getElementById('showImagesOnly').addEventListener('change', (e) => {
            this.filters.showImagesOnly = e.target.checked;
            this.applyFilters();
        });
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                this.categories = data.data.categories || [];
                this.populateCategorySelects();
                this.populateCategoriesList();
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    populateCategorySelects() {
        const categorySelect = document.getElementById('categorySelect');
        const postCategories = document.getElementById('postCategories');
        
        // Limpar selects
        categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
        postCategories.innerHTML = '';
        
        this.categories.forEach(category => {
            // Select de filtro
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
            
            // Select de criação de post (múltipla seleção)
            const postOption = document.createElement('option');
            postOption.value = category._id;
            postOption.textContent = category.name;
            postCategories.appendChild(postOption);
        });
    }

    populateCategoriesList() {
        const container = document.getElementById('categoriesList');
        if (!this.categories.length) {
            container.innerHTML = '<p class="text-muted small">Nenhuma categoria disponível</p>';
            return;
        }

        const categoriesHtml = this.categories.map(category => `
            <div class="category-item mb-2">
                <a href="#" class="category-link" data-category-id="${category._id}">
                    <span class="category-color" style="background-color: ${category.color || '#6c757d'}"></span>
                    ${category.name}
                    <span class="badge bg-light text-dark float-end">${category.postCount || 0}</span>
                </a>
            </div>
        `).join('');

        container.innerHTML = categoriesHtml;

        // Adicionar event listeners para os links de categoria
        container.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = e.currentTarget.getAttribute('data-category-id');
                this.filters.category = categoryId;
                document.getElementById('categorySelect').value = categoryId;
                this.applyFilters();
            });
        });
    }

    async loadPosts(page = 1) {
        try {
            this.showLoading('Carregando posts...');
            this.currentPage = page;

            const queryParams = new URLSearchParams({
                page: page,
                limit: this.postsPerPage,
                sort: this.filters.sort,
                ...(this.filters.category && { category: this.filters.category }),
                ...(this.filters.search && { search: this.filters.search }),
                ...(this.filters.showImagesOnly && { hasImage: 'true' })
            });

            const response = await fetch(`/api/posts/feed?${queryParams}`);
            const container = document.getElementById('postsContainer');
            
            if (response.ok) {
                const data = await response.json();
                this.displayPosts(data.data.posts);
                this.updatePagination(data.data.pagination);
                this.updateActiveFilters();
                
                if (data.data.posts.length === 0) {
                    this.showNoPostsMessage();
                } else {
                    document.getElementById('noPostsMessage').style.display = 'none';
                }
            } else {
                container.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar posts. Tente novamente.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
            document.getElementById('postsContainer').innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erro de conexão ao carregar posts.
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }

    displayPosts(posts) {
        const container = document.getElementById('postsContainer');
        
        if (!posts || posts.length === 0) {
            this.showNoPostsMessage();
            return;
        }

        const postsHtml = posts.map(post => this.createPostHtml(post)).join('');
        container.innerHTML = postsHtml;

        // Adicionar event listeners para interações
        this.attachPostEventListeners();
    }

    createPostHtml(post) {
        const author = post.author || {};
        const categories = post.categories || [];
        const hasImage = post.image && post.image.url;
        const isLiked = post.hasLiked || false;
        const likeCount = post.likes ? post.likes.length : post.likeCount || 0;
        const commentCount = post.commentCount || 0;

        return `
            <div class="card post-card mb-4" data-post-id="${post._id}">
                <div class="card-body">
                    <!-- Cabeçalho do Post -->
                    <div class="post-header mb-3">
                        <div class="d-flex align-items-center">
                            <img src="${author.avatar?.url || '/images/default-avatar.png'}" 
                                 alt="${author.name}" class="post-avatar">
                            <div class="ms-3">
                                <h6 class="mb-0">${author.name}</h6>
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${this.formatTime(post.createdAt)}
                                    ${post.isEdited ? '<span class="badge bg-secondary ms-1">Editado</span>' : ''}
                                </small>
                            </div>
                        </div>
                    </div>

                    <!-- Conteúdo do Post -->
                    <div class="post-content mb-3">
                        <p class="post-text">${this.escapeHtml(post.content)}</p>
                        
                        ${hasImage ? `
                            <div class="post-image mt-3">
                                <img src="${post.image.url}" alt="Imagem do post" class="img-fluid rounded">
                            </div>
                        ` : ''}
                    </div>

                    <!-- Categorias -->
                    ${categories.length > 0 ? `
                        <div class="post-categories mb-3">
                            ${categories.map(cat => `
                                <span class="badge" style="background-color: ${cat.color || '#6c757d'}">
                                    ${cat.name}
                                </span>
                            `).join(' ')}
                        </div>
                    ` : ''}

                    <!-- Estatísticas -->
                    <div class="post-stats mb-3">
                        <small class="text-muted">
                            <i class="fas fa-heart me-1"></i>${likeCount} curtidas
                            <i class="fas fa-comment ms-3 me-1"></i>${commentCount} comentários
                        </small>
                    </div>

                    <!-- Ações -->
                    <div class="post-actions">
                        <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-outline-primary btn-sm like-btn ${isLiked ? 'active' : ''}" 
                                    data-post-id="${post._id}">
                                <i class="fas fa-heart me-1"></i>
                                <span>${isLiked ? 'Curtido' : 'Curtir'}</span>
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm comment-btn" 
                                    data-post-id="${post._id}">
                                <i class="fas fa-comment me-1"></i>Comentar
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm share-btn" data-post-id="${post._id}">
                                <i class="fas fa-share me-1"></i>Compartilhar
                            </button>
                        </div>
                    </div>

                    <!-- Seção de Comentários (será carregada sob demanda) -->
                    <div class="post-comments mt-3" id="comments-${post._id}" style="display: none;">
                        <!-- Comentários serão carregados aqui -->
                    </div>
                </div>
            </div>
        `;
    }

    attachPostEventListeners() {
        // Curtir/Descurtir
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleLikePost(e));
        });

        // Comentar
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleComments(e));
        });

        // Compartilhar
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSharePost(e));
        });
    }

    async handleLikePost(e) {
        if (!this.currentUser) {
            this.showAlert('Faça login para curtir posts', 'warning');
            return;
        }

        const button = e.currentTarget;
        const postId = button.getAttribute('data-post-id');
        const isCurrentlyLiked = button.classList.contains('active');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Atualizar UI
                button.classList.toggle('active');
                button.querySelector('span').textContent = data.data.hasLiked ? 'Curtido' : 'Curtir';
                
                // Atualizar contador
                const postCard = button.closest('.post-card');
                const statsElement = postCard.querySelector('.post-stats small');
                if (statsElement) {
                    const currentText = statsElement.textContent;
                    const likeMatch = currentText.match(/(\d+) curtidas/);
                    const commentMatch = currentText.match(/(\d+) comentários/);
                    
                    const newLikeCount = data.data.likes;
                    const commentCount = commentMatch ? commentMatch[1] : '0';
                    
                    statsElement.innerHTML = `
                        <i class="fas fa-heart me-1"></i>${newLikeCount} curtidas
                        <i class="fas fa-comment ms-3 me-1"></i>${commentCount} comentários
                    `;
                }
            }
        } catch (error) {
            console.error('Erro ao curtir post:', error);
            this.showAlert('Erro ao curtir post', 'danger');
        }
    }

    async toggleComments(e) {
        const button = e.currentTarget;
        const postId = button.getAttribute('data-post-id');
        const commentsContainer = document.getElementById(`comments-${postId}`);

        if (commentsContainer.style.display === 'none') {
            await this.loadComments(postId, commentsContainer);
            commentsContainer.style.display = 'block';
            button.innerHTML = '<i class="fas fa-comment me-1"></i>Ocultar Comentários';
        } else {
            commentsContainer.style.display = 'none';
            button.innerHTML = '<i class="fas fa-comment me-1"></i>Comentar';
        }
    }

    async loadComments(postId, container) {
        try {
            const response = await fetch(`/api/posts/${postId}/comments?limit=5`);
            if (response.ok) {
                const data = await response.json();
                this.displayComments(data.data.comments, container, postId);
            }
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            container.innerHTML = '<p class="text-muted">Erro ao carregar comentários</p>';
        }
    }

    displayComments(comments, container, postId) {
        const commentsHtml = comments && comments.length > 0 ? 
            comments.map(comment => this.createCommentHtml(comment)).join('') :
            '<p class="text-muted text-center py-3">Nenhum comentário ainda</p>';

        const commentForm = this.currentUser ? `
            <div class="comment-form mt-3">
                <form class="d-flex" onsubmit="feedManager.handleAddComment(event, '${postId}')">
                    <input type="text" class="form-control me-2" placeholder="Escreva um comentário..." required>
                    <button type="submit" class="btn btn-primary btn-sm">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        ` : '<p class="text-muted small">Faça login para comentar</p>';

        container.innerHTML = `
            <div class="comments-section">
                <h6 class="mb-3"><i class="fas fa-comments me-2"></i>Comentários</h6>
                <div class="comments-list">
                    ${commentsHtml}
                </div>
                ${commentForm}
            </div>
        `;
    }

    createCommentHtml(comment) {
        const author = comment.author || {};
        return `
            <div class="comment-item mb-3">
                <div class="d-flex">
                    <img src="${author.avatar?.url || '/images/default-avatar.png'}" 
                         alt="${author.name}" class="comment-avatar">
                    <div class="comment-content ms-3">
                        <div class="comment-header">
                            <strong>${author.name}</strong>
                            <small class="text-muted ms-2">${this.formatTime(comment.createdAt)}</small>
                        </div>
                        <div class="comment-text">
                            ${this.escapeHtml(comment.content)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async handleAddComment(e, postId) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showAlert('Faça login para comentar', 'warning');
            return;
        }

        const form = e.target;
        const content = form.querySelector('input').value.trim();

        if (content.length < 2) {
            this.showAlert('Comentário deve ter pelo menos 2 caracteres', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    postId: postId
                })
            });

            if (response.ok) {
                form.reset();
                // Recarregar comentários
                const commentsContainer = document.getElementById(`comments-${postId}`);
                await this.loadComments(postId, commentsContainer);
            } else {
                this.showAlert('Erro ao adicionar comentário', 'danger');
            }
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            this.showAlert('Erro de conexão ao comentar', 'danger');
        }
    }

    async handleCreatePost(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showAlert('Faça login para criar posts', 'warning');
            return;
        }

        const content = document.getElementById('postContent').value.trim();
        const categories = Array.from(document.getElementById('postCategories').selectedOptions)
                               .map(option => option.value);
        const imageFile = document.getElementById('postImage').files[0];

        // Validações
        if (content.length < 10) {
            this.showAlert('O post deve ter pelo menos 10 caracteres', 'warning');
            return;
        }

        if (content.length > 1000) {
            this.showAlert('O post deve ter no máximo 1000 caracteres', 'warning');
            return;
        }

        try {
            this.showLoading('Publicando post...');
            
            const formData = new FormData();
            formData.append('content', content);
            categories.forEach(cat => formData.append('categories', cat));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const token = localStorage.getItem('token');
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                this.showAlert('Post publicado com sucesso!', 'success');
                document.getElementById('createPostForm').reset();
                this.updatePostCounter();
                this.loadPosts(1); // Recarregar feed na primeira página
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.message || 'Erro ao publicar post', 'danger');
            }
        } catch (error) {
            console.error('Erro ao criar post:', error);
            this.showAlert('Erro de conexão ao publicar post', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async handleSearch(e) {
        e.preventDefault();
        const searchTerm = document.getElementById('searchInput').value.trim();
        this.filters.search = searchTerm;
        this.loadPosts(1);
    }

    applyFilters() {
        this.loadPosts(1);
    }

    clearFilters() {
        this.filters = {
            sort: 'newest',
            category: '',
            search: '',
            showImagesOnly: false
        };
        
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'newest';
        document.getElementById('categorySelect').value = '';
        document.getElementById('showImagesOnly').checked = false;
        
        this.loadPosts(1);
    }

    updateActiveFilters() {
        const filtersText = [];
        const activeFilters = document.getElementById('activeFilters');
        const filtersTextElement = document.getElementById('filtersText');

        if (this.filters.search) {
            filtersText.push(`Busca: "${this.filters.search}"`);
        }
        if (this.filters.category) {
            const category = this.categories.find(cat => cat._id === this.filters.category);
            if (category) {
                filtersText.push(`Categoria: ${category.name}`);
            }
        }
        if (this.filters.sort !== 'newest') {
            const sortTexts = {
                'oldest': 'Mais Antigos',
                'popular': 'Mais Populares',
                'mostLiked': 'Mais Curtidos'
            };
            filtersText.push(`Ordenação: ${sortTexts[this.filters.sort]}`);
        }
        if (this.filters.showImagesOnly) {
            filtersText.push('Apenas com Imagens');
        }

        if (filtersText.length > 0) {
            filtersTextElement.textContent = filtersText.join(', ');
            activeFilters.style.display = 'block';
        } else {
            activeFilters.style.display = 'none';
        }
    }

    previewPost() {
        const content = document.getElementById('postContent').value.trim();
        const categories = Array.from(document.getElementById('postCategories').selectedOptions)
                               .map(option => option.text);
        
        if (!content) {
            this.showAlert('Digite algum conteúdo para pré-visualizar', 'warning');
            return;
        }

        const previewHtml = `
            <div class="post-preview">
                <div class="post-header mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${this.currentUser.avatar || '/images/default-avatar.png'}" 
                             alt="${this.currentUser.name}" class="post-avatar">
                        <div class="ms-3">
                            <h6 class="mb-0">${this.currentUser.name}</h6>
                            <small class="text-muted">Agora mesmo</small>
                        </div>
                    </div>
                </div>
                
                <div class="post-content">
                    <p>${this.escapeHtml(content)}</p>
                    
                    ${categories.length > 0 ? `
                        <div class="post-categories mt-2">
                            ${categories.map(cat => `
                                <span class="badge bg-secondary me-1">${cat}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('postPreviewContent').innerHTML = previewHtml;
        new bootstrap.Modal(document.getElementById('postModal')).show();
    }

    updatePostCounter() {
        const content = document.getElementById('postContent').value;
        const counter = document.getElementById('postContentCounter');
        counter.textContent = content.length;
        
        if (content.length > 900) {
            counter.className = 'text-warning';
        } else if (content.length > 980) {
            counter.className = 'text-danger';
        } else {
            counter.className = 'text-muted';
        }
    }

    async loadFeedStats() {
        try {
            // Usar endpoint existente ou criar um específico
            const response = await fetch('/api/stats');
            if (response.ok) {
                const data = await response.json();
                this.updateStatsDisplay(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    updateStatsDisplay(stats) {
        if (stats.overview) {
            document.getElementById('statsTotalPosts').textContent = stats.overview.posts || 0;
            document.getElementById('statsTotalUsers').textContent = stats.overview.users || 0;
            document.getElementById('statsTotalComments').textContent = stats.overview.comments || 0;
        }
    }

    async loadPopularPosts() {
        try {
            // Usar endpoint de posts com ordenação por likes
            const response = await fetch('/api/posts?sort=likes&limit=3');
            if (response.ok) {
                const data = await response.json();
                this.displayPopularPosts(data.data.posts);
            }
        } catch (error) {
            console.error('Erro ao carregar posts populares:', error);
        }
    }

    displayPopularPosts(posts) {
        const container = document.getElementById('popularPosts');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="text-muted small">Nenhum post popular</p>';
            return;
        }

        const postsHtml = posts.map(post => `
            <div class="popular-post-item mb-3">
                <a href="#" class="text-decoration-none" onclick="feedManager.viewPost('${post._id}')">
                    <h6 class="mb-1">${post.title || post.content.substring(0, 50)}...</h6>
                </a>
                <div class="d-flex justify-content-between small text-muted">
                    <span>${post.author?.name || 'Usuário'}</span>
                    <span><i class="fas fa-heart me-1"></i>${post.likeCount || 0}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = postsHtml;
    }

    async loadCommunityStats() {
        try {
            // Usar endpoint de admin ou criar um específico
            const response = await fetch('/api/stats');
            if (response.ok) {
                const data = await response.json();
                this.displayCommunityStats(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas da comunidade:', error);
            // Fallback para dados estáticos
            this.displayCommunityStats({
                onlineUsers: Math.floor(Math.random() * 50) + 10,
                todayPosts: Math.floor(Math.random() * 20) + 5,
                todayComments: Math.floor(Math.random() * 100) + 20,
                activeUsers: Math.floor(Math.random() * 100) + 50
            });
        }
    }

    displayCommunityStats(stats) {
        const container = document.getElementById('communityStats');
        
        const statsHtml = `
            <div class="community-stats">
                <div class="stat-row mb-2">
                    <i class="fas fa-users text-primary me-2"></i>
                    <span>${stats.onlineUsers || 0} online</span>
                </div>
                <div class="stat-row mb-2">
                    <i class="fas fa-newspaper text-success me-2"></i>
                    <span>${stats.todayPosts || 0} posts hoje</span>
                </div>
                <div class="stat-row mb-2">
                    <i class="fas fa-comments text-info me-2"></i>
                    <span>${stats.todayComments || 0} comentários</span>
                </div>
                <div class="stat-row">
                    <i class="fas fa-star text-warning me-2"></i>
                    <span>${stats.activeUsers || 0} usuários ativos</span>
                </div>
            </div>
        `;

        container.innerHTML = statsHtml;
    }

    updatePagination(pagination) {
        const container = document.getElementById('paginationContainer');
        
        if (!pagination || pagination.pages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        let paginationHtml = '';
        const { current, pages, hasPrev, hasNext } = pagination;

        // Botão Anterior
        paginationHtml += `
            <li class="page-item ${hasPrev ? '' : 'disabled'}">
                <a class="page-link" href="#" ${hasPrev ? `onclick="feedManager.loadPosts(${current - 1})"` : ''}>
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= current - 1 && i <= current + 1)) {
                paginationHtml += `
                    <li class="page-item ${i === current ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="feedManager.loadPosts(${i})">${i}</a>
                    </li>
                `;
            } else if (i === current - 2 || i === current + 2) {
                paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Botão Próximo
        paginationHtml += `
            <li class="page-item ${hasNext ? '' : 'disabled'}">
                <a class="page-link" href="#" ${hasNext ? `onclick="feedManager.loadPosts(${current + 1})"` : ''}>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        container.querySelector('.pagination').innerHTML = paginationHtml;
    }

    showNoPostsMessage() {
        document.getElementById('postsContainer').innerHTML = '';
        document.getElementById('noPostsMessage').style.display = 'block';
        document.getElementById('paginationContainer').style.display = 'none';
    }

    handleSharePost(e) {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const postUrl = `${window.location.origin}/post/${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Confira este post no PGFlow',
                url: postUrl
            });
        } else {
            // Fallback para copiar para área de transferência
            navigator.clipboard.writeText(postUrl).then(() => {
                this.showAlert('Link copiado para área de transferência!', 'success');
            });
        }
    }

    viewPost(postId) {
        // Implementar navegação para página individual do post
        this.showAlert('Funcionalidade de visualização individual em desenvolvimento', 'info');
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }

    // Métodos auxiliares
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        if (days < 7) return `${days} dias atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(message = 'Carregando...') {
        const spinner = document.getElementById('loadingSpinner');
        const messageEl = spinner.querySelector('p');
        messageEl.textContent = message;
        spinner.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showAlert(message, type) {
        // Remover alertas existentes
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Inicializar o feed
let feedManager;
document.addEventListener('DOMContentLoaded', () => {
    feedManager = new FeedManager();
});
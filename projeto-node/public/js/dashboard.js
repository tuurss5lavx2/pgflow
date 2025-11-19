// Dashboard functionality with Community Feed, My Posts, and Comments
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Update user data in navbar
    if (user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && user.avatar) {
            const avatarUrl = user.avatar.startsWith('/uploads/') ? 
                window.location.origin + user.avatar : user.avatar;
            userAvatar.src = avatarUrl;
        }
    }
    
    // Event listener for post form
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleCreatePost);
    }
    
    // Load initial data
    loadCommunityFeed();
});

// Load Community Feed
async function loadCommunityFeed() {
    try {
        showCommunityLoading();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayCommunityFeed(posts);
            updateFeedCount(posts.length);
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Erro ao carregar feed da comunidade', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar feed:', error);
        showAlert('Erro ao carregar feed da comunidade', 'danger');
    }
}

// Load My Posts
async function loadMyPosts() {
    try {
        showMyPostsLoading();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/posts/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayMyPosts(posts);
            updateMyPostsCount(posts.length);
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            showAlert('Erro ao carregar seus posts', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        showAlert('Erro ao carregar seus posts', 'danger');
    }
}

// Display Community Feed
function displayCommunityFeed(posts) {
    const feedContainer = document.getElementById('communityFeed');
    if (!feedContainer) return;
    
    if (posts.length === 0) {
        feedContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">Nenhum post na comunidade ainda. Seja o primeiro a postar!</p>
            </div>
        `;
        return;
    }
    
    feedContainer.innerHTML = '';
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    posts.forEach(post => {
        const isOwner = user && post.author === user.name;
        
        // Like verification
        const userLiked = user && post.likes && Array.isArray(post.likes) && 
                         post.likes.includes(user.id);
        
        const likesCount = post.likesCount || (post.likes ? post.likes.length : 0);
        
        // Avatar URL
        let authorAvatar;
        if (post.authorAvatar) {
            if (post.authorAvatar.startsWith('/uploads/')) {
                authorAvatar = window.location.origin + post.authorAvatar;
            } else {
                authorAvatar = post.authorAvatar;
            }
        } else {
            authorAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author) + '&background=10b981&color=fff&size=150';
        }
        
        const postElement = document.createElement('div');
        postElement.className = 'post-card fade-in';
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${authorAvatar}" alt="${post.author}" class="post-avatar" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=10b981&color=fff&size=150'">
                <div class="post-author-info">
                    <div class="post-author">${post.author}</div>
                    <div class="post-date">
                        <i class="fas fa-calendar me-1"></i>
                        ${new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        ${post.createdAt !== post.updatedAt ? 
                        ` • <i class="fas fa-sync-alt me-1"></i>${new Date(post.updatedAt).toLocaleDateString('pt-BR')}` : ''}
                    </div>
                </div>
                ${isOwner ? `
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary edit-post" data-id="${post._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-post" data-id="${post._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            
            <div class="post-title">${post.title}</div>
            <div class="post-content">${post.content}</div>
            
            <div class="post-footer">
                <div class="post-actions">
                    <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                        <i class="fas fa-heart ${userLiked ? 'text-white' : ''}"></i> 
                        <span class="likes-count">${likesCount}</span>
                    </button>
                    <button class="view-comments-btn" data-id="${post._id}">
                        <i class="fas fa-comment"></i>
                        <span>Comentar</span>
                    </button>
                </div>
            </div>
            
            <!-- Comment Section -->
            <div class="comment-section" id="comment-section-${post._id}" style="display: none;">
                <div class="comment-form">
                    <div class="comment-input-group">
                        <img src="${user.avatar ? (user.avatar.startsWith('/uploads/') ? window.location.origin + user.avatar : user.avatar) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=10b981&color=fff&size=40'}" 
                             alt="Seu avatar" class="comment-avatar"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&size=40'">
                        <div class="comment-input-wrapper">
                            <textarea class="form-control comment-input" placeholder="Escreva um comentário..." rows="2" id="comment-input-${post._id}"></textarea>
                        </div>
                        <button class="btn comment-btn" onclick="addComment('${post._id}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
                <div class="comments-list" id="comments-list-${post._id}">
                    <div class="text-center py-3">
                        <i class="fas fa-spinner fa-spin text-primary"></i>
                        <p class="text-muted mt-2">Carregando comentários...</p>
                    </div>
                </div>
            </div>
        `;
        
        feedContainer.appendChild(postElement);
    });
    
    // Add event listeners
    addCommunityEventListeners();
}

// Display My Posts
function displayMyPosts(posts) {
    const myPostsList = document.getElementById('myPostsList');
    if (!myPostsList) return;
    
    if (posts.length === 0) {
        myPostsList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">Você ainda não criou nenhum post.</p>
                <p class="text-muted">Vá para o Feed da Comunidade e crie seu primeiro post!</p>
            </div>
        `;
        return;
    }
    
    myPostsList.innerHTML = '';
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    posts.forEach(post => {
        // Like verification
        const userLiked = user && post.likes && Array.isArray(post.likes) && 
                         post.likes.includes(user.id);
        
        const likesCount = post.likesCount || (post.likes ? post.likes.length : 0);
        
        // Avatar URL
        let authorAvatar;
        if (post.authorAvatar) {
            if (post.authorAvatar.startsWith('/uploads/')) {
                authorAvatar = window.location.origin + post.authorAvatar;
            } else {
                authorAvatar = post.authorAvatar;
            }
        } else {
            authorAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author) + '&background=10b981&color=fff&size=150';
        }
        
        const postElement = document.createElement('div');
        postElement.className = 'post-card fade-in';
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${authorAvatar}" alt="${post.author}" class="post-avatar" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=10b981&color=fff&size=150'">
                <div class="post-author-info">
                    <div class="post-author">${post.author}</div>
                    <div class="post-date">
                        <i class="fas fa-calendar me-1"></i>
                        ${new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        ${post.createdAt !== post.updatedAt ? 
                        ` • <i class="fas fa-sync-alt me-1"></i>${new Date(post.updatedAt).toLocaleDateString('pt-BR')}` : ''}
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary edit-post" data-id="${post._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-post" data-id="${post._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="post-title">${post.title}</div>
            <div class="post-content">${post.content}</div>
            
            <div class="post-footer">
                <div class="post-actions">
                    <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                        <i class="fas fa-heart ${userLiked ? 'text-white' : ''}"></i> 
                        <span class="likes-count">${likesCount}</span>
                    </button>
                    <span class="text-muted">
                        <i class="fas fa-comment me-1"></i>
                        <span id="comments-count-${post._id}">0</span> comentários
                    </span>
                </div>
            </div>
        `;
        
        myPostsList.appendChild(postElement);
        
        // Load comments count for my posts
        loadCommentsCount(post._id);
    });
    
    // Add event listeners
    addMyPostsEventListeners();
}

// Add event listeners for community feed
function addCommunityEventListeners() {
    // Like buttons
    document.querySelectorAll('#communityFeed .like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            toggleLike(postId, this);
        });
    });
    
    // Comment buttons
    document.querySelectorAll('#communityFeed .view-comments-btn').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            toggleComments(postId);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('#communityFeed .edit-post').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            editPost(postId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('#communityFeed .delete-post').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            deletePost(postId);
        });
    });
}

// Add event listeners for my posts
function addMyPostsEventListeners() {
    // Like buttons
    document.querySelectorAll('#myPostsList .like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            toggleLike(postId, this);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('#myPostsList .edit-post').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            editPost(postId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('#myPostsList .delete-post').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            deletePost(postId);
        });
    });
}

// Toggle comments section
function toggleComments(postId) {
    const commentSection = document.getElementById(`comment-section-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (commentSection.style.display === 'none') {
        commentSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentSection.style.display = 'none';
    }
}

// Load comments for a post
async function loadComments(postId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/post/${postId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const comments = await response.json();
            displayComments(postId, comments);
        } else {
            console.error('Erro ao carregar comentários');
        }
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    }
}

// Load comments count for my posts
async function loadCommentsCount(postId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/post/${postId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const comments = await response.json();
            const countElement = document.getElementById(`comments-count-${postId}`);
            if (countElement) {
                countElement.textContent = comments.length;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar contagem de comentários:', error);
    }
}

// Display comments
function displayComments(postId, comments) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comment-slash fa-2x text-muted mb-3"></i>
                <p class="text-muted">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
        `;
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const isOwner = user && comment.author === user.name;
        
        const userLiked = user && comment.likes && Array.isArray(comment.likes) && 
                         comment.likes.includes(user.id);
        
        const likesCount = comment.likesCount || (comment.likes ? comment.likes.length : 0);
        
        let authorAvatar;
        if (comment.authorAvatar) {
            if (comment.authorAvatar.startsWith('/uploads/')) {
                authorAvatar = window.location.origin + comment.authorAvatar;
            } else {
                authorAvatar = comment.authorAvatar;
            }
        } else {
            authorAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.author) + '&background=10b981&color=fff&size=40';
        }
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-card';
        commentElement.innerHTML = `
            <div class="comment-header">
                <img src="${authorAvatar}" alt="${comment.author}" class="comment-author-avatar"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=10b981&color=fff&size=40'">
                <div class="flex-grow-1">
                    <div class="comment-author">${comment.author}</div>
                    <div class="comment-date">
                        ${new Date(comment.createdAt).toLocaleDateString('pt-BR')} às 
                        ${new Date(comment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                ${isOwner ? `
                <button class="comment-delete-btn" onclick="deleteComment('${comment._id}', '${postId}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-like-btn ${userLiked ? 'liked' : ''}" onclick="toggleCommentLike('${comment._id}', this)">
                    <i class="fas fa-heart"></i>
                    <span class="likes-count">${likesCount}</span>
                </button>
            </div>
        `;
        
        commentsList.appendChild(commentElement);
    });
}

// Add comment
async function addComment(postId) {
    try {
        const token = localStorage.getItem('token');
        const commentInput = document.getElementById(`comment-input-${postId}`);
        const content = commentInput.value.trim();
        
        if (!content) {
            showAlert('Por favor, escreva um comentário', 'warning');
            return;
        }
        
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: content,
                postId: postId
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            commentInput.value = '';
            showAlert('Comentário adicionado com sucesso!', 'success');
            playNotificationSound();
            loadComments(postId);
            
            // Update comments count in my posts tab
            const countElement = document.getElementById(`comments-count-${postId}`);
            if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = currentCount + 1;
            }
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Erro ao adicionar comentário', 'danger');
        }
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        showAlert('Erro ao adicionar comentário', 'danger');
    }
}

// Delete comment
async function deleteComment(commentId, postId) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('Comentário excluído com sucesso!', 'success');
            loadComments(postId);
            
            // Update comments count in my posts tab
            const countElement = document.getElementById(`comments-count-${postId}`);
            if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = Math.max(0, currentCount - 1);
            }
        } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Erro ao excluir comentário', 'danger');
        }
    } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        showAlert('Erro ao excluir comentário', 'danger');
    }
}

// Toggle comment like
async function toggleCommentLike(commentId, button) {
    try {
        const token = localStorage.getItem('token');
        
        button.disabled = true;
        
        const response = await fetch(`/api/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const countSpan = button.querySelector('.likes-count');
            countSpan.textContent = data.likesCount;
            
            if (data.liked) {
                button.classList.add('liked');
                playNotificationSound();
            } else {
                button.classList.remove('liked');
            }
        } else {
            showAlert(data.message || 'Erro ao curtir comentário', 'danger');
        }
    } catch (error) {
        console.error('Erro no like do comentário:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        button.disabled = false;
    }
}

// ✅ LIKE FUNCTION - COMPLETE AND WORKING
async function toggleLike(postId, button) {
    try {
        const token = localStorage.getItem('token');
        
        // Disable button temporarily
        button.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update button visual
            const countSpan = button.querySelector('.likes-count');
            const icon = button.querySelector('i');
            
            countSpan.textContent = data.likesCount;
            
            if (data.liked) {
                button.classList.add('liked');
                icon.classList.add('text-white');
                // ✅ SOUND ONLY WHEN LIKING
                playNotificationSound();
            } else {
                button.classList.remove('liked');
                icon.classList.remove('text-white');
            }
        } else {
            showAlert(data.message || 'Erro ao curtir', 'danger');
        }
    } catch (error) {
        console.error('Erro no like:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        // Re-enable button
        button.disabled = false;
    }
}

// ✅ CREATE POST FUNCTION
async function handleCreatePost(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const token = localStorage.getItem('token');
    
    const isEditMode = e.target.getAttribute('data-edit-mode') === 'true';
    const postId = e.target.getAttribute('data-post-id');
    
    try {
        let response;
        
        if (isEditMode) {
            response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
        } else {
            response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
        }
        
        if (response.ok) {
            const message = isEditMode ? 'Post atualizado com sucesso!' : 'Post criado com sucesso!';
            showAlert(message, 'success');
            
            resetForm();
            loadCommunityFeed();
            loadMyPosts();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao processar post', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao processar post', 'danger');
    }
}

// ✅ EDIT POST FUNCTION
async function editPost(postId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const post = await response.json();
            
            document.getElementById('title').value = post.title;
            document.getElementById('content').value = post.content;
            
            const form = document.getElementById('postForm');
            form.setAttribute('data-edit-mode', 'true');
            form.setAttribute('data-post-id', postId);
            
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Edição';
            submitButton.className = 'btn btn-warning';
            
            form.scrollIntoView({ behavior: 'smooth' });
            
            showAlert('Preencha os campos e clique em "Salvar Edição" para atualizar o post', 'info');
        } else {
            showAlert('Erro ao carregar post para edição', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao carregar post para edição', 'danger');
    }
}

// ✅ DELETE POST FUNCTION
async function deletePost(postId) {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('Post excluído com sucesso!', 'success');
            loadCommunityFeed();
            loadMyPosts();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao excluir post', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao excluir post', 'danger');
    }
}

// ✅ RESET FORM FUNCTION
function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postForm').removeAttribute('data-edit-mode');
    document.getElementById('postForm').removeAttribute('data-post-id');
    
    const submitButton = document.querySelector('#postForm button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Publicar Post';
    submitButton.className = 'btn btn-primary';
}

// Update counts
function updateFeedCount(count) {
    const feedCount = document.getElementById('feedCount');
    if (feedCount) {
        feedCount.textContent = count;
    }
}

function updateMyPostsCount(count) {
    const myPostsCount = document.getElementById('myPostsCount');
    const myPostsBadge = document.getElementById('myPostsBadge');
    
    if (myPostsCount) {
        myPostsCount.textContent = count;
    }
    if (myPostsBadge) {
        myPostsBadge.textContent = `${count} ${count === 1 ? 'post' : 'posts'}`;
    }
}

// Loading states
function showCommunityLoading() {
    const feedContainer = document.getElementById('communityFeed');
    if (feedContainer) {
        feedContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <p>Carregando feed da comunidade...</p>
            </div>
        `;
    }
}

function showMyPostsLoading() {
    const myPostsList = document.getElementById('myPostsList');
    if (myPostsList) {
        myPostsList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <p>Carregando seus posts...</p>
            </div>
        `;
    }
}

function handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// ✅ ALERT SYSTEM
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-fixed');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-fixed`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${getAlertIcon(type)} me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'danger': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-bell';
    }
}

// ✅ NOTIFICATION SOUND
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, audioContext.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1567.98, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.07, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.4);
        osc2.stop(audioContext.currentTime + 0.4);
        
    } catch (error) {
        console.log('Som de notificação não suportado');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Atualizar dados do usuário na navbar
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
    
    // Carregar posts
    loadPosts();
    
    // Event listener do formulário
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleCreatePost);
    } else {
        console.error('Formulário de post não encontrado!');
    }
});

async function loadPosts() {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else {
            showAlert('Erro ao carregar posts', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        showAlert('Erro ao carregar posts', 'danger');
    }
}

function displayPosts(posts) {
  const postsList = document.getElementById('postsList');
  if (!postsList) return;
  
  if (posts.length === 0) {
    postsList.innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
        <p class="text-muted">Nenhum post encontrado. Seja o primeiro a postar!</p>
      </div>
    `;
    updatePostsCount(posts);
    return;
  }
  
  postsList.innerHTML = '';
  
  const user = JSON.parse(localStorage.getItem('user'));
  
  posts.forEach(post => {
    const isOwner = user && post.author === user.name;
    
    // ✅ VERIFICAÇÃO CORRETA DE LIKES
    const userLiked = user && post.likes && Array.isArray(post.likes) && 
                     post.likes.some(likeId => {
                       // Converte ambos para string para comparação
                       const likeIdStr = likeId.toString ? likeId.toString() : likeId;
                       const userIdStr = user.id.toString();
                       return likeIdStr === userIdStr;
                     });
    
    const likesCount = post.likesCount || (post.likes ? post.likes.length : 0);
    
    // URL do avatar
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
        </div>
      </div>
    `;
    
    postsList.appendChild(postElement);
  });
  
  // Adicionar event listeners
  addPostEventListeners();
  updatePostsCount(posts);
}

// ✅ FUNÇÃO LIKE CORRIGIDA - GARANTE APENAS 1 LIKE
async function toggleLike(postId, button) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
            showAlert('Você precisa estar logado para curtir posts', 'warning');
            return;
        }
        
        // Desabilita botão temporariamente
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
            // Atualiza visual do botão baseado na resposta do servidor
            const countSpan = button.querySelector('.likes-count');
            const icon = button.querySelector('i');
            
            countSpan.textContent = data.likesCount;
            
            if (data.liked) {
                button.classList.add('liked');
                icon.classList.add('text-white');
                // ✅ SOM APENAS QUANDO DÁ LIKE
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
        // Reabilita botão após 500ms para evitar spam
        setTimeout(() => {
            button.disabled = false;
        }, 500);
    }
}

// Event listener para likes
function addLikeEventListeners() {
  document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-id');
      toggleLike(postId, this);
    });
  });
}

function addPostEventListeners() {
  // Botões de editar
  document.querySelectorAll('.edit-post').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-id');
      editPost(postId);
    });
  });
  
  // Botões de excluir
  document.querySelectorAll('.delete-post').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-id');
      deletePost(postId);
    });
  });
  
  // Botões de like
  addLikeEventListeners();
}

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
            
            const submitButton = form.querySelector('button[type="submit']');
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
            loadPosts();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao excluir post', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao excluir post', 'danger');
    }
}

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
            loadPosts();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao processar post', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao processar post', 'danger');
    }
}

function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postForm').removeAttribute('data-edit-mode');
    document.getElementById('postForm').removeAttribute('data-post-id');
    
    const submitButton = document.querySelector('#postForm button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Publicar Post';
    submitButton.className = 'btn btn-primary';
}

function updatePostsCount(posts) {
    const postsCount = document.getElementById('postsCount');
    if (postsCount) {
        postsCount.textContent = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`;
    }
}

function showLoading() {
    const postsList = document.getElementById('postsList');
    if (postsList) {
        postsList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <p>Carregando posts...</p>
            </div>
        `;
    }
}

// ✅ SISTEMA DE ALERTAS
function showAlert(message, type) {
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

// ✅ FUNÇÃO DO SOM (APENAS PARA LIKES)
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
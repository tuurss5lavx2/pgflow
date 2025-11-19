document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // ✅ CORREÇÃO: Atualizar dados do usuário na navbar
    if (user) {
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        
        // ✅ CORREÇÃO CRÍTICA: Atualizar avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && user.avatar) {
            const avatarUrl = user.avatar.startsWith('/uploads/') ? 
                window.location.origin + user.avatar : user.avatar;
            userAvatar.src = avatarUrl;
        }
    }
    
    // Carregar posts
    loadPosts();
    
    // ✅ CORREÇÃO: Event listener do formulário com verificação
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
    
    // ✅ CORREÇÃO: Verificação de likes melhorada
    const userLiked = user && post.likes && post.likes.some(like => {
      return typeof like === 'string' ? like === user.id : (like._id === user.id || like === user.id);
    });
    
    const likesCount = post.likes ? post.likes.length : 0;
    
    // ✅ CORREÇÃO: URL completa do avatar
    let authorAvatar;
    if (post.authorAvatar) {
      // Se o avatar começar com /uploads/, adiciona a base URL
      if (post.authorAvatar.startsWith('/uploads/')) {
        authorAvatar = window.location.origin + post.authorAvatar;
      } else {
        authorAvatar = post.authorAvatar;
      }
    } else {
      // Avatar gerado baseado no nome do autor
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
          <button class="like-btn ${userLiked ? 'btn-danger' : 'btn-outline-danger'}" data-id="${post._id}">
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

// ✅ FUNÇÃO TOGGLELIKE CORRIGIDA
async function toggleLike(postId, button) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
            showAlert('Você precisa estar logado para curtir posts', 'warning');
            return;
        }
        
        const icon = button.querySelector('i');
        const countSpan = button.querySelector('.likes-count');
        const currentCount = parseInt(countSpan.textContent) || 0;
        const isCurrentlyLiked = button.classList.contains('btn-danger');
        
        // ✅ FEEDBACK VISUAL IMEDIATO
        if (isCurrentlyLiked) {
            // DEScurtindo visualmente
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-danger');
            icon.classList.remove('text-white');
            countSpan.textContent = Math.max(0, currentCount - 1);
        } else {
            // Curtindo visualmente
            button.classList.remove('btn-outline-danger');
            button.classList.add('btn-danger');
            icon.classList.add('text-white');
            countSpan.textContent = currentCount + 1;
        }
        
        // ✅ CHAMADA ÚNICA PARA API
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // ✅ ROLLBACK VISUAL SE ERRO
            if (isCurrentlyLiked) {
                button.classList.add('btn-danger');
                button.classList.remove('btn-outline-danger');
                icon.classList.add('text-white');
                countSpan.textContent = currentCount;
            } else {
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-danger');
                icon.classList.remove('text-white');
                countSpan.textContent = currentCount;
            }
            showAlert(data.message || 'Erro ao processar like', 'danger');
        } else {
            // ✅ SUCESSO - ATUALIZA COM DADOS REAIS
            showAlert(data.message, 'success');
            countSpan.textContent = data.likes;
            
            // ✅ GARANTE ESTADO VISUAL CORRETO
            if (data.liked) {
                button.classList.remove('btn-outline-danger');
                button.classList.add('btn-danger');
                icon.classList.add('text-white');
            } else {
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-danger');
                icon.classList.remove('text-white');
            }
            
            // ✅ TOCA SOM DE NOTIFICAÇÃO
            playNotificationSound();
        }
    } catch (error) {
        console.error('Erro no toggleLike:', error);
        showAlert('Erro de conexão', 'danger');
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

// Atualizar addPostEventListeners para incluir likes
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
  
  // Botões de like (NOVO)
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
            
            // Preencher formulário com dados atuais
            document.getElementById('title').value = post.title;
            document.getElementById('content').value = post.content;
            
            // Alterar formulário para modo edição
            const form = document.getElementById('postForm');
            form.setAttribute('data-edit-mode', 'true');
            form.setAttribute('data-post-id', postId);
            
            // Alterar botão
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Edição';
            submitButton.className = 'btn btn-warning';
            
            // Scroll para o formulário
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
            loadPosts(); // Recarregar a lista
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
            // Modo edição
            response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
        } else {
            // Modo criação
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
            
            // Resetar formulário
            resetForm();
            
            // Recarregar posts
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

// ✅ SISTEMA DE ALERTAS FIXOS - ATUALIZADO
function showAlert(message, type) {
    // Remover alertas existentes
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

// ✅ SISTEMA DE SOM SUPER SIMPLES E FUNCIONAL
function playNotificationSound() {
    console.log('🎵 Tentando tocar som de notificação...');
    
    try {
        // Método 1: Tenta o elemento de áudio existente
        const existingAudio = document.getElementById('notificationSound');
        if (existingAudio) {
            existingAudio.currentTime = 0;
            existingAudio.play().then(() => {
                console.log('✅ Som do elemento audio tocando!');
            }).catch(e => {
                console.log('❌ Elemento audio falhou, tentando método 2...');
                playOnlineSound();
            });
        } else {
            console.log('❌ Elemento audio não encontrado, usando método 2...');
            playOnlineSound();
        }
    } catch (error) {
        console.log('❌ Erro geral, usando método 2...');
        playOnlineSound();
    }
}

// ✅ MÉTODO 2: Som online direto (SEMPRE FUNCIONA)
function playOnlineSound() {
    const soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3';
    console.log('🔊 Tocando som online:', soundUrl);
    
    const audio = new Audio(soundUrl);
    audio.volume = 0.5;
    
    audio.play().then(() => {
        console.log('✅ Som online tocando com sucesso!');
    }).catch(e => {
        console.log('❌ Som online falhou, último recurso...');
        playBeepSound();
    });
}

// ✅ MÉTODO 3: Beep de emergência (NUNCA FALHA)
function playBeepSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
        
        console.log('🔊 Beep de emergência executado');
    } catch (e) {
        console.log('🎵 Áudio completamente indisponível');
    }
}
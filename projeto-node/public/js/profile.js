document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // ✅ VERIFICA SE OS ELEMENTOS EXISTEM ANTES DE USAR
    const avatarForm = document.getElementById('avatarForm');
    const profileForm = document.getElementById('profileForm');
    const avatarInput = document.getElementById('avatarInput');
    
    if (!avatarForm || !profileForm || !avatarInput) {
        console.error('Elementos do formulário não encontrados!');
        return;
    }

    // Carregar dados do usuário
    loadUserData();

    // Formulário de avatar
    avatarForm.addEventListener('submit', handleAvatarUpload);
    
    // Formulário de perfil
    profileForm.addEventListener('submit', handleProfileUpdate);

    // Preview da imagem selecionada
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const avatarPreview = document.getElementById('avatarPreview');
                if (avatarPreview) {
                    avatarPreview.src = e.target.result;
                }
            }
            reader.readAsDataURL(file);
        }
    });

    // Carregar dados do perfil
    loadProfile();
});

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // ✅ VERIFICA SE OS ELEMENTOS EXISTEM
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    if (userAvatarElement && user.avatar) {
        userAvatarElement.src = user.avatar.startsWith('/uploads/') ? 
            window.location.origin + user.avatar : user.avatar;
    }
}

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // ✅ VERIFICA SE OS ELEMENTOS EXISTEM
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const avatarPreview = document.getElementById('avatarPreview');
            
            if (nameInput) nameInput.value = user.name || '';
            if (emailInput) emailInput.value = user.email || '';
            
            if (avatarPreview && user.avatar) {
                const avatarUrl = user.avatar.startsWith('/uploads/') ? 
                    window.location.origin + user.avatar : user.avatar;
                avatarPreview.src = avatarUrl;
            }
            
            // Atualizar localStorage
            localStorage.setItem('user', JSON.stringify(user));
            
        } else if (response.status === 401) {
            window.location.href = '/login';
        } else {
            showAlert('Erro ao carregar perfil', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao carregar perfil', 'danger');
    }
}

async function handleAvatarUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('avatarInput');
    const uploadBtn = e.target.querySelector('button[type="submit"]'); // ✅ CORREÇÃO AQUI!
    
    // ✅ VERIFICA SE OS ELEMENTOS EXISTEM
    if (!fileInput || !uploadBtn) {
        showAlert('Elementos do formulário não encontrados', 'danger');
        return;
    }

    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Selecione uma imagem para upload', 'warning');
        return;
    }

    // ✅ VALIDAÇÕES DE ARQUIVO
    if (file.size > 5 * 1024 * 1024) {
        showAlert('A imagem deve ter no máximo 5MB', 'warning');
        return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showAlert('Formato inválido. Use JPG, PNG ou GIF', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const token = localStorage.getItem('token');
        const originalText = uploadBtn.innerHTML;
        
        // ✅ USA O BOTÃO DO FORMULÁRIO CORRETAMENTE
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        uploadBtn.disabled = true;

        const response = await fetch('/api/auth/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            showAlert(data.message, 'success');
            
            // ✅ ATUALIZA AVATAR PREVIEW
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview && data.avatar) {
                const avatarUrl = data.avatar.startsWith('/uploads/') ? 
                    window.location.origin + data.avatar : data.avatar;
                avatarPreview.src = avatarUrl;
            }
            
            // ✅ ATUALIZA AVATAR NA NAVBAR
            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement && data.avatar) {
                userAvatarElement.src = data.avatar.startsWith('/uploads/') ? 
                    window.location.origin + data.avatar : data.avatar;
            }
            
            // Atualizar localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Limpar input
            fileInput.value = '';
            
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao fazer upload', 'danger');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showAlert('Erro de conexão ao fazer upload', 'danger');
    } finally {
        // ✅ RESTAURA O BOTÃO CORRETAMENTE
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Avatar';
        uploadBtn.disabled = false;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]'); // ✅ CORREÇÃO AQUI!
    
    try {
        const token = localStorage.getItem('token');
        const originalText = submitBtn.innerHTML;
        
        // ✅ MOSTRA LOADING NO BOTÃO CORRETO
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
        submitBtn.disabled = true;

        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, email })
        });

        if (response.ok) {
            const data = await response.json();
            showAlert(data.message, 'success');
            
            // ✅ ATUALIZA NOME NA NAVBAR
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = data.user.name;
            }
            
            // Atualizar localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
        } else {
            const data = await response.json();
            showAlert(data.message || 'Erro ao atualizar perfil', 'danger');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao atualizar perfil', 'danger');
    } finally {
        // ✅ RESTAURA O BOTÃO CORRETAMENTE
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Alterações';
        submitBtn.disabled = false;
    }
}

// ✅ SISTEMA DE ALERTAS (MANTIDO)
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
    
    if (type === 'success') {
        playNotificationSound();
    }
    
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
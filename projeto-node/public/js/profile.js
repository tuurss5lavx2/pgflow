document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Carregar dados do usuário na navbar
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        if (userAvatarElement && user.avatar) {
            userAvatarElement.src = user.avatar.startsWith('/uploads/') ? 
                window.location.origin + user.avatar : user.avatar;
        }
    }

    // Formulário de avatar
    document.getElementById('avatarForm').addEventListener('submit', handleAvatarUpload);
    
    // Formulário de perfil
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Preview da imagem selecionada
    document.getElementById('avatarInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('avatarPreview').src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // Carregar dados do perfil
    loadProfile();
});

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
            
            // Preencher formulário
            document.getElementById('name').value = user.name;
            document.getElementById('email').value = user.email;
            
            // Atualizar avatar
            if (user.avatar) {
                const avatarUrl = user.avatar.startsWith('/uploads/') ? 
                    window.location.origin + user.avatar : user.avatar;
                document.getElementById('avatarPreview').src = avatarUrl;
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
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Selecione uma imagem para upload', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const token = localStorage.getItem('token');
        const uploadBtn = document.getElementById('uploadBtn');
        const originalText = uploadBtn.innerHTML;
        
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

            // ✅ TOCA SOM ESPECÍFICO PARA AVATAR
    playNotificationSound();
            
            // Atualizar avatar preview
            const avatarUrl = data.avatar.startsWith('/uploads/') ? 
                window.location.origin + data.avatar : data.avatar;
            document.getElementById('avatarPreview').src = avatarUrl;
            
            // Atualizar avatar na navbar
            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement) {
                userAvatarElement.src = avatarUrl;
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
        showAlert('Erro de conexão ao fazer upload', 'danger');
    } finally {
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Avatar';
        uploadBtn.disabled = false;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    
    try {
        const token = localStorage.getItem('token');
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
            
            // Atualizar nome na navbar
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
        showAlert('Erro ao atualizar perfil', 'danger');
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

// ✅ SISTEMA DE SOM COM SEU ARQUIVO - ATUALIZADO
function playNotificationSound() {
    try {
        const sound = document.getElementById('notificationSound');
        if (sound) {
            sound.currentTime = 0; // Reinicia o som
            sound.play().catch(error => {
                console.log('Não foi possível tocar o som:', error);
                // Fallback para som gerado se o arquivo falhar
                playFallbackSound();
            });
        } else {
            // Fallback se o elemento de áudio não existir
            playFallbackSound();
        }
    } catch (error) {
        console.log('Erro ao tocar som:', error);
        playFallbackSound();
    }
}

// ✅ SOM DE FALLBACK (caso seu arquivo não carregue)
function playFallbackSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Som de fallback também falhou');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Carregar dados do perfil
    loadProfile();

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
                document.getElementById('avatarPreview').src = user.avatar;
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
            
            // Atualizar avatar preview
            document.getElementById('avatarPreview').src = data.avatar;
            
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

function showAlert(message, type) {
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
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
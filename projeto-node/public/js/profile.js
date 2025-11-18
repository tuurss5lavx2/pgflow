class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadUserData();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.loadUserStats();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        this.currentUser = JSON.parse(localStorage.getItem('user'));
        if (!this.currentUser) {
            window.location.href = '/login';
            return;
        }

        document.getElementById('headerUserName').textContent = this.currentUser.name;
    }

    async loadUserData() {
        try {
            this.showLoading('Carregando perfil...');
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userProfile = data.data;
                this.populateProfileForm();
                this.updateAvatarPreview();
            } else if (response.status === 401) {
                this.handleAuthError();
            } else {
                this.showAlert('Erro ao carregar perfil', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            this.showAlert('Erro de conexão ao carregar perfil', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    populateProfileForm() {
        if (!this.userProfile) return;

        const { user, profile } = this.userProfile;

        // Preencher formulário de perfil
        document.getElementById('displayName').value = profile.displayName || user.name;
        document.getElementById('location').value = profile.location || '';
        document.getElementById('website').value = profile.website || '';
        document.getElementById('bio').value = profile.bio || '';
        
        // Atualizar contador de bio
        this.updateBioCounter();
    }

    updateAvatarPreview() {
        if (this.userProfile && this.userProfile.profile.avatar) {
            const avatarUrl = this.userProfile.profile.avatar.url;
            document.getElementById('avatarPreview').src = avatarUrl.startsWith('/') ? avatarUrl : `/uploads/avatars/${avatarUrl}`;
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Navegação entre abas
        const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabLinks.forEach(link => {
            link.addEventListener('shown.bs.tab', (e) => {
                this.handleTabChange(e.target.getAttribute('href'));
            });
        });

        // Contador de bio
        document.getElementById('bio').addEventListener('input', () => this.updateBioCounter());

        // Upload de avatar
        document.getElementById('avatarInput').addEventListener('change', (e) => this.handleAvatarUpload(e));
        document.getElementById('removeAvatarBtn').addEventListener('click', () => this.removeAvatar());

        // Validação de senha
        document.getElementById('newPassword').addEventListener('input', () => this.checkPasswordStrength());
        document.getElementById('confirmPassword').addEventListener('input', () => this.checkPasswordMatch());
    }

    setupFormHandlers() {
        // Formulário de perfil
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        
        // Formulário de senha
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const formData = {
            displayName: document.getElementById('displayName').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            website: document.getElementById('website').value.trim(),
            location: document.getElementById('location').value.trim()
        };

        try {
            this.showLoading('Salvando perfil...');
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                this.userProfile = data.data;
                this.showAlert('Perfil atualizado com sucesso!', 'success');
                
                // Atualizar nome no header se necessário
                if (this.currentUser.name !== data.data.profile.displayName) {
                    this.currentUser.name = data.data.profile.displayName;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                    document.getElementById('headerUserName').textContent = data.data.profile.displayName;
                }
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.message || 'Erro ao atualizar perfil', 'danger');
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            this.showAlert('Erro de conexão ao atualizar perfil', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validar arquivo
        if (!this.validateImageFile(file)) {
            this.showAlert('Arquivo inválido. Use JPG, PNG, GIF ou WebP (máx. 3MB)', 'danger');
            return;
        }

        try {
            this.showLoading('Enviando imagem...');
            
            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.userProfile = data.data;
                this.updateAvatarPreview();
                this.showAlert('Avatar atualizado com sucesso!', 'success');
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.message || 'Erro ao atualizar avatar', 'danger');
            }
        } catch (error) {
            console.error('Erro ao fazer upload do avatar:', error);
            this.showAlert('Erro de conexão ao atualizar avatar', 'danger');
        } finally {
            this.hideLoading();
            // Limpar input de arquivo
            e.target.value = '';
        }
    }

    async removeAvatar() {
        if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
            return;
        }

        try {
            this.showLoading('Removendo avatar...');
            
            // Implementar remoção de avatar (precisa de rota no backend)
            this.showAlert('Funcionalidade de remoção de avatar em desenvolvimento', 'info');
            
        } catch (error) {
            console.error('Erro ao remover avatar:', error);
            this.showAlert('Erro ao remover avatar', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações
        if (newPassword !== confirmPassword) {
            this.showAlert('As senhas não coincidem', 'danger');
            return;
        }

        if (newPassword.length < 8) {
            this.showAlert('A nova senha deve ter pelo menos 8 caracteres', 'danger');
            return;
        }

        try {
            this.showLoading('Alterando senha...');
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            if (response.ok) {
                this.showAlert('Senha alterada com sucesso!', 'success');
                document.getElementById('passwordForm').reset();
                this.checkPasswordStrength(); // Resetar indicador
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.message || 'Erro ao alterar senha', 'danger');
            }
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            this.showAlert('Erro de conexão ao alterar senha', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async loadUserStats() {
        try {
            const token = localStorage.getItem('token');
            
            // Carregar estatísticas básicas
            const [profileResponse, activitiesResponse] = await Promise.all([
                fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/profile/stats', { // Rota fictícia - precisa implementar
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null) // Ignorar erro se rota não existir
            ]);

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                this.updateStatsCards(profileData.data.stats);
            }

            if (activitiesResponse && activitiesResponse.ok) {
                const activitiesData = await activitiesResponse.json();
                this.updateRecentActivity(activitiesData.data.recentActivity);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    updateStatsCards(stats) {
        if (!stats) return;

        document.getElementById('statsPosts').textContent = stats.posts || 0;
        document.getElementById('statsComments').textContent = stats.comments || 0;
        document.getElementById('statsLikes').textContent = stats.likes || 0;

        document.getElementById('statPostsTotal').textContent = stats.posts || 0;
        document.getElementById('statCommentsTotal').textContent = stats.comments || 0;
        document.getElementById('statLikesTotal').textContent = stats.likes || 0;
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">Nenhuma atividade recente</p>';
            return;
        }

        const activitiesHtml = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-time">${this.formatTime(activity.createdAt)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHtml;
    }

    // Métodos auxiliares
    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 3 * 1024 * 1024; // 3MB

        if (!validTypes.includes(file.type)) {
            return false;
        }

        if (file.size > maxSize) {
            return false;
        }

        return true;
    }

    checkPasswordStrength() {
        const password = document.getElementById('newPassword').value;
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');

        let strength = 0;
        let text = 'Muito fraca';
        let color = 'danger';

        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
        if (password.match(/\d/)) strength += 25;
        if (password.match(/[^a-zA-Z\d]/)) strength += 25;

        strengthBar.style.width = strength + '%';

        if (strength >= 75) {
            text = 'Muito forte';
            color = 'success';
        } else if (strength >= 50) {
            text = 'Forte';
            color = 'info';
        } else if (strength >= 25) {
            text = 'Média';
            color = 'warning';
        }

        strengthBar.className = `progress-bar bg-${color}`;
        strengthText.textContent = text;
        strengthText.className = `text-${color}`;
    }

    checkPasswordMatch() {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const matchText = document.getElementById('passwordMatchText');

        if (!confirm) {
            matchText.textContent = '';
            return;
        }

        if (password === confirm) {
            matchText.textContent = 'Senhas coincidem';
            matchText.className = 'form-text text-success';
        } else {
            matchText.textContent = 'Senhas não coincidem';
            matchText.className = 'form-text text-danger';
        }
    }

    updateBioCounter() {
        const bio = document.getElementById('bio').value;
        const counter = document.getElementById('bioCounter');
        counter.textContent = bio.length;
        
        if (bio.length > 450) {
            counter.className = 'text-warning';
        } else if (bio.length > 490) {
            counter.className = 'text-danger';
        } else {
            counter.className = 'text-muted';
        }
    }

    getActivityIcon(action) {
        const icons = {
            'create_post': 'fa-edit',
            'update_post': 'fa-sync',
            'comment_post': 'fa-comment',
            'like_post': 'fa-heart',
            'update_profile': 'fa-user-edit',
            'update_avatar': 'fa-camera',
            'change_password': 'fa-lock'
        };
        return icons[action] || 'fa-circle';
    }

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

    handleTabChange(tabId) {
        if (tabId === '#stats') {
            this.loadUserStats();
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    handleAuthError() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
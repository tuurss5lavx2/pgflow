document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Verificar se o usuário já está logado
    const token = localStorage.getItem('token');
    if (token && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
        window.location.href = '/dashboard';
    }
    
    // Preencher dados do usuário no dashboard
    if (window.location.pathname === '/dashboard') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
        
        // Adicionar evento de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validação básica
    if (!email || !password) {
        showAlert('Por favor, preencha todos os campos', 'danger');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('Por favor, insira um email válido', 'danger');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showAlert('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showAlert(data.message || 'Erro ao fazer login', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
            submitBtn.disabled = false;
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Por favor, preencha todos os campos', 'danger');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('Por favor, insira um email válido', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres', 'danger');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem', 'danger');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Criando conta...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Conta criada com sucesso! Redirecionando para login...', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showAlert(data.message || 'Erro ao criar conta', 'danger');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Criar Conta';
            submitBtn.disabled = false;
        }
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAlert('Logout realizado com sucesso!', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

function showAlert(message, type) {
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
    
    // Encontrar o container apropriado
    let container;
    if (document.querySelector('.auth-container')) {
        container = document.querySelector('.auth-container');
    } else if (document.querySelector('.container')) {
        container = document.querySelector('.container');
    } else {
        container = document.body;
    }
    
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Verificar autenticação em páginas protegidas
function checkAuth() {
    const token = localStorage.getItem('token');
    const protectedRoutes = ['/dashboard'];
    const currentPath = window.location.pathname;
    
    if (protectedRoutes.includes(currentPath) && !token) {
        window.location.href = '/login';
        return false;
    }
    
    return true;
}

// Executar verificação de autenticação
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// Função para obter o token do usuário logado
function getAuthToken() {
    return localStorage.getItem('token');
}

// Função para obter dados do usuário logado
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Função para verificar se o usuário está logado
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Exportar funções para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        handleRegister,
        handleLogout,
        showAlert,
        validateEmail,
        checkAuth,
        getAuthToken,
        getCurrentUser,
        isLoggedIn
    };
}
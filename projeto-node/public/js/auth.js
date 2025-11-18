// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');
    
    if (!passwordInput || !toggleButton) return;
    
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update button icon
    const icon = toggleButton.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    const progressBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordText');
    
    if (!progressBar || !strengthText) return;
    
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    
    progressBar.style.width = strength + '%';
    
    if (strength < 50) {
        progressBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Senha fraca';
    } else if (strength < 75) {
        progressBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Senha média';
    } else {
        progressBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Senha forte';
    }
}

// Show alert function
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
    
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Form validation
function validateForm(formData) {
    const { name, email, password, confirmPassword } = formData;
    
    if (name && name.length < 2) {
        showAlert('Nome deve ter pelo menos 2 caracteres', 'danger');
        return false;
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showAlert('Por favor, insira um email válido', 'danger');
        return false;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres', 'danger');
        return false;
    }
    
    if (confirmPassword && password !== confirmPassword) {
        showAlert('As senhas não coincidem', 'danger');
        return false;
    }
    
    return true;
}

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle password visibility
    const toggleButton = document.getElementById('togglePassword');
    if (toggleButton) {
        toggleButton.addEventListener('click', togglePasswordVisibility);
    }
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Form submissions
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
    
    // Preencher dados do usuário se estiver no dashboard
    if (window.location.pathname === '/dashboard') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validação básica
    if (!validateForm({ email, password })) {
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
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar na Conta';
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
    
    // Validação
    if (!validateForm({ name, email, password, confirmPassword })) {
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
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Criar Minha Conta';
            submitBtn.disabled = false;
        }
    }
}

// Logout function (para ser usada no dashboard)
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Adicionar evento de logout se o botão existir
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
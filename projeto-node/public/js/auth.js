// auth.js ATUALIZADO com persistência de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // ✅ VERIFICAR LOGIN AUTOMATICAMENTE
    checkAuthStatus();
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        setupPasswordStrength();
    }
});

// ✅ SISTEMA DE PERSISTÊNCIA MELHORADO
function checkAuthStatus() {
    const token = getStoredToken();
    const user = getStoredUser();
    
    if (token && user) {
        // Verificar se o token ainda é válido
        verifyToken(token).then(isValid => {
            if (isValid && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
                window.location.href = '/dashboard';
            }
        }).catch(() => {
            // Token inválido, limpar storage
            clearAuthData();
        });
    }
}

// ✅ OBTER TOKEN COM FALLBACK
function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getStoredUser() {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// ✅ SALVAR DADOS DE AUTENTICAÇÃO
// Função para salvar dados de autenticação
function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
}


// ✅ LIMPAR DADOS
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}

// ✅ VERIFICAR TOKEN NO SERVIDOR
async function verifyToken(token) {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// ✅ HANDLE LOGIN ATUALIZADO
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = true; // Você pode adicionar um checkbox "Lembrar-me"
    
    try {
        const submitButton = e.target.querySelector('button[type="submit"]');
        const btnText = submitButton.querySelector('.btn-text');
        const spinner = submitButton.querySelector('.spinner');
        
        // Mostrar loading
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        submitButton.disabled = true;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // ✅ SALVAR COM PERSISTÊNCIA
            saveAuthData(data.token, data.user, rememberMe);
            
            showAlert('Login realizado com sucesso!', 'success');
            
            // Redirecionar após breve delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showAlert(data.message, 'danger');
            // Restaurar botão
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            submitButton.disabled = false;
        }
    } catch (error) {
        showAlert('Erro ao fazer login. Tente novamente.', 'danger');
        const submitButton = e.target.querySelector('button[type="submit"]');
        const btnText = submitButton.querySelector('.btn-text');
        const spinner = submitButton.querySelector('.spinner');
        
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
        submitButton.disabled = false;
    }
}

// No arquivo auth.js - função handleRegister atualizada
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        const submitButton = e.target.querySelector('button[type="submit"]');
        const btnText = submitButton.querySelector('.btn-text');
        const spinner = submitButton.querySelector('.spinner');
        
        // Mostrar loading
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        submitButton.disabled = true;

        // 1. Primeiro cria a conta
        const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const registerData = await registerResponse.json();
        
        if (registerResponse.ok) {
            // ✅ CONTA CRIADA COM SUCESSO - AGORA FAZ LOGIN AUTOMÁTICO
            console.log('✅ Conta criada, fazendo login automático...');
            
            // 2. Faz login automaticamente
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const loginData = await loginResponse.json();
            
            if (loginResponse.ok) {
                // ✅ LOGIN BEM-SUCEDIDO - SALVA OS DADOS E REDIRECIONA
                saveAuthData(loginData.token, loginData.user);
                
                showAlert('Conta criada e login realizado com sucesso!', 'success');
                
                // Redireciona para o dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } else {
                // ❌ ERRO NO LOGIN AUTOMÁTICO - REDIRECIONA PARA LOGIN NORMAL
                showAlert('Conta criada! Faça login para continuar.', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
            
        } else {
            showAlert(registerData.message, 'danger');
            // Restaurar botão
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            submitButton.disabled = false;
        }
    } catch (error) {
        showAlert('Erro ao criar conta. Tente novamente.', 'danger');
        const submitButton = e.target.querySelector('button[type="submit"]');
        const btnText = submitButton.querySelector('.btn-text');
        const spinner = submitButton.querySelector('.spinner');
        
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
        submitButton.disabled = false;
    }
}

// ✅ SISTEMA DE FORÇA DE SENHA
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const strengthText = document.getElementById('strengthText');
        const strengthFill = document.getElementById('strengthFill');
        
        if (!strengthText || !strengthFill) return;
        
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        strengthText.textContent = strength.text;
        strengthFill.style.width = strength.percentage + '%';
        strengthFill.style.background = strength.color;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 25;
    if (password.match(/\d/)) score += 25;
    if (password.match(/[^a-zA-Z\d]/)) score += 25;
    
    if (score >= 75) {
        return { text: 'Forte', percentage: 100, color: '#10b981' };
    } else if (score >= 50) {
        return { text: 'Média', percentage: 75, color: '#f59e0b' };
    } else if (score >= 25) {
        return { text: 'Fraca', percentage: 50, color: '#f97316' };
    } else {
        return { text: 'Muito fraca', percentage: 25, color: '#ef4444' };
    }
}

// ✅ SISTEMA DE ALERTAS MODERNO
function showAlert(message, type) {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert-auth');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-auth alert-${type}`;
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center p-3">
            <i class="fas ${getAlertIcon(type)} me-3" style="font-size: 1.2rem;"></i>
            <div class="flex-grow-1" style="color: white;">${message}</div>
            <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    // Estilos dinâmicos baseados no tipo
    const bgColors = {
        success: 'rgba(16, 185, 129, 0.9)',
        danger: 'rgba(239, 68, 68, 0.9)',
        warning: 'rgba(245, 158, 11, 0.9)',
        info: 'rgba(59, 130, 246, 0.9)'
    };
    
    alertDiv.style.background = bgColors[type] || bgColors.info;
    
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

// ✅ SOM DE NOTIFICAÇÃO (mantido)
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
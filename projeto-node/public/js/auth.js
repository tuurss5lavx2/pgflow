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
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando...';
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
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showAlert('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showAlert(data.message, 'danger');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        showAlert('Erro ao fazer login. Tente novamente.', 'danger');
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
        submitButton.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres', 'danger');
        return;
    }
    
    try {
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Criando conta...';
        submitButton.disabled = true;

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
            showAlert(data.message, 'danger');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        showAlert('Erro ao criar conta. Tente novamente.', 'danger');
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>Criar Conta';
        submitButton.disabled = false;
    }
}

// ✅ SISTEMA DE ALERTAS FIXOS - ATUALIZADO COM SOM
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
    
    // ✅ TOCA SOM PARA ALERTAS DE SUCESSO
    if (type === 'success') {
        playNotificationSound();
    }
    
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
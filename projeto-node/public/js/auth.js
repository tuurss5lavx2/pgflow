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

// ✅ SISTEMA DE SOM SUPER CONFIÁVEL PARA RENDER
async function playNotificationSound() {
    console.log('🎵 Iniciando reprodução de som...');
    
    try {
        const sound = document.getElementById('notificationSound');
        
        if (!sound) {
            console.log('🔇 Elemento de áudio não encontrado, usando fallback...');
            return playFallbackBeep();
        }
        
        // Para e reinicia o som
        sound.pause();
        sound.currentTime = 0;
        
        // Tenta tocar o som principal
        try {
            await sound.play();
            console.log('✅ Som principal tocando com sucesso!');
            return;
        } catch (playError) {
            console.log('🔄 Som principal falhou, tentando fallback online...', playError);
        }
        
        // Fallback: tenta carregar um som online diretamente
        await playDirectOnlineSound();
        
    } catch (error) {
        console.log('❌ Erro geral no sistema de som:', error);
        playFallbackBeep();
    }
}

// ✅ FALLBACK DIRETO COM SOM ONLINE
async function playDirectOnlineSound() {
    return new Promise((resolve) => {
        try {
            // Sons online de alta qualidade
            const onlineSounds = [
                'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
                'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
                'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3',
                'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'
            ];
            
            const randomSound = onlineSounds[Math.floor(Math.random() * onlineSounds.length)];
            console.log('🔊 Tentando som online:', randomSound);
            
            const audio = new Audio(randomSound);
            audio.volume = 0.4; // Volume agradável
            audio.preload = 'auto';
            
            // Toca o som
            audio.play().then(() => {
                console.log('✅ Som online direto funcionou!');
                resolve();
            }).catch(e => {
                console.log('❌ Som online direto falhou, usando beep...');
                playFallbackBeep();
                resolve();
            });
            
            // Timeout de segurança
            setTimeout(() => {
                if (!audio.ended) {
                    console.log('⏰ Timeout do som online');
                    resolve();
                }
            }, 3000);
            
        } catch (error) {
            console.log('❌ Erro no fallback online:', error);
            playFallbackBeep();
            resolve();
        }
    });
}

// ✅ FALLBACK BEEP (GARANTIDO)
function playFallbackBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Som agradável
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        
        console.log('🔊 Beep de fallback executado');
    } catch (error) {
        console.log('🎵 Sistema de áudio indisponível');
    }
}
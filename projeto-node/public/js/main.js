// Scroll animations and main functionality for new centered design
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    function handleNavbarScroll() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const targetPosition = target.offsetTop - 80;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animated counter for stats
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target + (element.textContent.includes('%') ? '%' : '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + (element.textContent.includes('%') ? '%' : '');
            }
        }, 16);
    }

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target.querySelector('.stat-number');
                if (counter && counter.getAttribute('data-count')) {
                    animateCounter(counter);
                }
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-modern').forEach(stat => {
        counterObserver.observe(stat);
    });

    // Parallax effect for hero background
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero-centered');
        if (hero) {
            const orbits = hero.querySelectorAll('.orbit-circle');
            orbits.forEach((orbit, index) => {
                const speed = 0.02 * (index + 1);
                orbit.style.transform = `translate(-50%, -50%) rotate(${scrolled * speed}deg)`;
            });
        }
    }

    window.addEventListener('scroll', updateParallax);

    // Loading animation for buttons
    document.querySelectorAll('.btn-primary').forEach(button => {
        if (button.getAttribute('href') === '/register') {
            button.addEventListener('click', function(e) {
                if (!this.disabled) {
                    e.preventDefault();
                    
                    // Show loading state
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Redirecionando...';
                    this.disabled = true;
                    
                    // Create confetti effect
                    createConfetti();
                    
                    // Redirect after animation
                    setTimeout(() => {
                        window.location.href = '/register';
                    }, 1500);
                }
            });
        }
    });

    // Confetti effect
    function createConfetti() {
        const colors = ['#10b981', '#34d399', '#86efac', '#059669', '#22c55e'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confettiContainer);

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            
            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                top: -20px;
                left: ${Math.random() * 100}vw;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                opacity: 0;
                animation: confetti-fall ${Math.random() * 3 + 2}s ease-in forwards;
            `;
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }

        // Remove container after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);

        // Add animation style if not present
        if (!document.querySelector('#confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Mobile menu handling
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.addEventListener('click', function() {
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }

    // Add hover effects to interactive elements
    document.querySelectorAll('.orbital-card, .stat-modern, .tech-item').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = this.style.transform.replace(/scale\([^)]*\)/, 'scale(1.05)');
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = this.style.transform.replace(/scale\([^)]*\)/, 'scale(1)');
        });
    });

    // Performance optimization
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Recalculate any layout-dependent animations
            updateParallax();
        }, 250);
    });
});

// Performance monitoring
window.addEventListener('load', function() {
    const loadTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    console.log(`PGFlow loaded in ${loadTime}ms`);
    
    if (loadTime < 1000) {
        console.log('🚀 Excellent performance!');
    }
});
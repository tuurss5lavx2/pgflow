// Scroll animations and main functionality
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

    // Throttle scroll events for performance
    let scrollTimer;
    window.addEventListener('scroll', function() {
        if (!scrollTimer) {
            scrollTimer = setTimeout(function() {
                scrollTimer = null;
                handleNavbarScroll();
            }, 10);
        }
    });

    // Initial navbar state
    handleNavbarScroll();

    // Scroll reveal animations
    const scrollReveal = function() {
        const elements = document.querySelectorAll('.scroll-reveal');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('revealed');
            }
        });
    };

    // Initial check
    scrollReveal();
    
    // Check on scroll with throttle
    let revealTimer;
    window.addEventListener('scroll', function() {
        if (!revealTimer) {
            revealTimer = setTimeout(function() {
                revealTimer = null;
                scrollReveal();
            }, 10);
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const targetPosition = target.offsetTop - 80; // Offset for navbar
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to navigation links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNav() {
        let current = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // Throttle active nav updates
    let activeNavTimer;
    window.addEventListener('scroll', function() {
        if (!activeNavTimer) {
            activeNavTimer = setTimeout(function() {
                activeNavTimer = null;
                updateActiveNav();
            }, 50);
        }
    });

    // Initial active nav state
    updateActiveNav();

    // Counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = parseFloat(target.textContent);
                let currentValue = 0;
                const duration = 2000;
                const increment = finalValue / (duration / 16);
                
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= finalValue) {
                        target.textContent = finalValue + (target.textContent.includes('%') ? '%' : '');
                        clearInterval(timer);
                    } else {
                        target.textContent = Math.floor(currentValue) + (target.textContent.includes('%') ? '%' : '');
                    }
                }, 16);
                
                observer.unobserve(target);
            }
        });
    }, { 
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    });

    statNumbers.forEach(stat => observer.observe(stat));

    // Add loading animation to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || this.classList.contains('btn-outline-light')) {
                return; // Don't show loading for demo buttons
            }
            
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Carregando...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 2000);
        });
    });

    // Add hover effects to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Remove parallax effect that was causing issues
    // Add confetti effect on CTA button click
    document.querySelectorAll('.btn-primary').forEach(button => {
        if (button.getAttribute('href') === '/register') {
            button.addEventListener('click', function(e) {
                if (!this.disabled) {
                    e.preventDefault();
                    createConfetti();
                    // Redirect after animation
                    setTimeout(() => {
                        window.location.href = '/register';
                    }, 1500);
                }
            });
        }
    });

    function createConfetti() {
        const colors = ['#10b981', '#34d399', '#86efac', '#059669', '#22c55e'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: 0;
                left: ${Math.random() * 100}vw;
                opacity: 0;
                pointer-events: none;
                border-radius: 2px;
                animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
                z-index: 1000;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
        
        // Add animation style if not already present
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

    // Mobile menu improvements
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

    // Handle resize events
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            scrollReveal();
            updateActiveNav();
        }, 250);
    });
});

// Performance monitoring
window.addEventListener('load', function() {
    const loadTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    console.log(`PGFlow loaded in ${loadTime}ms`);
    
    // Send to analytics (placeholder)
    if (loadTime < 1000) {
        console.log('🚀 Excellent performance!');
    }
    
    // Remove loading states if any
    document.querySelectorAll('.btn').forEach(button => {
        button.disabled = false;
        if (button.innerHTML.includes('fa-spinner')) {
            button.innerHTML = button.innerHTML.replace('<i class="fas fa-spinner fa-spin me-2"></i>Carregando...', 'Original Text');
        }
    });
});
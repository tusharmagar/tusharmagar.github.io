// Main navigation interaction
document.addEventListener('DOMContentLoaded', function() {
    // Navigation highlighting for active section
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle only (no animations)
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Project Card Expansion (fix for non-working details)
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const clickable = card.querySelector('.project-card-clickable');
        if (clickable) {
            clickable.addEventListener('click', function() {
                card.classList.toggle('active');
                
                // Update arrow direction
                const arrow = this.querySelector('.arrow');
                if (arrow) {
                    arrow.style.transform = card.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }
    });
});

// Lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.removeAttribute('data-src');
                    imageObserver.unobserve(image);
                }
            });
        });
        
        lazyImages.forEach(function(image) {
            imageObserver.observe(image);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        lazyImages.forEach(function(image) {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
        });
    }
});

// Add a slight parallax effect to the about section
window.addEventListener('scroll', function() {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const scrollPosition = window.scrollY;
        const parallaxOffset = scrollPosition * 0.1;
        aboutSection.style.backgroundPositionY = `${-parallaxOffset}px`;
    }
}); 
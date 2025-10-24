// ===========================
// Gallery & Lightbox
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');

    let currentImageIndex = 0;
    const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

    // Open lightbox when clicking on gallery item
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });

        // Keyboard accessibility
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `View image ${index + 1}`);

        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(index);
            }
        });
    });

    // Open lightbox
    function openLightbox(index) {
        currentImageIndex = index;
        lightboxImg.src = images[currentImageIndex];
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Set focus to close button for accessibility
        setTimeout(() => lightboxClose.focus(), 100);
    }

    // Close lightbox
    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Close button click
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Click outside image to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Previous image
    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        lightboxImg.src = images[currentImageIndex];
    }

    // Next image
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        lightboxImg.src = images[currentImageIndex];
    }

    // Navigation buttons
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', showPrevImage);
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', showNextImage);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    showPrevImage();
                    break;
                case 'ArrowRight':
                    showNextImage();
                    break;
            }
        }
    });

    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next image
                showNextImage();
            } else {
                // Swipe right - previous image
                showPrevImage();
            }
        }
    }

    // Preload adjacent images for smoother navigation
    function preloadAdjacentImages() {
        const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
        const nextIndex = (currentImageIndex + 1) % images.length;

        const prevImg = new Image();
        prevImg.src = images[prevIndex];

        const nextImg = new Image();
        nextImg.src = images[nextIndex];
    }

    // Call preload when lightbox opens
    lightbox.addEventListener('transitionend', preloadAdjacentImages);

    // Gallery filtering (optional - can be extended)
    const filterButtons = document.querySelectorAll('[data-filter]');

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterValue = button.getAttribute('data-filter');

                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter gallery items
                galleryItems.forEach(item => {
                    const category = item.getAttribute('data-category');

                    if (filterValue === 'all' || category === filterValue) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // Lazy loading for gallery images
    const lazyLoadGallery = () => {
        const galleryImages = document.querySelectorAll('.gallery-item img[loading="lazy"]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            galleryImages.forEach(img => imageObserver.observe(img));
        }
    };

    lazyLoadGallery();

    // Add image counter to lightbox
    const imageCounter = document.createElement('div');
    imageCounter.className = 'lightbox-counter';
    imageCounter.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
        z-index: 10001;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 0.5rem 1rem;
        border-radius: 20px;
    `;
    lightbox.appendChild(imageCounter);

    // Update counter when image changes
    function updateCounter() {
        imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
    }

    // Update counter on navigation
    const originalShowPrev = showPrevImage;
    const originalShowNext = showNextImage;

    showPrevImage = function() {
        originalShowPrev();
        updateCounter();
    };

    showNextImage = function() {
        originalShowNext();
        updateCounter();
    };

    // Zoom functionality for lightbox image
    let scale = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

    lightboxImg.addEventListener('dblclick', (e) => {
        if (scale === 1) {
            scale = 2;
            const rect = lightboxImg.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            translateX = (0.5 - x) * lightboxImg.width * scale;
            translateY = (0.5 - y) * lightboxImg.height * scale;
        } else {
            scale = 1;
            translateX = 0;
            translateY = 0;
        }

        lightboxImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        lightboxImg.style.cursor = scale > 1 ? 'move' : 'default';
    });

    // Reset zoom when closing or changing images
    const originalCloseLightbox = closeLightbox;
    closeLightbox = function() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        lightboxImg.style.transform = 'scale(1)';
        lightboxImg.style.cursor = 'default';
        originalCloseLightbox();
    };

    // Update image loading
    const originalOpenLightbox = openLightbox;
    openLightbox = function(index) {
        originalOpenLightbox(index);
        updateCounter();
        scale = 1;
        translateX = 0;
        translateY = 0;
        lightboxImg.style.transform = 'scale(1)';
    };

    console.log('Gallery initialized with', images.length, 'images');
});

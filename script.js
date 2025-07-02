// Portfolio Website JavaScript
// Author: AJ Radaza

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initSmoothScrolling();
    initLavaLampBackgrounds();
    initFadeInAnimations();
    initLazyVideoLoading();
    initBeforeAfterSliders();
});

// Navigation functionality (Tailwind responsive)
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const navbar = document.getElementById('navbar');

    // Hamburger menu toggle for mobile
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex');
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            }
            hamburger.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    if (mobileMenu) {
        const mobileMenuLinks = mobileMenu.querySelectorAll('a:not(.services-dropdown-menu a)'); // Exclude services dropdown links
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
                if (hamburger) {
                    hamburger.classList.remove('active');
                }
            });
        });
    }

    // Navbar scroll effect with dynamic brightness calculation
    const navbarScrollHandler = function() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        
        const navBrand = navbar.querySelector('.font-bold');
        const navLinks = navbar.querySelectorAll('#nav-links > li > a, .services-dropdown-toggle');
        const hamburgerSpans = navbar.querySelectorAll('#hamburger span');
        const mobileMenu = document.getElementById('mobile-menu');
        if (!mobileMenu) return;
        
        const mobileMenuLinks = mobileMenu.querySelectorAll('a:not(.services-dropdown-menu a)'); // Exclude services dropdown links
        const mobileServicesButton = mobileMenu.querySelector('.services-dropdown-toggle');
        
        // Calculate navbar background effective brightness using sample points at navbar text positions
        const navbarRect = navbar.getBoundingClientRect();
        
        // Get all navbar text elements to sample at their positions
        const textElements = [
            navBrand,
            ...Array.from(navLinks),
            ...Array.from(hamburgerSpans) // Include hamburger for mobile
        ].filter(element => element && element.offsetParent !== null); // Only visible elements
        
        // If mobile menu is open, also include mobile menu text elements as sampling points
        const isMobileMenuVisible = !mobileMenu.classList.contains('hidden');
        if (isMobileMenuVisible) {
            const mobileMenuLinksForSampling = mobileMenu.querySelectorAll('a:not(.services-dropdown-menu a)'); // Exclude services dropdown links from sampling
            textElements.push(
                ...Array.from(mobileMenuLinksForSampling).filter(link => link.offsetParent !== null),
                ...(mobileServicesButton && mobileServicesButton.offsetParent !== null ? [mobileServicesButton] : [])
            );
        }
        
        const darkPoints = [];
        let totalBrightness = 0;
        const sampleCount = textElements.length;
        
        textElements.forEach(textElement => {
            const textRect = textElement.getBoundingClientRect();
            const sampleX = textRect.left + textRect.width / 2; // Center of text element
            const sampleY = textRect.top + textRect.height / 2;
            
            // Get the element behind each text element
            navbar.style.pointerEvents = 'none';
            const elementBehind = document.elementFromPoint(sampleX, sampleY);
            navbar.style.pointerEvents = '';
            
            let backgroundBrightness = 255; // Default to light
            
            if (elementBehind) {
                // Calculate brightness for this sample point
                const computedStyle = window.getComputedStyle(elementBehind);
                const backgroundColor = computedStyle.backgroundColor;
                
                // Check for specific dark backgrounds
                const isDarkHero = (
                    elementBehind.classList.contains('hero') ||
                    elementBehind.closest('.hero') ||
                    elementBehind.classList.contains('bg-gradient-to-br') ||
                    elementBehind.closest('.bg-gradient-to-br')
                );
                
                const isDarkBlueBackground = (
                    elementBehind.classList.contains('bg-blue-900') ||
                    elementBehind.closest('.bg-blue-900') ||
                    elementBehind.classList.contains('bg-blue-950') ||
                    elementBehind.closest('.bg-blue-950')
                );
                
                const isVideo = (
                    elementBehind.tagName === 'IFRAME' ||
                    elementBehind.closest('iframe') ||
                    elementBehind.classList.contains('aspect-video') ||
                    elementBehind.closest('.aspect-video')
                );
                
                const isWhiteBackground = (
                    elementBehind.classList.contains('bg-white') ||
                    elementBehind.closest('.bg-white') ||
                    elementBehind.classList.contains('bg-gray-50') ||
                    elementBehind.closest('.bg-gray-50')
                );
                
                // Prioritize specific background types
                if (isDarkHero) {
                    backgroundBrightness = 10; // Very dark hero with gradients
                } else if (isDarkBlueBackground) {
                    backgroundBrightness = 20; // Dark blue backgrounds
                } else if (isVideo) {
                    backgroundBrightness = 25; // Dark videos/video containers
                } else if (isWhiteBackground) {
                    backgroundBrightness = 255; // Explicitly white backgrounds
                } else {
                    // Extract RGB values from computed background color
                    const rgb = backgroundColor.match(/\d+/g);
                    if (rgb && rgb.length >= 3) {
                        const r = parseInt(rgb[0]);
                        const g = parseInt(rgb[1]);
                        const b = parseInt(rgb[2]);
                        backgroundBrightness = (0.299 * r + 0.587 * g + 0.114 * b);
                    } else {
                        // If no background color detected, assume it's light
                        backgroundBrightness = 240;
                    }
                }
            }
            
            // Calculate effective brightness for this point
            const navbarOpacity = 0.2; // Both navbar and mobile menu use same opacity
            const blurEffect = 0.05;
            const whiteBrightness = 255;
            
            const effectiveBrightness = (navbarOpacity * whiteBrightness) + 
                                       ((1 - navbarOpacity) * backgroundBrightness * (1 - blurEffect)) +
                                       (blurEffect * whiteBrightness * 0.95);
            
            totalBrightness += effectiveBrightness;
            
            // Consider this point "dark" if effective brightness is below threshold
            if (effectiveBrightness < 90) {
                darkPoints.push(true);
            } else {
                darkPoints.push(false);
            }
        });
        
        // Calculate the percentage of dark points
        const darkPercentage = (darkPoints.filter(isDark => isDark).length / sampleCount) * 100;
        const averageBrightness = totalBrightness / sampleCount;
        
        // Determine if navbar should use white text
        // Use white text if 65% or more of the navbar is over dark content, OR if average brightness is very low
        const shouldUseWhiteText = (darkPercentage >= 65) || (averageBrightness < 60);
        
        // Apply text colors based on calculated brightness
        if (shouldUseWhiteText) {
            // Light text for dark effective background
            navBrand.classList.remove('text-blue-900');
            navBrand.classList.add('text-white');
            
            navLinks.forEach(link => {
                link.classList.remove('text-gray-800');
                link.classList.add('text-white');
                link.classList.remove('hover:text-blue-500');
                link.classList.add('hover:text-blue-200');
            });
            
            hamburgerSpans.forEach(span => {
                span.classList.remove('bg-blue-900');
                span.classList.add('bg-white');
            });
            
            // Apply to mobile menu links
            mobileMenuLinks.forEach(link => {
                link.classList.remove('text-gray-800');
                link.classList.add('text-white');
                link.classList.remove('hover:text-blue-500');
                link.classList.add('hover:text-blue-200');
            });
            
            if (mobileServicesButton) {
                mobileServicesButton.classList.remove('text-gray-800');
                mobileServicesButton.classList.add('text-white');
                mobileServicesButton.classList.remove('hover:text-blue-500');
                mobileServicesButton.classList.add('hover:text-blue-200');
            }
        } else {
            // Dark text for light effective background
            navBrand.classList.remove('text-white');
            navBrand.classList.add('text-blue-900');
            
            navLinks.forEach(link => {
                link.classList.remove('text-white');
                link.classList.add('text-gray-800');
                link.classList.remove('hover:text-blue-200');
                link.classList.add('hover:text-blue-500');
            });
            
            hamburgerSpans.forEach(span => {
                span.classList.remove('bg-white');
                span.classList.add('bg-blue-900');
            });
            
            // Apply to mobile menu links
            mobileMenuLinks.forEach(link => {
                link.classList.remove('text-white');
                link.classList.add('text-gray-800');
                link.classList.remove('hover:text-blue-200');
                link.classList.add('hover:text-blue-500');
            });
            
            if (mobileServicesButton) {
                mobileServicesButton.classList.remove('text-white');
                mobileServicesButton.classList.add('text-gray-800');
                mobileServicesButton.classList.remove('hover:text-blue-200');
                mobileServicesButton.classList.add('hover:text-blue-500');
            }
        }
    };
    
    if (navbar) {
        window.addEventListener('scroll', navbarScrollHandler);
        
        // Trigger initial navbar styling on page load
        navbarScrollHandler();
    }

    // --- Services Dropdown Toggle ---
    // Desktop & Mobile: Toggle dropdown on click, not hover
    const servicesDropdownToggles = document.querySelectorAll('.services-dropdown-toggle');
    const servicesDropdownMenus = document.querySelectorAll('.services-dropdown-menu');

    servicesDropdownToggles.forEach((toggle, idx) => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            // Close all dropdowns except this one
            servicesDropdownMenus.forEach((menu, i) => {
                if (i === idx) {
                    menu.classList.toggle('hidden');
                } else {
                    menu.classList.add('hidden');
                }
            });
        });
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        let clickedDropdown = false;
        servicesDropdownToggles.forEach(toggle => {
            if (toggle.contains(e.target)) clickedDropdown = true;
        });
        servicesDropdownMenus.forEach(menu => {
            if (menu.contains(e.target)) clickedDropdown = true;
        });
        if (!clickedDropdown) {
            servicesDropdownMenus.forEach(menu => menu.classList.add('hidden'));
        }
    });
    // Close dropdown on link click (for mobile UX)
    servicesDropdownMenus.forEach(menu => {
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                menu.classList.add('hidden');
            });
        });
    });
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                const hamburger = document.getElementById('hamburger');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenu.classList.remove('flex');
                    if (hamburger) {
                        hamburger.classList.remove('active');
                    }
                }
            }
        });
    });
}

// Lava Lamp Animated Background (Random Circular Blobs, Per-Page Colors)
function initLavaLampBackgrounds() {
    const canvases = document.querySelectorAll('.lava-lamp-bg');
    if (!canvases.length) return;

    // Brand color palettes per page
    const pageColors = {
        'app-development': ['#2563eb', '#a21caf', '#fbbf24'], // blue, purple, yellow
        'video-editing': ['#8b5cf6', '#06b6d4', '#f59e0b'],   // purple, cyan, amber
        'photo-editing': ['#059669', '#ec4899', '#ea580c'],    // emerald, pink, orange
        'audio-music': ['#6366f1', '#fbbf24', '#f43f5e'],      // indigo, yellow, rose
        'web-development': ['#10b981', '#3b82f6', '#8b5cf6'],  // emerald, blue, purple
        'python-automation': ['#fbbf24', '#2563eb', '#10b981'],// yellow, blue, emerald
        'index': ['#2563eb', '#a21caf', '#f43f5e']             // blue, purple, rose
    };

    // Determine page key
    let pageKey = 'index';
    const path = window.location.pathname;
    if (path.includes('app-development')) pageKey = 'app-development';
    else if (path.includes('video-editing')) pageKey = 'video-editing';
    else if (path.includes('photo-editing')) pageKey = 'photo-editing';
    else if (path.includes('audio-music')) pageKey = 'audio-music';
    else if (path.includes('web-development')) pageKey = 'web-development';
    else if (path.includes('python-automation')) pageKey = 'python-automation';

    const colors = pageColors[pageKey] || pageColors['index'];

    canvases.forEach(canvas => {
        let dpr = window.devicePixelRatio || 1;
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Blob parameters
        const blobCount = 2;
        const blobs = Array.from({length: blobCount}).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            return {
                baseR: Math.max(width, height) * (0.25 + Math.random() * 0.15),
                orbitR: Math.min(width, height) * (0.18 + Math.random() * 0.18),
                speed: 0.008 + Math.random() * 0.006 * (i % 2 === 0 ? 1 : -1),
                phase: angle,
                color: colors[i % colors.length]
            };
        });
        let t = 0;

        function animate() {
            ctx.clearRect(0, 0, width, height);
            t += 1;
            blobs.forEach((blob, i) => {
                // Organic movement: add a little wobble
                const angle = blob.phase + t * blob.speed + Math.sin(t * 0.002 + i) * 0.5;
                const cx = width / 2 + Math.cos(angle) * blob.orbitR;
                const cy = height / 2 + Math.sin(angle) * blob.orbitR;
                const grad = ctx.createRadialGradient(cx, cy, blob.baseR * 0.2, cx, cy, blob.baseR);
                grad.addColorStop(0, hexToRgba(blob.color, 0.7));
                grad.addColorStop(1, hexToRgba(blob.color, 0.0));
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            });
            ctx.globalAlpha = 1;
            requestAnimationFrame(animate);
        }

        animate();

        // Responsive resize
        window.addEventListener('resize', () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        });
    });

    // Helper: convert hex to rgba
    function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        const num = parseInt(hex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

// Initialize fade-in animations with Intersection Observer
function initFadeInAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

// Lazy video loading functionality with thumbnail fetching
function initLazyVideoLoading() {
    const videoPlaceholders = document.querySelectorAll('.video-placeholder');
    
    // Fetch thumbnails for all videos
    videoPlaceholders.forEach(placeholder => {
        const vimeoId = placeholder.getAttribute('data-vimeo-id');
        if (!vimeoId) return;
        
        // Try multiple methods to get Vimeo thumbnail
        loadVimeoThumbnail(vimeoId, placeholder);
        
        // Add click handler to load video
        placeholder.addEventListener('click', function() {
            const vimeoId = this.getAttribute('data-vimeo-id');
            if (!vimeoId) return;
            
            // Replace placeholder with iframe
            const iframe = document.createElement('iframe');
            iframe.src = `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&autoplay=1&player_id=0&app_id=58479`;
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
            iframe.className = 'absolute inset-0 w-full h-full object-contain';
            iframe.style.background = '#000';
            iframe.title = `Video ${vimeoId}`;
            
            // Clear placeholder content and add iframe
            this.innerHTML = '';
            this.appendChild(iframe);
            
            // Remove click handler
            this.removeEventListener('click', arguments.callee);
            this.classList.remove('cursor-pointer', 'group');
        });
    });
}

// Load Vimeo thumbnail with multiple fallback methods
function loadVimeoThumbnail(vimeoId, placeholder) {
    // Simple test first - let's just try the first URL directly
    const thumbnailUrl = `https://vumbnail.com/${vimeoId}.jpg`;
    
    const testImg = new Image();
    
    testImg.onload = function() {
        // Successfully loaded, replace the placeholder content completely
        placeholder.innerHTML = `
            <img src="${thumbnailUrl}" alt="Video thumbnail" class="w-full h-full object-cover">
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-6 group-hover:bg-opacity-70 transition-all duration-300">
                <svg class="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        `;
        placeholder.classList.add('group');
        
        console.log('Thumbnail loaded and applied for video:', vimeoId);
    };
    
    testImg.onerror = function() {
        console.log('Thumbnail failed to load for video:', vimeoId);
        updatePlaceholderText(placeholder);
    };
    
    testImg.src = thumbnailUrl;
}

// Update placeholder with actual thumbnail
function updatePlaceholderWithThumbnail(placeholder, thumbnailUrl) {
    // Clear all existing content first
    placeholder.innerHTML = '';
    
    // Create new thumbnail structure
    const thumbnailHtml = `
        <img src="${thumbnailUrl}" alt="Video thumbnail" class="absolute inset-0 w-full h-full object-cover">
        <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-20 transition-all duration-300">
            <div class="text-center text-white">
                <div class="w-20 h-20 mx-auto mb-4 bg-black bg-opacity-50 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium drop-shadow-lg">Click to Play</p>
            </div>
        </div>
    `;
    
    placeholder.innerHTML = thumbnailHtml;
    placeholder.classList.add('group'); // Add group class for hover effects
}

// Update placeholder text from "Loading..." to "Click to Play"
function updatePlaceholderText(placeholder) {
    const loadingText = placeholder.querySelector('.loading-placeholder p');
    if (loadingText) {
        loadingText.textContent = 'Click to Play';
    }
}

// Before/After Slider functionality for photo editing portfolio
function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.before-after-slider');
    
    sliders.forEach(slider => {
        const handle = slider.querySelector('.slider-handle');
        const afterImage = slider.querySelector('.after-image');
        
        if (!handle || !afterImage) return;
        
        let isDragging = false;
        
        // Mouse events
        handle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        // Touch events for mobile
        handle.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);
        
        function startDrag(e) {
            isDragging = true;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const sliderRect = slider.getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const x = clientX - sliderRect.left;
            const percentage = Math.max(0, Math.min(100, (x / sliderRect.width) * 100));
            
            // Update handle position
            handle.style.left = percentage + '%';
            
            // Update after image clip-path
            afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
            
            e.preventDefault();
        }
        
        function stopDrag() {
            isDragging = false;
            handle.style.cursor = 'ew-resize';
        }
        
        // Click to move slider
        slider.addEventListener('click', function(e) {
            if (e.target === handle) return;
            
            const sliderRect = slider.getBoundingClientRect();
            const x = e.clientX - sliderRect.left;
            const percentage = Math.max(0, Math.min(100, (x / sliderRect.width) * 100));
            
            // Animate to new position
            handle.style.transition = 'left 0.3s ease';
            afterImage.style.transition = 'clip-path 0.3s ease';
            
            handle.style.left = percentage + '%';
            afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
            
            // Remove transition after animation
            setTimeout(() => {
                handle.style.transition = '';
                afterImage.style.transition = '';
            }, 300);
        });
    });
}

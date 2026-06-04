/* ==========================================================================
   NEXUS MOTION ENGINE - SCRIPTS & INTERACTIVITY
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize System Abstractions
    initCustomCursor();
    initStarfieldCanvas();
    initNavbarGlow();
    initMagneticHover();
    initAboutImageAnimation();
    initSkillsAnimation();
    initMobileMenuOverlay();
    initHero3DIcon();
    initServicesHorizontalScroll();

    // Hide main elements immediately to prevent flash of content during loading
    gsap.set(".reveal-element", { opacity: 0, y: 30 });
    gsap.set(".navbar", { y: -80, opacity: 0 });

    // Core Timelines
    prepareHeroSubtitle();
    initPreloader();
    initScrollDrivenTransitions();
});

/* ==========================================================================
   1. CUSTOM DUAL-LAYERED CURSOR
   ========================================================================== */

function initCustomCursor() {
    const cursorDot = document.getElementById("cursor-dot");
    const cursorGlow = document.getElementById("cursor-glow");

    if (!cursorDot || !cursorGlow) return;

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let glowX = 0;
    let glowY = 0;

    let isMoving = false;

    // Damp factor (lerp) for trailing glow
    const damping = 0.16;

    // Track mouse position on desktop
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Show cursor elements on first move
        if (!isMoving) {
            cursorDot.style.display = "block";
            cursorGlow.style.display = "block";
            isMoving = true;
        }
    });

    // Custom animation tick
    function tickCursor() {
        if (isMoving) {
            // Direct dot tracking
            dotX += (mouseX - dotX);
            dotY += (mouseY - dotY);

            // Damped trailing glow tracking
            glowX += (mouseX - glowX) * damping;
            glowY += (mouseY - glowY) * damping;

            cursorDot.style.left = `${dotX}px`;
            cursorDot.style.top = `${dotY}px`;

            cursorGlow.style.left = `${glowX}px`;
            cursorGlow.style.top = `${glowY}px`;
        }
        requestAnimationFrame(tickCursor);
    }
    tickCursor();

    // Hover elements selectors
    const hoverElements = document.querySelectorAll("a, button, .menu-toggle, .magnetic, input, textarea, .magnetic-card");

    hoverElements.forEach((el) => {
        el.addEventListener("mouseenter", () => {
            cursorGlow.classList.add("hover-active");
            gsap.to(cursorDot, { scale: 0, duration: 0.2 });
        });

        el.addEventListener("mouseleave", () => {
            cursorGlow.classList.remove("hover-active");
            gsap.to(cursorDot, { scale: 1, duration: 0.2 });
        });
    });

    // Hide custom cursors when pointer leaves browser window
    document.addEventListener("mouseleave", () => {
        cursorDot.style.opacity = "0";
        cursorGlow.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
        cursorDot.style.opacity = "1";
        cursorGlow.style.opacity = "1";
    });
}

/* ==========================================================================
   2. LIGHTWEIGHT CANVAS STARFIELD SYSTEM
   ========================================================================== */

function initStarfieldCanvas() {
    const canvas = document.getElementById("starfield-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let stars = [];
    const starCount = 110;

    // Mouse coords for 3D depth parallax
    let currentMouseX = 0;
    let currentMouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const parallaxDamp = 0.05;

    // Resize handler
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
    }

    // Initialize stars array
    function initStars() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.4,
                alpha: Math.random() * 0.7 + 0.1,
                twinkleRate: Math.random() * 0.02 + 0.005,
                twinkleDir: Math.random() > 0.5 ? 1 : -1,
                depth: Math.random() * 0.8 + 0.2 // Depth factor for parallax
            });
        }
    }

    // Capture mouse coordinates relative to window center
    window.addEventListener("mousemove", (e) => {
        targetMouseX = (e.clientX - window.innerWidth / 2);
        targetMouseY = (e.clientY - window.innerHeight / 2);
    });

    // Render loop
    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smoothly interpolate mouse parallax displacements
        currentMouseX += (targetMouseX - currentMouseX) * parallaxDamp;
        currentMouseY += (targetMouseY - currentMouseY) * parallaxDamp;

        stars.forEach((star) => {
            // Apply twinkle fluctuation
            star.alpha += star.twinkleRate * star.twinkleDir;
            if (star.alpha >= 0.8) {
                star.alpha = 0.8;
                star.twinkleDir = -1;
            } else if (star.alpha <= 0.15) {
                star.alpha = 0.15;
                star.twinkleDir = 1;
            }

            // Calculate 3D Parallax offset based on star depth
            const px = star.x - (currentMouseX * star.depth * 0.06);
            const py = star.y - (currentMouseY * star.depth * 0.06);

            // Wrap coordinates if they drift completely off-screen
            let finalX = px;
            let finalY = py;

            if (finalX < 0) finalX += canvas.width;
            if (finalX > canvas.width) finalX -= canvas.width;
            if (finalY < 0) finalY += canvas.height;
            if (finalY > canvas.height) finalY -= canvas.height;

            // Draw glowing stars
            ctx.beginPath();
            ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(192, 132, 252, ${star.alpha})`; // Purple glow tint
            ctx.fill();
        });

        requestAnimationFrame(animateStars);
    }

    // Hook listeners
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animateStars();
}

/* ==========================================================================
   3. SCROLL-DIRECTION NAVBAR  (hide ↓ / reveal ↑)
   ========================================================================== */

function initNavbarGlow() {
    const navbar = document.getElementById("navbar");
    const floatingBtn = document.getElementById("floating-menu-btn");
    if (!navbar) return;

    let lastScrollY    = 0;      // previous scroll position
    let isHidden       = false;  // current hide state
    let isAnimating    = false;  // guard against mid-animation triggers
    const HIDE_OFFSET  = 80;     // px from top before hide kicks in

    function hideNavbar() {
        if (isHidden || isAnimating) return;
        isAnimating = true;
        isHidden    = true;

        gsap.to(navbar, {
            yPercent : -100,   // slide exactly 100% of its own height off-screen
            opacity  : 0,
            duration : 0.40,
            ease     : "power3.in",
            onComplete() {
                navbar.style.pointerEvents = "none";
                isAnimating = false;
            }
        });

        if (floatingBtn) floatingBtn.classList.add("visible");
    }

    function showNavbar() {
        if (!isHidden || isAnimating) return;
        isAnimating = true;
        isHidden    = false;
        navbar.style.pointerEvents = "";

        gsap.to(navbar, {
            yPercent : 0,
            opacity  : 1,
            duration : 0.50,
            ease     : "power3.out",
            onComplete() { isAnimating = false; }
        });

        if (floatingBtn) floatingBtn.classList.remove("visible");
    }

    // Passive listener = browser never waits for JS before scrolling (60fps)
    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > HIDE_OFFSET) {
            hideNavbar();
        } else {
            showNavbar();
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
}

/* ==========================================================================
   4. HIGH-FIDELITY MAGNETIC HOVER ENGINE
   ========================================================================== */

function initMagneticHover() {
    // Only apply magnetic mechanics to desktops
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const magneticElements = document.querySelectorAll(".magnetic");

    magneticElements.forEach((el) => {
        el.addEventListener("mousemove", (e) => {
            const rect = el.getBoundingClientRect();
            const strength = parseFloat(el.getAttribute("data-strength")) || 15;

            // Center coords of button
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Offset distance
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            // Pull element
            gsap.to(el, {
                x: (dx / rect.width) * strength,
                y: (dy / rect.height) * strength,
                duration: 0.35,
                ease: "power2.out"
            });

            // Inside text sliding shifts
            const innerText = el.querySelector("span");
            if (innerText) {
                gsap.to(innerText, {
                    x: (dx / rect.width) * (strength * 0.4),
                    y: (dy / rect.height) * (strength * 0.4),
                    duration: 0.35,
                    ease: "power2.out"
                });
            }
        });

        el.addEventListener("mouseleave", () => {
            // Restore back cleanly
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.4)"
            });

            const innerText = el.querySelector("span");
            if (innerText) {
                gsap.to(innerText, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.4)"
                });
            }
        });
    });

    // Sub-Element Project Cards Magnetic Tilt
    const projectCards = document.querySelectorAll(".magnetic-card");
    projectCards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            // Tilt & Shift calculations
            gsap.to(card, {
                rotateY: (dx / rect.width) * 12, // Tilt degrees
                rotateX: -(dy / rect.height) * 12,
                x: (dx / rect.width) * 10,
                y: (dy / rect.height) * 10,
                transformPerspective: 900,
                duration: 0.4,
                ease: "power2.out"
            });
        });

        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                rotateY: 0,
                rotateX: 0,
                x: 0,
                y: 0,
                duration: 0.6,
                ease: "power3.out"
            });
        });
    });
}


/* ==========================================================================
   6. FLUID LIQUID MOBILE MENU OVERLAY
   ========================================================================== */

function initMobileMenuOverlay() {
    const toggleBtn = document.getElementById("menu-toggle");
    const closeBtn = document.getElementById("menu-close-btn");
    const overlay = document.getElementById("menu-overlay");
    const overlayLinks = document.querySelectorAll(".menu-nav-link");

    if (!toggleBtn || !overlay) return;

    let isMenuOpen = false;

    function openMenu() {
        document.body.classList.add("menu-active");
        overlay.classList.add("open");
        isMenuOpen = true;

        // Staggered slide and rotation reveal for navigation links
        gsap.fromTo(overlayLinks,
            { x: -120, rotate: -5, opacity: 0 },
            {
                x: 0,
                rotate: 0,
                opacity: 1,
                stagger: 0.08,
                duration: 0.85,
                ease: "power4.out",
                delay: 0.45
            }
        );

        // Staggered float up for connect footer elements
        gsap.fromTo(".menu-footer",
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.65,
                ease: "power3.out",
                delay: 0.7
            }
        );
    }

    function closeMenu() {
        document.body.classList.remove("menu-active");
        overlay.classList.remove("open");
        isMenuOpen = false;

        // Direct exit transitions
        gsap.to(overlayLinks, {
            x: 80,
            rotate: 4,
            opacity: 0,
            stagger: 0.04,
            duration: 0.45,
            ease: "power3.in"
        });

        gsap.to(".menu-footer", {
            y: 20,
            opacity: 0,
            duration: 0.35,
            ease: "power2.in"
        });
    }

    // Toggle click — navbar button
    toggleBtn.addEventListener("click", () => {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Toggle click — floating button
    const floatingBtn = document.getElementById("floating-menu-btn");
    if (floatingBtn) {
        floatingBtn.addEventListener("click", () => {
            if (isMenuOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    // Close button click trigger
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            closeMenu();
        });
    }

    // Close overlays automatically when a slide link triggers
    overlayLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });
}

/* ==========================================================================
   7. CINEMATIC HERO ENTRANCE TIMELINE
   ========================================================================== */

function prepareHeroSubtitle() {
    // Split hero subtitle into clip-masked word spans
    const subtitle = document.querySelector(".hero-subtitle");
    if (subtitle) {
        const text = subtitle.textContent.trim();
        const words = text.split(/\s+/);
        subtitle.innerHTML = words.map(word => {
            return `<span class="word-wrapper" style="display: inline-block; overflow: hidden; vertical-align: bottom; line-height: 1.3;">` +
                `<span class="hero-sub-word" style="display: inline-block; transform: translate3d(0, 110%, 0); opacity: 0; filter: blur(3px); will-change: transform, opacity, filter;">${word}</span>` +
                `</span>`;
        }).join(" ");
    }

    // Split hero title into clip-masked word spans (same mechanic)
    const title = document.querySelector(".hero-title");
    if (title) {
        const titleText = title.textContent.trim();
        const titleWords = titleText.split(/\s+/);
        title.innerHTML = titleWords.map(word => {
            return `<span class="title-word-wrapper" style="display: inline-block; overflow: hidden; vertical-align: bottom; line-height: 1.1;">` +
                `<span class="hero-title-word" style="display: inline-block; transform: translate3d(0, 110%, 0); opacity: 0; filter: blur(6px); will-change: transform, opacity, filter;">${word}</span>` +
                `</span>`;
        }).join(" ");
    }
}

function initPreloader() {
    const preloader = document.getElementById("preloader");
    const preloaderText = document.getElementById("preloader-text");
    const preloaderBar = document.getElementById("preloader-bar");
    if (!preloader || !preloaderText || !preloaderBar) {
        playEntranceReveal();
        return;
    }

    // 1. Split preloader text into characters
    const text = preloaderText.textContent.trim();
    preloaderText.innerHTML = text.split("").map(char => {
        if (char === " ") return `<span class="preloader-char">&nbsp;</span>`;
        return `<span class="preloader-char">${char}</span>`;
    }).join("");

    const chars = preloaderText.querySelectorAll(".preloader-char");

    // Disable scrolling while loading
    document.body.style.overflow = "hidden";

    // 2. Preloader Animation Timeline
    const tl = gsap.timeline({
        onComplete: () => {
            // Re-enable overflow
            document.body.style.overflow = "";
            // Trigger main page reveal
            playEntranceReveal();
        }
    });

    // Character entrance
    tl.to(chars, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        stagger: 0.04,
        duration: 1.0,
        ease: "expo.out"
    });

    // Progress bar fill
    tl.to(preloaderBar, {
        width: "100%",
        duration: 2.0,
        ease: "power2.inOut"
    }, "-=0.6");

    // Fade in subtitle
    tl.to("#preloader-subtitle", {
        opacity: 0.85,
        duration: 1.0,
        ease: "power2.out"
    }, "-=1.4");

    // Glow scale sweep on text
    tl.to(chars, {
        textShadow: "0 0 25px rgba(168, 85, 247, 0.8), 0 0 45px rgba(168, 85, 247, 0.4)",
        color: "var(--color-accent-glow)",
        duration: 0.6,
        ease: "power2.out"
    }, "-=0.6");

    // Preloader exit transition
    tl.to(preloader, {
        y: "-100%",
        duration: 1.0,
        ease: "power4.inOut"
    }, "+=0.2");

    // Also fade/scale out content slightly before exiting
    tl.to([preloaderText, "#preloader-subtitle"], {
        y: -40,
        opacity: 0,
        duration: 0.6,
        ease: "power3.in"
    }, "-=1.0");
}

function playEntranceReveal() {
    // Prep elements
    gsap.set(".reveal-element", { opacity: 0, y: 30 });
    gsap.set(".navbar", { y: -80, opacity: 0 });

    const timeline = gsap.timeline();

    // 1. Reveal Navbar
    timeline.to(".navbar", {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power4.out"
    });

    // 2. Word-by-word slide-up reveal for hero title "Nexus Studio"
    timeline.to(".hero-title-word", {
        y: "0%",
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.18,
        duration: 1.1,
        ease: "expo.out"
    }, "-=0.7");

    // 3. Stagger reveal sub headers & buttons
    timeline.to(".reveal-element", {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 1.1,
        ease: "power3.out"
    }, "-=0.9");

    // 4. Word-by-word reveal for the hero subtitle
    timeline.to(".hero-sub-word", {
        y: "0%",
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.02,
        duration: 0.85,
        ease: "power3.out"
    }, "-=0.75");

    // 5. Subtle reveal of scroll indicator
    timeline.from(".hero-scroll-indicator", {
        opacity: 0,
        y: -10,
        duration: 0.8,
        ease: "power2.out"
    }, "-=0.4");
}

/* ==========================================================================
   8. SCROLL-DRIVEN TRANSITIONS (FADE-IN-UP & CLIP-PATH REVEAL)
   ========================================================================== */

function initScrollDrivenTransitions() {
    // Standard Fade-In-Up section triggers
    const revealItems = document.querySelectorAll(".scroll-reveal");

    revealItems.forEach((item) => {
        gsap.fromTo(item,
            { opacity: 0, y: 55 },
            {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    });
}

/* ==========================================================================
   9. INTERACTIVE ABOUT IMAGE ANIMATIONS (3D TILT, DEEP PARALLAX & SCROLL)
   ========================================================================== */

function initAboutImageAnimation() {
    const card = document.getElementById("about-image-card");
    const glow = document.getElementById("about-image-glow");
    const ring = document.getElementById("about-image-ring");
    const ringInner = document.getElementById("about-image-ring-inner");

    if (!card) return;

    // Interactive magnetic tilt hover mechanics
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        const percentX = dx / (rect.width / 2);
        const percentY = dy / (rect.height / 2);

        // 3D Perspective Card Tilt
        gsap.to(card, {
            rotateY: percentX * 15,
            rotateX: -percentY * 15,
            x: percentX * 10,
            y: percentY * 10,
            transformPerspective: 800,
            duration: 0.35,
            ease: "power2.out"
        });

        // Background elements displacement for deep parallax visual feedback
        if (glow) {
            gsap.to(glow, {
                x: percentX * 4,
                y: percentY * 4,
                duration: 0.4,
                ease: "power2.out"
            });
        }
        if (ring) {
            gsap.to(ring, {
                x: -percentX * 8,
                y: -percentY * 8,
                duration: 0.4,
                ease: "power2.out"
            });
        }
        if (ringInner) {
            gsap.to(ringInner, {
                x: percentX * 6,
                y: percentY * 6,
                duration: 0.4,
                ease: "power2.out"
            });
        }
    });

    card.addEventListener("mouseleave", () => {
        // Reset card alignment
        gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            x: 0,
            y: 0,
            duration: 0.75,
            ease: "power3.out"
        });

        // Reset glow and rings
        if (glow) {
            gsap.to(glow, {
                x: 0,
                y: 0,
                duration: 0.75,
                ease: "power3.out"
            });
        }
        if (ring) {
            gsap.to(ring, {
                x: 0,
                y: 0,
                duration: 0.75,
                ease: "power3.out"
            });
        }
        if (ringInner) {
            gsap.to(ringInner, {
                x: 0,
                y: 0,
                duration: 0.75,
                ease: "power3.out"
            });
        }
    });

    // Entrance Scale-Up and Rotate Trigger
    gsap.fromTo(card.parentNode,
        {
            opacity: 0,
            scale: 0.85,
            rotate: -6
        },
        {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 1.5,
            ease: "expo.out",
            scrollTrigger: {
                trigger: card.parentNode,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        }
    );
}

/* ==========================================================================
   10. TECHNICAL SKILLS ENTRANCE ANIMATION (SCROLLTRIGGER-DRIVEN PROGRESS BARS)
   ========================================================================== */

function initSkillsAnimation() {
    const skillBars = document.querySelectorAll(".skill-bar-fill");

    skillBars.forEach((bar) => {
        const targetWidth = bar.style.width || "0%";

        // Temporarily reset to 0% so GSAP can animate the fill from 0
        bar.style.width = "0%";

        gsap.to(bar, {
            width: targetWidth,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: bar,
                start: "top 92%",
                toggleActions: "play none none none"
            }
        });
    });
}

/* ==========================================================================
   11. INTERACTIVE 3D HERO ICON (THREE.JS GYROSCOPE SYSTEM)
   ========================================================================== */

function initHero3DIcon() {
    const container = document.getElementById("hero-3d-container");
    if (!container) return;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 6.2;

    // 3. Lighting Setup (Neon Cyberpunk Theme)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.5, 15);
    purpleLight.position.set(3, 3, 3);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 15);
    cyanLight.position.set(-3, -3, 3);
    scene.add(cyanLight);

    // 4. Gyroscopic 3D Geometry Creation
    const group = new THREE.Group();
    scene.add(group);

    // Core: Glowing Solid Octahedron
    const coreGeo = new THREE.OctahedronGeometry(0.8, 0);
    const coreMat = new THREE.MeshPhongMaterial({
        color: 0x9333ea,
        emissive: 0x581c87,
        emissiveIntensity: 0.8,
        shininess: 120,
        flatShading: true,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Core Edge Highlight (Outlines the octahedron edges in bright purple/white)
    const coreWireMat = new THREE.MeshBasicMaterial({
        color: 0xe9d5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.85
    });
    const coreWireMesh = new THREE.Mesh(coreGeo, coreWireMat);
    group.add(coreWireMesh);

    // Shell 1: Wireframe Icosahedron (Sphere shell)
    const shellGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const shellMat = new THREE.MeshBasicMaterial({
        color: 0xb794f4,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    group.add(shellMesh);

    // Orbital Node: Glowing dot + camera-facing target circle
    const nodeGroup = new THREE.Group();

    const dotGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xe9d5ff });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    nodeGroup.add(dotMesh);

    const targetCircleGeo = new THREE.RingGeometry(0.12, 0.14, 32);
    const targetCircleMat = new THREE.MeshBasicMaterial({ color: 0xb794f4, side: THREE.DoubleSide });
    const targetCircleMesh = new THREE.Mesh(targetCircleGeo, targetCircleMat);
    nodeGroup.add(targetCircleMesh);

    group.add(nodeGroup); // Add to the main group so it moves with drag

    // Shell 2: Ring 1 (Vertical purple solid torus ring)
    const ring1Geo = new THREE.TorusGeometry(2.2, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.25,
        metalness: 0.8
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.y = Math.PI / 6;
    ring1.rotation.x = Math.PI / 2.3;
    group.add(ring1);

    // Shell 3: Ring 2 (Horizontal teal solid torus ring)
    const ring2Geo = new THREE.TorusGeometry(2.0, 0.04, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
        color: 0x0d9488,
        roughness: 0.25,
        metalness: 0.8
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 1.85;
    ring2.rotation.y = Math.PI / 15;
    group.add(ring2);

    // 5. Interaction variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let mousePosition = { x: 0, y: 0 };

    // Mouse Tracking for Parallax follow
    window.addEventListener("mousemove", (e) => {
        if (isDragging) return;
        // Normalize mouse positions between -1 and 1
        mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Drag to Rotate logic
    container.addEventListener("mousedown", (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    container.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        targetRotation.y += deltaMove.x * 0.007;
        targetRotation.x += deltaMove.y * 0.007;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Mobile touch support
    container.addEventListener("touchstart", (e) => {
        isDragging = true;
        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    });

    window.addEventListener("touchend", () => {
        isDragging = false;
    });

    container.addEventListener("touchmove", (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        targetRotation.y += deltaMove.x * 0.007;
        targetRotation.x += deltaMove.y * 0.007;

        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    });

    // 6. Animation Render Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        // Standard Auto-Rotation (different axis and direction for core and shells)
        coreMesh.rotation.y += 0.012;
        coreMesh.rotation.x -= 0.006;

        coreWireMesh.rotation.copy(coreMesh.rotation);

        shellMesh.rotation.y -= 0.004;
        shellMesh.rotation.z += 0.003;

        ring1.rotation.z += 0.005;
        ring2.rotation.z -= 0.005;

        // Orbiting node calculation (orbiting on the 1.6 radius wireframe sphere)
        const radius = 1.6;
        const orbitAngle = time * 0.45;
        nodeGroup.position.set(
            Math.cos(orbitAngle) * radius * 0.85,
            Math.sin(orbitAngle * 1.3) * radius * 0.65,
            Math.sin(orbitAngle) * radius * 0.85
        );
        // Force the circular orbit target to look at camera (flat to screen)
        nodeGroup.lookAt(camera.position);

        // Weightless Levitating/Floating Effect (sine wave)
        group.position.y = Math.sin(time * 1.3) * 0.15;

        // Apply drag rotation or parallax follow
        if (isDragging) {
            group.rotation.y += (targetRotation.y - group.rotation.y) * 0.15;
            group.rotation.x += (targetRotation.x - group.rotation.x) * 0.15;
        } else {
            // Smoothly follow mouse pointer
            const targetX = mousePosition.y * 0.45;
            const targetY = mousePosition.x * 0.45;
            group.rotation.x += (targetX - group.rotation.x) * 0.05;
            group.rotation.y += (targetY - group.rotation.y) * 0.05;
        }

        // Render scene
        renderer.render(scene, camera);
    }

    animate();

    // 7. Responsive Resizing Setup
    function handleResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    window.addEventListener("resize", handleResize);
}

/* ==========================================================================
   12. SERVICES PINNED VERTICAL REVEAL
   ========================================================================== */

function initServicesHorizontalScroll() {
    const section   = document.querySelector(".services-section");
    const pinWrap   = document.querySelector(".services-pin-wrap");
    const rows      = gsap.utils.toArray(".svc-row");

    if (!section || !pinWrap || rows.length === 0) return;

    /* ----------------------------------------------------------
       Each row starts fully hidden (clipped up + transparent).
       They are revealed one-by-one as the user scrolls while
       the section is pinned. Scrolling back reverses the process.
    ---------------------------------------------------------- */

    // Set initial hidden state for all rows
    gsap.set(rows, {
        opacity: 0,
        y: 40,
        clipPath: "inset(0 0 100% 0)"   // clipped from the bottom
    });

    // The total extra scroll distance = (number of rows) * scrollPerRow px
    const scrollPerRow = 220;   // px of scroll travel to reveal each row
    const totalExtra   = rows.length * scrollPerRow;

    /*
      We pin the section for (totalExtra) extra pixels of scroll,
      then within that scroll range we scrub the rows in sequence.
    */
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${totalExtra}`,
            pin: true,
            scrub: 0.8,           // smooth scrub for reversibility
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });

    // Add each row to the timeline sequentially
    rows.forEach((row, i) => {
        const pct = i / rows.length;     // normalised start position [0 … 1)

        tl.to(row, {
            opacity: 1,
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            duration: 0.18,        // fraction of the total timeline
            ease: "power2.out"
        }, pct);
    });
}



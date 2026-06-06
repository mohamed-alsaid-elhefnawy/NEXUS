/* ==========================================================================
   NEXUS MOTION ENGINE - SCRIPTS & INTERACTIVITY
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ── Force home screen on every refresh ──────────────────────────────────
    // Disable browser's automatic scroll restoration so it never jumps back
    // to a previous scroll position or anchor hash on page load.
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }
    // Immediately snap to the very top before anything renders
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Strip any hash from the URL so the page always starts at home
    if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // ────────────────────────────────────────────────────────────────────────

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
    initEditorialProjects();
    initFooterAnimation();

    // Hide main elements immediately to prevent flash of content during loading
    gsap.set(".navbar", { y: -100, opacity: 0 });

    // Core Timelines
    prepareHeroSubtitle();
    initPreloader();
    initFullPageAnimations();
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

    let lastScrollY = 0;      // previous scroll position
    let isHidden = false;  // current hide state
    let isAnimating = false;  // guard against mid-animation triggers
    const HIDE_OFFSET = 80;     // px from top before hide kicks in

    function hideNavbar() {
        if (isHidden || isAnimating) return;
        isAnimating = true;
        isHidden = true;

        gsap.to(navbar, {
            yPercent: -100,   // slide exactly 100% of its own height off-screen
            opacity: 0,
            duration: 0.40,
            ease: "power3.in",
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
        isHidden = false;
        navbar.style.pointerEvents = "";

        gsap.to(navbar, {
            yPercent: 0,
            opacity: 1,
            duration: 0.50,
            ease: "power3.out",
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
                `<span class="hero-sub-word" style="display: inline-block; opacity: 0; will-change: transform, opacity, filter;">${word}</span>` +
                `</span>`;
        }).join(" ");
    }

    // Split hero title into clip-masked word spans with 3D perspective
    const title = document.querySelector(".hero-title");
    if (title) {
        const titleText = title.textContent.trim();
        const titleWords = titleText.split(/\s+/);
        title.innerHTML = titleWords.map(word => {
            return `<span class="title-word-wrapper" style="display: inline-block; overflow: hidden; vertical-align: bottom; line-height: 1.1; perspective: 800px;">` +
                `<span class="hero-title-word" style="display: inline-block; opacity: 0; will-change: transform, opacity, filter; transform-origin: 50% 100%;">${word}</span>` +
                `</span>`;
        }).join(" ");
    }
}

function initPreloader() {
    const preloader = document.getElementById("preloader");
    const introName = document.getElementById("intro-name");
    const introAuthor = document.getElementById("intro-author");
    const loaderBar = document.getElementById("intro-loader-bar");
    if (!preloader || !introName) {
        playEntranceReveal();
        return;
    }

    const text = introName.textContent.trim();
    introName.innerHTML = text.split("").map(char => {
        if (char === " ") return `<span class="intro-char char-space">&nbsp;</span>`;
        return `<span class="intro-char">${char}</span>`;
    }).join("");

    const chars = introName.querySelectorAll(".intro-char:not(.char-space)");

    document.body.style.overflow = "hidden";

    gsap.set(chars, { opacity: 0, y: 28, filter: "blur(18px)" });
    if (introAuthor) gsap.set(introAuthor, { opacity: 0, y: 12, letterSpacing: "0.1em" });
    if (loaderBar) gsap.set(loaderBar, { width: "0%" });

    const tl = gsap.timeline({
        onComplete: () => {
            document.body.style.overflow = "";
            preloader.style.display = "none";
        }
    });

    tl.to(chars, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.055,
        duration: 0.75,
        ease: "power4.out"
    }, 0.25);

    if (introAuthor) {
        tl.to(introAuthor, {
            opacity: 1,
            y: 0,
            letterSpacing: "0.22em",
            duration: 0.9,
            ease: "power3.out"
        }, 0.85);
    }

    if (loaderBar) {
        tl.to(loaderBar, {
            width: "100%",
            duration: 1.6,
            ease: "power2.inOut"
        }, 0.4);
    }

    tl.to([chars, introAuthor].filter(Boolean), {
        opacity: 0,
        y: -16,
        filter: "blur(10px)",
        stagger: 0.02,
        duration: 0.55,
        ease: "power3.in"
    }, 2.4);

    tl.to(preloader, {
        opacity: 0,
        duration: 0.65,
        ease: "power3.inOut"
    }, 2.4);

    tl.call(playEntranceReveal, null, 2.4);
}

function playEntranceReveal() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // ── Phase 0: Lock all initial states ────────────────────────────────────
    gsap.set(".navbar", { y: -100, opacity: 0 });
    gsap.set(".hero-backdrop-glow", { opacity: 0, scale: 0.65 });
    gsap.set(".hero-badge", { opacity: 0, scale: 0.55, y: -16, filter: "blur(8px)" });
    gsap.set(".hero-title-word", { yPercent: 115, opacity: 0, rotateX: -80, filter: "blur(12px)" });
    gsap.set(".hero-divider", { scaleX: 0, opacity: 0, transformOrigin: "left center" });
    gsap.set(".hero-sub-word", { yPercent: 120, opacity: 0, filter: "blur(4px)" });
    gsap.set(".hero-ctas", { opacity: 0, y: 55, filter: "blur(8px)" });
    gsap.set(".hero-visual", { opacity: 0, x: isMobile ? 0 : 90, scale: 0.85, filter: "blur(14px)" });
    gsap.set(".hero-3d-container", { scale: 0.72, opacity: 0 });
    gsap.set(".hero-scroll-indicator", { opacity: 0, y: 24 });

    const tl = gsap.timeline();

    // ── Phase 1: Atmospheric glow blooms in (0s) ────────────────────────────
    tl.to(".hero-backdrop-glow", {
        opacity: 1, scale: 1.2,
        duration: 2.8, ease: "power2.out"
    }, 0);

    // ── Phase 2: Navbar descends cleanly (0.1s) ─────────────────────────────
    tl.to(".navbar", {
        y: 0, opacity: 1,
        duration: 1.05, ease: "power3.out"
    }, 0.1);

    // ── Phase 3: Badge drops in as eyebrow label (0.45s) ────────────────────
    tl.to(".hero-badge", {
        opacity: 1, scale: 1, y: 0, filter: "blur(0px)",
        duration: 0.72, ease: "back.out(2.5)"
    }, 0.45);

    // ── Phase 4: Title words 3D-flip up from below (0.7s) ───────────────────
    tl.to(".hero-title-word", {
        yPercent: 0, opacity: 1, rotateX: 0, filter: "blur(0px)",
        stagger: { amount: 0.3, ease: "power2.inOut" },
        duration: 1.15, ease: "power4.out",
        transformOrigin: "50% 100%"
    }, 0.7);

    // ── Phase 5: Divider line draws left → right under the title (1.35s) ────
    tl.to(".hero-divider", {
        scaleX: 1, opacity: 1,
        duration: 0.85, ease: "power3.inOut"
    }, 1.35);

    // ── Phase 6: Subtitle words cascade up (1.5s) ───────────────────────────
    tl.to(".hero-sub-word", {
        yPercent: 0, opacity: 1, filter: "blur(0px)",
        stagger: { amount: 0.55, ease: "power1.inOut" },
        duration: 0.9, ease: "power3.out"
    }, 1.5);

    // ── Phase 7: CTA buttons emerge with a soft spring (2.0s) ───────────────
    tl.to(".hero-ctas", {
        opacity: 1, y: 0, filter: "blur(0px)",
        duration: 1.05, ease: "back.out(1.5)"
    }, 2.0);

    // ── Phase 8: 3D visual sweeps in from the right (0.75s) ─────────────────
    tl.to(".hero-visual", {
        opacity: 1, x: 0, scale: 1, filter: "blur(0px)",
        duration: 1.5, ease: "power3.out"
    }, 0.75);

    // The inner 3D canvas zooms and materialises slightly delayed
    tl.to(".hero-3d-container", {
        scale: 1,
        opacity: 1,
        duration: 1.9,
        ease: "power4.out"
    }, 0.9);

    // ── Phase 9: Scroll indicator pulses in last (2.5s) ─────────────────────
    tl.to(".hero-scroll-indicator", {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power2.out"
    }, 2.5);
}

/* ==========================================================================
   8. FULL-PAGE SECTION ANIMATION ENGINE
   ========================================================================== */

function initFullPageAnimations() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    injectSectionDecorations();
    initHeroScrollAnimation();
    initMarqueeSectionAnimation();
    initAboutSectionAnimation();
    initServicesLabelAnimation();
    initSkillsPillsAnimation();
    initContactSectionAnimation();
    initFooterMetaAnimation();
    initSectionParallax();
    initEnhancedScrollReveals();
}

function injectSectionDecorations() {
    const sections = document.querySelectorAll(".page-section");

    sections.forEach((section, index) => {
        if (index === 0) return;

        const line = document.createElement("div");
        line.className = "section-anim-line";
        line.setAttribute("aria-hidden", "true");
        section.prepend(line);

        const glow = document.createElement("div");
        glow.className = `section-anim-glow section-anim-glow--${index % 2 === 0 ? "right" : "left"}`;
        glow.setAttribute("aria-hidden", "true");
        section.prepend(glow);

        gsap.fromTo(line,
            { scaleX: 0, opacity: 0 },
            {
                scaleX: 1,
                opacity: 1,
                duration: 1.4,
                ease: "power3.inOut",
                scrollTrigger: {
                    trigger: section,
                    start: "top 92%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        gsap.fromTo(glow,
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                duration: 1.6,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
}

function splitWordsForAnimation(element, wordClass) {
    if (!element) return [];
    const text = element.textContent.trim();
    const words = text.split(/\s+/);
    element.innerHTML = words.map((word) => {
        return `<span class="anim-word-wrap">` +
            `<span class="${wordClass}">${word}</span>` +
            `</span>`;
    }).join(" ");
    return element.querySelectorAll(`.${wordClass}`);
}

function initHeroScrollAnimation() {
    const hero = document.querySelector(".hero-section");
    if (!hero) return;

    gsap.to(".hero-content", {
        y: -80,
        opacity: 0.4,
        scale: 0.96,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1.2
        }
    });

    gsap.to(".hero-visual", {
        y: -100,
        scale: 0.92,
        opacity: 0.7,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1.2
        }
    });

    gsap.to(".hero-backdrop-glow", {
        scale: 1.45,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1.2
        }
    });

    gsap.to(".hero-scroll-indicator", {
        opacity: 0,
        y: 20,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "40% top",
            scrub: 0.8
        }
    });
}

function initMarqueeSectionAnimation() {
    const marquee = document.querySelector(".marquee-section");
    if (!marquee) return;

    gsap.fromTo(marquee,
        { opacity: 0, y: 50, filter: "blur(10px)" },
        {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: marquee,
                start: "top 90%",
                toggleActions: "play none none reverse"
            }
        }
    );

    gsap.fromTo(".marquee-content",
        { scale: 0.96 },
        {
            scale: 1,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
                trigger: marquee,
                start: "top 88%",
                toggleActions: "play none none reverse"
            }
        }
    );
}

function initAboutSectionAnimation() {
    const about = document.querySelector(".about-section");
    const tagline = document.querySelector(".about-tagline");
    if (!about || !tagline) return;

    const words = splitWordsForAnimation(tagline, "anim-word");
    gsap.set(words, { y: "110%", opacity: 0, filter: "blur(8px)" });

    gsap.to(words, {
        y: "0%",
        opacity: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "power4.out",
        stagger: 0.04,
        scrollTrigger: {
            trigger: ".about-info",
            start: "top 82%",
            toggleActions: "play none none reverse"
        }
    });

    gsap.fromTo(".about-info",
        { opacity: 0, y: 40 },
        {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".about-info",
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        }
    );
}

function initServicesLabelAnimation() {
    const label = document.querySelector(".services-label-row .section-tag");
    if (!label) return;

    gsap.fromTo(label,
        { opacity: 0, x: -40, filter: "blur(6px)" },
        {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: {
                trigger: ".services-section",
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        }
    );
}

function initSkillsPillsAnimation() {
    const pills = document.querySelectorAll(".skill-icon-pill");
    const heading = document.querySelector(".skills-group-heading");
    if (!pills.length) return;

    gsap.set(pills, { opacity: 0, y: 50, scale: 0.6, rotate: -12 });

    if (heading) {
        gsap.fromTo(heading,
            { opacity: 0, x: -30 },
            {
                opacity: 1,
                x: 0,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".skills-group",
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    gsap.to(pills, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.85,
        ease: "back.out(1.6)",
        stagger: 0.1,
        scrollTrigger: {
            trigger: ".skills-icon-row",
            start: "top 88%",
            toggleActions: "play none none reverse"
        }
    });
}

function initContactSectionAnimation() {
    const headline = document.querySelector(".contact-headline");
    const subtitle = document.querySelector(".contact-subtitle");
    const formGroups = document.querySelectorAll(".contact-form .input-group");
    const submitBtn = document.querySelector(".btn-submit");

    if (headline) {
        const words = splitWordsForAnimation(headline, "anim-word");
        gsap.set(words, { y: "110%", opacity: 0, filter: "blur(6px)" });
        gsap.to(words, {
            y: "0%",
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.035,
            scrollTrigger: {
                trigger: ".contact-info",
                start: "top 82%",
                toggleActions: "play none none reverse"
            }
        });
    }

    if (subtitle) {
        gsap.fromTo(subtitle,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                delay: 0.2,
                scrollTrigger: {
                    trigger: ".contact-info",
                    start: "top 82%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    if (formGroups.length) {
        gsap.fromTo(formGroups,
            { opacity: 0, x: 50, filter: "blur(5px)" },
            {
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: ".contact-form-wrapper",
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    if (submitBtn) {
        gsap.fromTo(submitBtn,
            { opacity: 0, y: 24, scale: 0.95 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "back.out(1.4)",
                delay: 0.35,
                scrollTrigger: {
                    trigger: ".contact-form-wrapper",
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }
}

function initFooterMetaAnimation() {
    const metaItems = document.querySelectorAll(".footer-meta-item");
    if (!metaItems.length) return;

    gsap.fromTo(metaItems,
        { opacity: 0, x: -24, scale: 0.96 },
        {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
                trigger: ".footer-meta",
                start: "top 92%",
                toggleActions: "play none none reverse"
            }
        }
    );
}

function initSectionParallax() {
    const containers = document.querySelectorAll(
        ".about-section .section-container, .skills-section .section-container, .contact-section .section-container"
    );

    containers.forEach((container) => {
        gsap.to(container, {
            y: -30,
            ease: "none",
            scrollTrigger: {
                trigger: container,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5
            }
        });
    });

    document.querySelectorAll(".section-anim-glow").forEach((glow, i) => {
        gsap.to(glow, {
            y: i % 2 === 0 ? -60 : 60,
            x: i % 2 === 0 ? 30 : -30,
            ease: "none",
            scrollTrigger: {
                trigger: glow.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.8
            }
        });
    });
}

function initEnhancedScrollReveals() {
    const revealItems = document.querySelectorAll(".scroll-reveal:not(.ep-header)");

    revealItems.forEach((item) => {
        const isSectionTag = item.classList.contains("section-header") ||
            item.querySelector(".section-tag");

        gsap.fromTo(item,
            isSectionTag
                ? { opacity: 0, x: -50, filter: "blur(6px)" }
                : { opacity: 0, y: 60, filter: "blur(8px)" },
            {
                opacity: 1,
                x: 0,
                y: 0,
                filter: "blur(0px)",
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    document.querySelectorAll(".section-tag").forEach((tag) => {
        if (tag.closest(".scroll-reveal")) return;

        gsap.fromTo(tag,
            { opacity: 0, x: -40, filter: "blur(4px)" },
            {
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                duration: 1,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: tag,
                    start: "top 88%",
                    toggleActions: "play none none reverse"
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
    const section = document.querySelector(".services-section");
    const pinWrap = document.querySelector(".services-pin-wrap");
    const rows = gsap.utils.toArray(".svc-row");

    if (!section || !pinWrap || rows.length === 0) return;

    // Set initial hidden states for entry slide-up animation
    rows.forEach(row => {
        const rowInner = row.querySelector(".svc-row-inner");
        const divider = row.querySelector(".svc-divider");
        gsap.set(rowInner, {
            opacity: 0,
            y: 100
        });
        if (divider) {
            gsap.set(divider, {
                scaleX: 0,
                transformOrigin: "left center"
            });
        }
    });

    // Batch scroll-triggered slide-up reveal with stagger
    ScrollTrigger.batch(rows, {
        start: "top 85%", // Triggers when the top of each row reaches 85% viewport height
        onEnter: (batch) => {
            batch.forEach((row, i) => {
                const rowInner = row.querySelector(".svc-row-inner");
                const divider = row.querySelector(".svc-divider");

                gsap.to(rowInner, {
                    opacity: 1,
                    y: 0,
                    duration: 1.0,
                    delay: i * 0.15, // 0.15s stagger delay between items entering together
                    ease: "power4.out"
                });

                if (divider) {
                    gsap.to(divider, {
                        scaleX: 1,
                        duration: 0.8,
                        delay: i * 0.15,
                        ease: "power2.out"
                    });
                }
            });
        },
        once: true
    });

    // Subtle scroll parallax effect on each row using smooth scrub
    const parallaxOffsets = [-30, -15, 0, 15, 30]; // px offsets for rows 0 to 4
    rows.forEach((row, i) => {
        const offset = parallaxOffsets[i] !== undefined ? parallaxOffsets[i] : 0;
        gsap.to(row, {
            y: offset,
            ease: "none",
            scrollTrigger: {
                trigger: row,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2
            }
        });
    });
}

/* ==========================================================================
   13. FOOTER — SCROLL REVEAL & INTERACTIONS
   ========================================================================== */

function initFooterAnimation() {
    const footer = document.getElementById("footer");
    if (!footer) return;

    const backTop = document.getElementById("footer-back-top");
    const splitLines = footer.querySelectorAll("[data-footer-split]");
    const animItems = footer.querySelectorAll(".footer-anim");
    const links = footer.querySelectorAll(".footer-link, .footer-social-icon");
    const lineFill = document.getElementById("footer-line-fill");

    if (backTop) {
        backTop.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    splitLines.forEach((line) => {
        const text = line.textContent.trim();
        line.innerHTML = text.split("").map((char) => {
            if (char === " ") return `<span class="footer-char">&nbsp;</span>`;
            return `<span class="footer-char">${char}</span>`;
        }).join("");
    });

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
        gsap.set(animItems, { opacity: 1, y: 0 });
        gsap.set(".footer-char", { opacity: 1, y: 0 });
        if (lineFill) gsap.set(lineFill, { width: "100%" });
        return;
    }

    gsap.fromTo(animItems,
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
                trigger: footer,
                start: "top 88%",
                toggleActions: "play none none reverse"
            }
        }
    );

    const chars = footer.querySelectorAll(".footer-char");
    if (chars.length) {
        gsap.fromTo(chars,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power3.out",
                stagger: 0.02,
                scrollTrigger: {
                    trigger: ".footer-cta",
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    if (lineFill) {
        gsap.fromTo(lineFill,
            { width: "0%" },
            {
                width: "100%",
                duration: 1.2,
                ease: "power2.inOut",
                scrollTrigger: {
                    trigger: ".footer-line",
                    start: "top 90%",
                    toggleActions: "play none none none"
                }
            }
        );
    }

    if (links.length) {
        gsap.fromTo(links,
            { opacity: 0, x: 16 },
            {
                opacity: 1,
                x: 0,
                duration: 0.5,
                ease: "power3.out",
                stagger: 0.05,
                scrollTrigger: {
                    trigger: ".footer-columns",
                    start: "top 88%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }
}

/* ==========================================================================
   14. EDITORIAL PROJECTS — APPLE SPLIT-SCREEN ENGINE
   ========================================================================== */

function initEditorialProjects() {
    const projects = document.querySelectorAll(".ep-project");
    if (!projects.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    projects.forEach((proj, index) => {
        const visual = proj.querySelector(".ep-project-visual");
        const inner = proj.querySelector(".ep-project-inner");
        if (!visual || !inner) return;

        const contentItems = inner.querySelectorAll(
            ".ep-category, .ep-title, .ep-description, .ep-meta-row, .ep-actions"
        );

        if (prefersReduced) return;

        const scrollStart = isMobile ? "top 88%" : "top 78%";

        /* Live preview — slide in (lighter on mobile) */
        gsap.fromTo(visual,
            isMobile
                ? { opacity: 0, y: 36, scale: 0.97 }
                : { opacity: 0, x: -80, scale: 0.92, rotateY: 10 },
            {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotateY: 0,
                duration: isMobile ? 0.85 : 1.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: proj,
                    start: scrollStart,
                    toggleActions: "play none none reverse"
                }
            }
        );

        /* Project copy — stagger in */
        gsap.fromTo(contentItems,
            isMobile
                ? { opacity: 0, y: 28 }
                : { opacity: 0, y: 40, filter: "blur(6px)" },
            {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: isMobile ? 0.8 : 0.95,
                ease: "power3.out",
                stagger: isMobile ? 0.06 : 0.08,
                delay: 0.1,
                scrollTrigger: {
                    trigger: proj,
                    start: scrollStart,
                    toggleActions: "play none none reverse"
                }
            }
        );

        /* Parallax — desktop only */
        if (!isMobile) {
            gsap.to(visual, {
                y: index % 2 === 0 ? -35 : -20,
                ease: "none",
                scrollTrigger: {
                    trigger: proj,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.6
                }
            });

            gsap.to(inner, {
                y: 20,
                ease: "none",
                scrollTrigger: {
                    trigger: proj,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.6
                }
            });
        }
    });

    /* Section header entrance */
    const headerItems = document.querySelectorAll(
        ".ep-header .section-tag, .ep-header .ep-section-title, .ep-header .ep-section-sub"
    );
    if (headerItems.length && !prefersReduced) {
        gsap.fromTo(headerItems,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: "power4.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: ".ep-header",
                    start: "top 82%",
                    toggleActions: "play none none none"
                }
            }
        );
    }
}

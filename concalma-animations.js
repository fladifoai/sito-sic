/* ============================================================
   CONCALMA ISLAND — Animation Engine
   Script vanilla JS (zero dipendenze) per gestire:
   - Scroll Reveal con IntersectionObserver
   - Stagger automatico
   - Parallax morbido
   - Counter animato (per stats)
   - Tilt 3D al hover
   - Split text (parola per parola)
   - Smooth scroll
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG — Modifica questi valori per regolare il comportamento
     ---------------------------------------------------------- */
  const CONFIG = {
    // Scroll Reveal
    revealThreshold: 0.15,       // 15% dell'elemento visibile per triggerare
    revealRootMargin: '0px 0px -60px 0px',  // trigger leggermente prima del bordo
    revealOnce: true,            // true = anima solo la prima volta

    // Parallax
    parallaxSpeeds: {
      slow: 0.03,
      medium: 0.06,
      fast: 0.1
    },

    // Counter
    counterDuration: 2000,       // durata in ms dell'animazione contatore
    counterEasing: 'easeOutExpo',

    // Tilt
    tiltMaxDeg: 6,               // rotazione massima in gradi
    tiltPerspective: 1000,       // prospettiva CSS

    // Split text
    splitStagger: 50             // ms tra ogni parola
  };


  /* ----------------------------------------------------------
     1. SCROLL REVEAL — IntersectionObserver
     Aggiunge .cc-visible quando l'elemento entra nel viewport
     ---------------------------------------------------------- */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.cc-reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('cc-visible');
          if (CONFIG.revealOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!CONFIG.revealOnce) {
          entry.target.classList.remove('cc-visible');
        }
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin
    });

    reveals.forEach(el => observer.observe(el));
  }


  /* ----------------------------------------------------------
     2. PARALLAX — Effetto profondità allo scroll
     Usa data-cc-speed="slow|medium|fast" o un valore numerico
     ---------------------------------------------------------- */
  function initParallax() {
    const parallaxEls = document.querySelectorAll('.cc-parallax');
    if (!parallaxEls.length) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;

      parallaxEls.forEach(el => {
        const speedAttr = el.dataset.ccSpeed || 'medium';
        const speed = CONFIG.parallaxSpeeds[speedAttr] || parseFloat(speedAttr) || CONFIG.parallaxSpeeds.medium;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const viewCenter = window.innerHeight / 2;
        const offset = (center - viewCenter) * speed;

        el.style.transform = `translateY(${offset}px)`;
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load
    updateParallax();
  }


  /* ----------------------------------------------------------
     3. COUNTER — Numeri che contano (per stats e countdown)
     Usa data-cc-target="valore" per il numero finale
     ---------------------------------------------------------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.ccTarget, 10) || 0;
    const start = parseInt(el.dataset.ccStart, 10) || 0;
    const suffix = el.dataset.ccSuffix || '';
    const prefix = el.dataset.ccPrefix || '';
    const duration = parseInt(el.dataset.ccDuration, 10) || CONFIG.counterDuration;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.round(start + (target - start) * easedProgress);

      el.textContent = prefix + current.toLocaleString('it-IT') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = document.querySelectorAll('.cc-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }


  /* ----------------------------------------------------------
     4. TILT 3D — Effetto hover con rotazione prospettica
     Aggiungere .cc-hover-tilt all'elemento
     ---------------------------------------------------------- */
  function initTilt() {
    const tiltEls = document.querySelectorAll('.cc-hover-tilt');
    if (!tiltEls.length) return;

    tiltEls.forEach(el => {
      el.style.perspective = CONFIG.tiltPerspective + 'px';
      const inner = el.firstElementChild || el;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -CONFIG.tiltMaxDeg;
        const rotateY = ((x - centerX) / centerX) * CONFIG.tiltMaxDeg;

        inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      el.addEventListener('mouseleave', () => {
        inner.style.transform = 'rotateX(0) rotateY(0)';
        inner.style.transition = `transform 0.5s cubic-bezier(.4,0,.2,1)`;
        setTimeout(() => { inner.style.transition = ''; }, 500);
      });
    });
  }


  /* ----------------------------------------------------------
     5. SPLIT TEXT — Anima parola per parola
     Aggiungere .cc-split all'elemento contenitore
     ---------------------------------------------------------- */
  function initSplitText() {
    const splitEls = document.querySelectorAll('.cc-split');
    if (!splitEls.length) return;

    splitEls.forEach(el => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/);
      el.innerHTML = '';
      el.setAttribute('aria-label', text);

      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'cc-split-word';
        span.textContent = word;
        span.style.transitionDelay = (i * CONFIG.splitStagger) + 'ms';
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);

        // Aggiunge spazio tra le parole
        if (i < words.length - 1) {
          el.appendChild(document.createTextNode('\u00A0'));
        }
      });

      // Aggiunge cc-reveal per triggerare con lo scroll
      el.classList.add('cc-reveal');
    });
  }


  /* ----------------------------------------------------------
     6. MAGNETIC BUTTON — Bottoni che seguono il cursore
     Aggiungere .cc-magnetic all'elemento
     ---------------------------------------------------------- */
  function initMagnetic() {
    const magneticEls = document.querySelectorAll('.cc-magnetic');
    if (!magneticEls.length) return;

    magneticEls.forEach(el => {
      const strength = parseFloat(el.dataset.ccStrength) || 0.3;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = `transform 0.4s cubic-bezier(.4,0,.2,1)`;
        setTimeout(() => { el.style.transition = ''; }, 400);
      });
    });
  }


  /* ----------------------------------------------------------
     7. PROGRESS BAR — Barre di avanzamento animate
     Usa data-cc-progress="75" per la percentuale
     ---------------------------------------------------------- */
  function initProgressBars() {
    const bars = document.querySelectorAll('.cc-progress');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const fill = bar.querySelector('.cc-progress__fill') || bar;
          const target = parseInt(bar.dataset.ccProgress, 10) || 0;

          requestAnimationFrame(() => {
            fill.style.width = target + '%';
          });

          observer.unobserve(bar);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(el => observer.observe(el));
  }


  /* ----------------------------------------------------------
     8. SCROLL PROGRESS — Barra di progresso in cima alla pagina
     Aggiungere .cc-scroll-progress al body o come primo elemento
     ---------------------------------------------------------- */
  function initScrollProgress() {
    const progressBar = document.querySelector('.cc-scroll-progress');
    if (!progressBar) return;

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      progressBar.style.width = progress + '%';
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }


  /* ----------------------------------------------------------
     9. NAVBAR SCROLL — Navbar che cambia stile allo scroll
     ---------------------------------------------------------- */
  function initNavbarScroll() {
    const navbar = document.querySelector('.cc-navbar-scroll');
    if (!navbar) return;

    const threshold = parseInt(navbar.dataset.ccScrollThreshold, 10) || 80;
    let ticking = false;

    function update() {
      if (window.scrollY > threshold) {
        navbar.classList.add('cc-scrolled');
      } else {
        navbar.classList.remove('cc-scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }


  /* ----------------------------------------------------------
     INIT — Avvia tutto quando il DOM è pronto
     ---------------------------------------------------------- */
  function init() {
    // Controlla prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Mostra tutto senza animazioni
      document.querySelectorAll('.cc-reveal').forEach(el => {
        el.classList.add('cc-visible');
      });
      return;
    }

    initSplitText();       // Prima di scroll reveal (aggiunge cc-reveal)
    initScrollReveal();
    initParallax();
    initCounters();
    initTilt();
    initMagnetic();
    initProgressBars();
    initScrollProgress();
    initNavbarScroll();
  }

  // Avvia
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /* ----------------------------------------------------------
     API PUBBLICA — Per uso programmatico
     window.ConcalmaAnimations.reveal(element)
     ---------------------------------------------------------- */
  window.ConcalmaAnimations = {
    init,
    reveal: (el) => {
      el.classList.add('cc-reveal', 'cc-fade-up');
      initScrollReveal();
    },
    counter: animateCounter,
    config: CONFIG
  };

})();

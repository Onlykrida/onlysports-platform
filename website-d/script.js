/* ============================================
   ONLYKRIDA — STREET CULTURE JS (MIND-BLOWN)
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // 1. CUSTOM CURSOR (follows mouse smoothly)
  // ============================================
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  let mouseX = 0,
    mouseY = 0;
  let ringX = 0,
    ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';

    // Update CSS vars for glow effects
    document.documentElement.style.setProperty('--cursor-x', mouseX + 'px');
    document.documentElement.style.setProperty('--cursor-y', mouseY + 'px');
  });

  // Smooth trailing ring
  function animateCursorRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateCursorRing);
  }
  animateCursorRing();

  // Cursor hover states
  const hoverTargets = document.querySelectorAll(
    'a, button, [data-magnetic], .sticker, .feature-card, .polaroid, .role',
  );
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorDot.classList.add('hovering');
      cursorRing.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorDot.classList.remove('hovering');
      cursorRing.classList.remove('hovering');
    });
  });

  // ============================================
  // 2. MAGNETIC ELEMENTS (attract to cursor)
  // ============================================
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      setTimeout(() => {
        el.style.transition = '';
      }, 500);
    });
  });

  // ============================================
  // 3. SCROLL PROGRESS BAR
  // ============================================
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    scrollProgress.style.width = progress + '%';
  }

  // ============================================
  // 4. SPLIT TEXT ANIMATION
  // ============================================
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.innerHTML = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.classList.add('char');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = i * 0.05 + 's';
      el.appendChild(span);
    });
  });

  // CTA split-text (triggered on scroll)
  const ctaLine1 = document.querySelector('.cta__line1[data-split]');
  if (ctaLine1) {
    const text = ctaLine1.textContent;
    ctaLine1.innerHTML = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.classList.add('char');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.transitionDelay = i * 0.03 + 's';
      ctaLine1.appendChild(span);
    });
  }

  // ============================================
  // 5. TEXT SCRAMBLE EFFECT
  // ============================================
  const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const original = el.textContent;

    el.addEventListener('mouseenter', () => {
      let iteration = 0;
      const interval = setInterval(() => {
        el.textContent = original
          .split('')
          .map((char, i) => {
            if (i < iteration) return original[i];
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join('');
        iteration += 1 / 2;
        if (iteration >= original.length) clearInterval(interval);
      }, 30);
    });
  });

  // ============================================
  // 6. SMOOTH SCROLL
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 80,
          behavior: 'smooth',
        });
      }
    });
  });

  // ============================================
  // 7. SCROLL REVEAL (re-triggers on every scroll in/out)
  // ============================================
  const revealTargets = document.querySelectorAll('.problem__inner, .number-block, .cta__inner');
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // ============================================
  // 8. DATA-ANIMATE ELEMENTS (re-triggers)
  // ============================================
  const animEls = document.querySelectorAll('[data-animate]');
  const animObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => entry.target.classList.add('is-visible'), +delay);
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  );

  animEls.forEach((el) => animObserver.observe(el));

  // ============================================
  // 9. SECTION ZOOM-IN REVEAL (re-triggers)
  // ============================================
  const zoomEls = document.querySelectorAll(
    '.problem, .features, .roles, .culture, .app-preview, .velocity, .beep-splash',
  );
  const zoomObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        } else {
          entry.target.classList.remove('section-visible');
        }
      });
    },
    { threshold: 0.05 },
  );
  zoomEls.forEach((el) => zoomObs.observe(el));

  // CTA split text trigger (re-triggers)
  if (ctaLine1) {
    const ctaSplitObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ctaLine1.classList.add('split-visible');
          } else {
            ctaLine1.classList.remove('split-visible');
          }
        });
      },
      { threshold: 0.3 },
    );
    ctaSplitObs.observe(ctaLine1);
  }

  // ============================================
  // 10. COUNTER ANIMATIONS (re-triggers every time)
  // ============================================
  function animateCounter(el, target) {
    const duration = 2000;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = target >= 100 ? current.toLocaleString() : current;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target >= 100 ? target.toLocaleString() : target;
      }
    }
    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('[data-count-up]');
  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.countUp, 10);
          animateCounter(entry.target, target);
        } else {
          // Reset to 0 when scrolled out so it re-animates on return
          entry.target.textContent = '0';
        }
      });
    },
    { threshold: 0.3 },
  );
  counterEls.forEach((el) => counterObs.observe(el));

  // ============================================
  // 11. CTA FORM
  // ============================================
  const ctaForm = document.getElementById('ctaForm');
  const ctaConfirmation = document.getElementById('ctaConfirmation');

  // Supabase config for waitlist
  const SUPABASE_URL = 'https://dcixlerneuuyhsftnifm.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaXhsZXJuZXV1eWhzZnRuaWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDc4NTIsImV4cCI6MjA3MTI4Mzg1Mn0.VN7zdfRWHIhTSWQ0HMEhuBKZ49J7Ks4PHtOB140Yn-c';

  if (ctaForm) {
    ctaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = ctaForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      if (email) {
        // Save to Supabase waitlist table
        try {
          await fetch(SUPABASE_URL + '/rest/v1/waitlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ email }),
          });
        } catch (err) {
          console.log('Waitlist save (non-blocking):', err);
        }
      }

      ctaForm.style.display = 'none';
      ctaConfirmation.classList.add('show');
    });
  }

  // ============================================
  // 12. SCROLL-DRIVEN EFFECTS (RAF-based)
  // ============================================
  const nav = document.getElementById('nav');
  const heroZoom = document.getElementById('heroZoom');
  const heroBgText = document.querySelector('.hero__bg-text');
  const sportLayers = document.querySelectorAll('.sport-bg__layer');

  let lastY = 0;
  let ticking = false;
  let scrollY = 0;

  window.addEventListener(
    'scroll',
    () => {
      scrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true },
  );

  function onScroll() {
    ticking = false;
    const vh = window.innerHeight;

    updateScrollProgress();

    // Nav hide/show
    if (nav) {
      nav.classList.toggle('nav--scrolled', scrollY > 80);
      if (scrollY > 500) {
        nav.classList.toggle('nav--hidden', scrollY > lastY + 5);
        if (scrollY < lastY - 5) nav.classList.remove('nav--hidden');
      } else {
        nav.classList.remove('nav--hidden');
      }
    }
    lastY = scrollY;

    // Hero zoom (1 → 1.35x) + fade
    if (heroZoom && scrollY < vh * 1.5) {
      const progress = scrollY / vh;
      const scale = 1 + progress * 0.35;
      const opacity = Math.max(0, 1 - progress * 0.8);
      heroZoom.style.transform = `scale(${scale})`;
      heroZoom.style.opacity = opacity;
    }

    // Parallax on hero bg text
    if (heroBgText && scrollY < vh) {
      heroBgText.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.2}px))`;
    }

    // Sport background layers: scroll modulation
    if (sportLayers.length >= 3) {
      const f = scrollY * 0.02;
      sportLayers[0].style.transform = `translateX(${-scrollY * 0.03}px) translateY(${Math.sin(f) * 20}px)`;
      sportLayers[1].style.transform = `translateX(${scrollY * 0.025}px) translateY(${Math.cos(f) * 15}px)`;
      sportLayers[2].style.transform = `translateX(${-scrollY * 0.04}px) translateY(${Math.sin(f * 1.5) * 25}px)`;

      const breathe = 0.03 + Math.sin(f * 0.5) * 0.02;
      sportLayers.forEach((layer) => {
        layer.style.opacity = breathe;
      });
    }

    // Parallax silhouettes
    const silhouettes = document.querySelectorAll('.silhouette');
    if (silhouettes.length && scrollY < vh * 1.2) {
      const speeds = [0.08, -0.06, 0.05, -0.07];
      silhouettes.forEach((s, i) => {
        s.style.transform = `translateY(${scrollY * (speeds[i] || 0.05)}px)`;
      });
    }

    // Marquee speed modulation on scroll velocity
    const velocity = Math.abs(scrollY - lastY);
    document.querySelectorAll('.marquee-track').forEach((track) => {
      const baseSpeed = track.classList.contains('marquee-track--fast') ? 15 : 30;
      const speedMod = Math.max(5, baseSpeed - velocity * 0.5);
      track.style.animationDuration = speedMod + 's';
    });
  }

  // ============================================
  // 13. 3D TILT EFFECT ON CARDS
  // ============================================
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) scale(1.02)`;

      // Move inner glow
      const glow = card.querySelector('.feature-card__glow, .role__glow');
      if (glow) {
        glow.style.left = (x + 0.5) * 100 + '%';
        glow.style.top = (y + 0.5) * 100 + '%';
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      setTimeout(() => {
        card.style.transition = '';
      }, 600);
    });
  });

  // ============================================
  // 14. HORIZONTAL DRAG SCROLL (features)
  // ============================================
  const track = document.getElementById('featuresTrack');
  if (track) {
    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('dragging');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('dragging');
    });
    track.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('dragging');
    });
    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 2;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  // ============================================
  // 15. PHONE NOTIFICATION SLIDE-IN (re-triggers)
  // ============================================
  const phoneCards = document.querySelectorAll('.app-preview__phone-card--slide');
  const phoneSection = document.querySelector('.app-preview__phone');
  if (phoneSection) {
    const phoneSlideObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            phoneCards.forEach((card, i) => {
              setTimeout(() => card.classList.add('slid-in'), 800 + i * 300);
            });
          } else {
            phoneCards.forEach((card) => card.classList.remove('slid-in'));
          }
        });
      },
      { threshold: 0.3 },
    );
    phoneSlideObs.observe(phoneSection);
  }

  // ============================================
  // 16. HERO PARTICLES (canvas)
  // ============================================
  const canvas = document.getElementById('heroParticles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 50;

    function resizeCanvas() {
      const hero = document.querySelector('.hero');
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.3 + 0.05;
        const colors = ['48,209,88', '255,159,10', '100,210,255', '255,69,58'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // React to mouse (subtle repel)
        const heroRect = canvas.getBoundingClientRect();
        const mx = mouseX - heroRect.left;
        const my = mouseY - heroRect.top;
        const dx = this.x - mx;
        const dy = this.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(48, 209, 88, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawLines();
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ============================================
  // 17. MOUSE GLOW ON HERO
  // ============================================
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      hero.style.background = `radial-gradient(circle 500px at ${x}px ${y}px, rgba(48,209,88,0.04), transparent 70%)`;
    });
    hero.addEventListener('mouseleave', () => {
      hero.style.background = 'none';
    });
  }

  // ============================================
  // 18. VELOCITY TEXT SCRAMBLE ON SCROLL (re-triggers)
  // ============================================
  const velocitySection = document.querySelector('.velocity');
  if (velocitySection) {
    const velObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
          } else {
            entry.target.classList.remove('section-visible');
          }
        });
      },
      { threshold: 0.3 },
    );
    velObs.observe(velocitySection);
  }

  // ============================================
  // 19. BEEP TEST LEVEL COUNTER (re-triggers)
  // ============================================
  const beepCounter = document.getElementById('beepLevelCounter');
  if (beepCounter) {
    const beepSection = document.querySelector('.beep-splash');
    let beepRunning = false;
    const beepObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !beepRunning) {
            beepRunning = true;
            beepCounter.textContent = '1';
            let level = 1;
            const maxLevel = 13;
            const tick = () => {
              beepCounter.textContent = level;
              beepCounter.style.transform = 'scale(1.3)';
              setTimeout(() => {
                beepCounter.style.transform = 'scale(1)';
              }, 150);
              level++;
              if (level <= maxLevel) {
                setTimeout(tick, 250 + level * 30);
              } else {
                beepRunning = false;
              }
            };
            setTimeout(tick, 800);
          } else if (!entry.isIntersecting) {
            // Reset when scrolled away so it replays
            beepCounter.textContent = '1';
            beepRunning = false;
          }
        });
      },
      { threshold: 0.3 },
    );
    if (beepSection) beepObs.observe(beepSection);
  }

  // ============================================
  // 20. STICKER HOVER EFFECTS
  // ============================================
  document.querySelectorAll('.sticker').forEach((sticker) => {
    sticker.addEventListener('mouseenter', () => {
      sticker.style.transition =
        'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s';
    });
    sticker.addEventListener('mouseleave', () => {
      sticker.style.transition =
        'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s';
    });
  });
})();

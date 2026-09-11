/*
 * Mobile navigation for all website-d pages.
 *
 * Every page hid its nav links below 768px (`.nav-center`/`.nav-links
 * { display: none }`) without providing any replacement, so phone visitors had
 * no way to reach Features, Fitness Testing, About or Contact — index.html also
 * hid the EARLY ACCESS button. This injects a hamburger and full-screen panel
 * built from whatever links the page already has, so the markup stays the
 * single source of truth and the two never drift apart.
 *
 * Self-contained: no dependency on GSAP, Lenis, or page-specific scripts.
 */
(function () {
  'use strict';

  function init() {
    var nav = document.querySelector('nav.nav') || document.querySelector('nav');
    // The toggle now lives on <body>, so check there — checking inside nav
    // would let init() run twice and stack two hamburgers.
    if (!nav || document.querySelector('.mnav-toggle')) return;

    // Collect links from whichever nav structure this page uses. index.html has
    // .nav-center, the content pages have .nav-links, and privacy/terms use a
    // bare inline <div> — fall back to every link in the nav except the logo.
    var source = nav.querySelector('.nav-links') || nav.querySelector('.nav-center');
    var anchors;
    if (source) {
      anchors = source.querySelectorAll('a');
    } else {
      anchors = [].slice.call(nav.querySelectorAll('a')).filter(function (a) {
        return !/logo/i.test(a.className || '');
      });
    }
    var links = [];
    [].forEach.call(anchors, function (a) {
      var text = a.textContent.trim();
      if (!text) return;
      links.push({ href: a.getAttribute('href'), text: text, active: a.classList.contains('active') });
    });
    // index.html keeps EARLY ACCESS in .nav-right and hides it on mobile too.
    var cta = nav.querySelector('.nav-right .nav-btn');
    if (!links.length && !cta) return;

    var toggle = document.createElement('button');
    toggle.className = 'mnav-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    var panel = document.createElement('div');
    panel.className = 'mnav-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Site menu');

    var list = document.createElement('nav');
    list.className = 'mnav-list';
    links.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.text;
      if (l.active) a.className = 'active';
      list.appendChild(a);
    });
    panel.appendChild(list);

    var ctaHref = cta ? cta.getAttribute('href') : 'index.html#sceneCta';
    var ctaText = cta ? cta.textContent.trim() : 'EARLY ACCESS';
    var ctaEl = document.createElement('a');
    ctaEl.className = 'mnav-cta';
    ctaEl.href = ctaHref;
    ctaEl.textContent = ctaText;
    panel.appendChild(ctaEl);

    // Append the toggle to <body>, not into nav. nav.nav sits at z-index 9000
    // and creates a stacking context, so a child can never paint above the
    // panel at 10000 — the close button vanished once the menu opened and the
    // user was trapped. Verified with elementFromPoint before and after.
    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    var open = false;
    function setOpen(next) {
      open = next;
      toggle.classList.toggle('is-open', open);
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      // Lock the page behind the panel without losing scroll position.
      document.documentElement.style.overflow = open ? 'hidden' : '';
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!open);
    });

    // Same-page anchors must close the panel; cross-page links navigate anyway.
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    // Leaving mobile width with the panel open would strand the scroll lock.
    window.addEventListener('resize', function () {
      if (open && window.innerWidth > 768) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ===== KnowHow Shared Script ===== */

// ===== PAYSTACK CONFIG =====
const PAYSTACK_KEY = 'pk_test_9c5a2052e795fb4da811786934420184a4f7b255';
let currentLesson = { title: '', category: '', price: 0, priceCedis: 0 };
let _lastFocusedElement = null;

// ===== PAYMENT MODAL =====
function openPayment(title, category, priceCedis) {
  currentLesson = { title, category, priceCedis, price: priceCedis * 100 };
  document.getElementById('payLessonTitle').textContent = title;
  document.getElementById('payLessonCat').textContent = category;
  document.getElementById('payAmount').textContent = '\u20b5' + priceCedis;
  document.getElementById('payForm').style.display = 'block';
  document.getElementById('paySuccess').style.display = 'none';
  clearFieldErrors();
  const overlay = document.getElementById('payOverlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  _lastFocusedElement = document.activeElement;
  // Focus first input
  setTimeout(() => document.getElementById('payName').focus(), 100);
}

function closePayment() {
  document.getElementById('payOverlay').classList.remove('active');
  document.body.style.overflow = '';
  if (_lastFocusedElement) _lastFocusedElement.focus();
}

function clearFieldErrors() {
  document.querySelectorAll('.pay-field input').forEach(inp => {
    inp.classList.remove('error');
  });
}

function validatePaymentForm() {
  const name = document.getElementById('payName');
  const email = document.getElementById('payEmail');
  let valid = true;
  clearFieldErrors();

  if (!name.value.trim()) {
    name.classList.add('error');
    valid = false;
  }
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.classList.add('error');
    valid = false;
  }
  return valid;
}

function processPayment() {
  if (!validatePaymentForm()) return;

  const name = document.getElementById('payName').value.trim();
  const email = document.getElementById('payEmail').value.trim();
  const btn = document.getElementById('payBtn');

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: email,
      amount: currentLesson.price,
      currency: 'GHS',
      ref: 'KNW-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
      metadata: {
        custom_fields: [
          { display_name: 'Name', variable_name: 'name', value: name },
          { display_name: 'Lesson', variable_name: 'lesson', value: currentLesson.title },
          { display_name: 'Category', variable_name: 'category', value: currentLesson.category }
        ]
      },
      callback: function(response) {
        btn.classList.remove('loading');
        btn.disabled = false;
        document.getElementById('payForm').style.display = 'none';
        document.getElementById('paySuccess').style.display = 'block';
        document.getElementById('payRef').textContent = response.reference;
        // Unlock content
        unlockContent();
        // Track purchase
        trackPurchase(currentLesson.title, response.reference);
      },
      onClose: function() {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
    handler.openIframe();
  } catch(e) {
    console.error('Paystack error:', e);
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ===== ACCESSIBILITY: ESC key + focus trap =====
document.addEventListener('keydown', function(e) {
  const overlay = document.getElementById('payOverlay');
  if (!overlay || !overlay.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closePayment();
    return;
  }

  // Focus trap
  if (e.key === 'Tab') {
    const focusable = overlay.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Click outside to close
document.addEventListener('click', function(e) {
  const overlay = document.getElementById('payOverlay');
  if (overlay && e.target === overlay) closePayment();
});

// ===== CODE COPY BOXES =====
function initCopyBoxes() {
  document.querySelectorAll('.code-block pre').forEach(pre => {
    if (pre.parentElement.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', function() {
      const code = pre.querySelector('code') || pre;
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = code.textContent;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
    pre.parentElement.insertBefore(btn, pre);
  });
}

// ===== PAYWALL UNLOCK =====
function unlockContent() {
  document.querySelectorAll('.paywall-blur').forEach(el => {
    el.style.filter = 'none';
    el.style.pointerEvents = 'auto';
    el.style.userSelect = 'auto';
    el.style.maxHeight = 'none';
    el.classList.remove('paywall-blur');
  });
  document.querySelectorAll('.paywall-box').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.paywall-overlay').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.lesson-content').forEach(el => el.classList.add('unlocked'));
  // Store unlock
  try { sessionStorage.setItem('knowhow_' + location.pathname, '1'); } catch(e) {}
}

function checkUnlock() {
  try {
    if (sessionStorage.getItem('knowhow_' + location.pathname)) {
      unlockContent();
    }
  } catch(e) {}
}

// ===== LESSON PROGRESS TRACKING =====
function trackPurchase(lessonTitle, ref) {
  try {
    const purchases = JSON.parse(localStorage.getItem('knowhow_purchases') || '{}');
    purchases[lessonTitle] = { ref, date: new Date().toISOString() };
    localStorage.setItem('knowhow_purchases', JSON.stringify(purchases));
  } catch(e) {}
}

function markLessonComplete(lessonId) {
  try {
    const completed = JSON.parse(localStorage.getItem('knowhow_completed') || '[]');
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem('knowhow_completed', JSON.stringify(completed));
    }
    updateProgressUI();
  } catch(e) {}
}

function isLessonCompleted(lessonId) {
  try {
    const completed = JSON.parse(localStorage.getItem('knowhow_completed') || '[]');
    return completed.includes(lessonId);
  } catch(e) { return false; }
}

function updateProgressUI() {
  const badge = document.getElementById('progressBadge');
  if (badge) {
    const lessonId = document.body.getAttribute('data-lesson-id');
    if (lessonId && isLessonCompleted(lessonId)) {
      badge.innerHTML = '<span class="checkmark">\u2713</span> Completed';
      badge.style.display = 'inline-flex';
    }
  }
}

// ===== AUTO-GENERATE TABLE OF CONTENTS =====
function generateToC() {
  const content = document.querySelector('.lesson-content');
  const tocContainer = document.getElementById('lessonToC');
  if (!content || !tocContainer) return;

  const headings = content.querySelectorAll('h2, h3');
  if (headings.length < 2) {
    tocContainer.style.display = 'none';
    return;
  }

  const ol = document.createElement('ol');
  headings.forEach((h, i) => {
    if (!h.id) h.id = 'section-' + i;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    if (h.tagName === 'H3') a.style.paddingLeft = '16px';
    li.appendChild(a);
    ol.appendChild(li);
  });

  const existingOl = tocContainer.querySelector('ol');
  if (existingOl) existingOl.remove();
  tocContainer.appendChild(ol);
}

// ===== SEARCH FUNCTIONALITY =====
function initSearch() {
  const searchInput = document.getElementById('lessonSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.lesson-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const match = !query || text.includes(query);
      card.style.display = match ? '' : 'none';
    });
    // Show/hide "no results" message
    let noResults = document.getElementById('noResults');
    const visibleCards = document.querySelectorAll('.lesson-card:not([style*="display: none"])').length;
    if (visibleCards === 0 && query) {
      if (!noResults) {
        noResults = document.createElement('p');
        noResults.id = 'noResults';
        noResults.style.cssText = 'text-align:center;color:var(--text-dim);padding:40px 0;grid-column:1/-1;';
        noResults.textContent = 'No lessons found matching your search.';
        document.querySelector('.lessons-grid').appendChild(noResults);
      }
      noResults.style.display = '';
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  });
}

// ===== NAVBAR SCROLL =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  const scrollProgress = document.getElementById('scrollProgress');

  if (navbar) {
    window.addEventListener('scroll', () => {
      const s = window.scrollY;
      const d = document.body.scrollHeight - window.innerHeight;
      if (scrollProgress) scrollProgress.style.width = (s / d) * 100 + '%';
      navbar.classList.toggle('scrolled', s > 60);
    }, { passive: true });
  }

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
  }
}

// ===== SCROLL REVEAL =====
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => observer.observe(el));
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== HERO CARD PARALLAX =====
function initHeroParallax() {
  const heroCard = document.getElementById('heroCard');
  if (!heroCard) return;
  document.addEventListener('mousemove', e => {
    const r = heroCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    heroCard.style.transform = `perspective(1000px) rotateX(${y*-6}deg) rotateY(${x*6}deg)`;
  });
  heroCard.addEventListener('mouseleave', () => {
    heroCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
}

// ===== TYPING EFFECT =====
function initTyping() {
  const hl1 = document.querySelector('.hero-text h1 .line-1');
  const hl2 = document.querySelector('.hero-text h1 .line-2');
  if (!hl1 || !hl2) return;
  const t1 = hl1.textContent, t2 = hl2.textContent;
  hl1.textContent = ''; hl2.textContent = '';
  let ci = 0;
  function tn() {
    if (ci < t1.length) { hl1.textContent += t1[ci++]; setTimeout(tn, 35); }
    else if (ci < t1.length + t2.length) { hl2.textContent += t2[ci++ - t1.length]; setTimeout(tn, 35); }
    else {
      const hero = document.querySelector('.hero-text');
      if (hero) {
        for (let i = 0; i < 12; i++) {
          const s = document.createElement('div');
          s.className = 'typing-spark';
          const a = (i/12) * Math.PI * 2;
          s.style.setProperty('--tx', Math.cos(a)*(60+Math.random()*80)+'px');
          s.style.setProperty('--ty', Math.sin(a)*(60+Math.random()*80)+'px');
          s.style.animationDelay = (i*0.04)+'s';
          hero.appendChild(s);
          setTimeout(() => s.remove(), 1500);
        }
      }
    }
  }
  setTimeout(tn, 500);
}

// ===== NAV ACTIVE TRACKING =====
function initNavTracking() {
  const secs = [];
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(l => {
    const id = l.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) secs.push({ id, el, link: l });
  });
  if (!secs.length) return;
  const obs = new IntersectionObserver(entries => {
    let mx = 0, aid = null;
    entries.forEach(e => { if (e.intersectionRatio > mx) { mx = e.intersectionRatio; aid = e.target.id; } });
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    if (aid) { const al = document.querySelector(`.nav-links a[href="#${aid}"]`); if (al) al.classList.add('active'); }
  }, { threshold: [0, 0.15, 0.3, 0.45, 0.6] });
  secs.forEach(s => obs.observe(s.el));
}

// ===== TESTIMONIALS CAROUSEL =====
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const dots = document.getElementById('testimonialDots');
  if (!track || !dots) return;
  const cards = track.querySelectorAll('.testimonial-card');
  let cs = 0, ap;
  for (let i = 0; i < cards.length; i++) {
    const d = document.createElement('button');
    d.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Go to testimonial ${i+1}`);
    d.addEventListener('click', () => gis(i));
    dots.appendChild(d);
  }
  function gis(i) {
    cs = i;
    track.style.transform = `translateX(-${i*100}%)`;
    dots.querySelectorAll('.testimonial-dot').forEach((d,j) => d.classList.toggle('active', j===i));
    ra();
  }
  function ra() { clearInterval(ap); ap = setInterval(() => gis((cs+1)%cards.length), 5000); }
  const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) ra(); else clearInterval(ap); }, { threshold: 0.2 });
  obs.observe(document.querySelector('.testimonials-section'));
}

// ===== STATS COUNTER =====
function initStatsCounter() {
  const hs = document.querySelectorAll('.hero-stat-num');
  const sv = ['200+', '50+', '12K'];
  if (!hs.length) return;
  let sa = false;
  const obs = new IntersectionObserver(e => {
    if (e[0].isIntersecting && !sa) {
      sa = true;
      hs.forEach((el, i) => {
        const t = sv[i], np = parseInt(t), sfx = t.replace(np, ''), dur = 1500, st = performance.now();
        function ac(n) {
          const p = Math.min((n-st)/dur, 1), e2 = 1-Math.pow(1-p,3);
          el.textContent = Math.floor(e2*np)+sfx;
          if (p < 1) requestAnimationFrame(ac); else el.textContent = t;
        }
        requestAnimationFrame(ac);
      });
    }
  }, { threshold: 0.5 });
  obs.observe(hs[0].closest('.hero-stats'));
}

// ===== STEP NUMBER ANIMATION =====
function initStepAnimation() {
  const grid = document.querySelector('.steps-grid');
  if (!grid) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.step-number').forEach((n,i) => setTimeout(() => n.classList.add('animated'), i*200));
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  obs.observe(grid);
}

// ===== INIT ALL =====
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initReveal();
  initBackToTop();
  initHeroParallax();
  initTyping();
  initNavTracking();
  initTestimonials();
  initStatsCounter();
  initStepAnimation();
  initCopyBoxes();
  initSearch();
  generateToC();
  checkUnlock();
  updateProgressUI();
});

/* Main interactive portfolio script */
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const progressBar = document.getElementById('progressBar');
const navLinks = document.querySelectorAll('.nav-link');
const pageName = body.dataset.page || 'home';

const setActiveNav = () => {
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });
};

// Dark-only theme helpers: enforce dark styles and hide toggle
const setTheme = () => {
  // Ensure light class is removed if present
  body.classList.remove('theme-light');
  if (themeToggle) themeToggle.style.display = 'none';
  try { localStorage.removeItem('portfolio-theme'); } catch (e) { /* ignore */ }
};

const initTheme = () => {
  setTheme();
};

const toggleTheme = () => {
  /* no-op: theme toggle disabled for dark-only site */
};

const updateProgress = () => {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
};

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

const initReveal = () => {
  revealElements.forEach((el) => revealObserver.observe(el));
};

const animateCounters = () => {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;
  const options = { threshold: 0.5 };
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = parseFloat(counter.dataset.target) || 0;
      const duration = 1800;
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        counter.textContent = target === 3.67 ? (3.67 * progress).toFixed(2) : Math.ceil(target * progress);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          counter.textContent = target;
          observer.unobserve(counter);
        }
      };
      window.requestAnimationFrame(step);
    });
  }, options);
  counters.forEach((counter) => counterObserver.observe(counter));
};

const initContactForm = () => {
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactStatus');
  if (!contactForm || !contactStatus) return;
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();
    if (!name || !email || !message) {
      contactStatus.textContent = 'Please complete all fields before sending.';
      contactStatus.style.color = '#f87171';
      return;
    }
    contactStatus.style.color = '#22d3ee';
    contactStatus.textContent = 'Message ready. Connect this form to a backend service to send it live.';
    contactForm.reset();
  });
};

const init = () => {
  initTheme();
  setActiveNav();
  initReveal();
  animateCounters();
  initContactForm();
  updateProgress();
  window.addEventListener('scroll', updateProgress);
  // theme toggle is hidden and disabled for dark-only design
  // social link click feedback (toasts)
  document.querySelectorAll('.social-link').forEach((a) => {
    a.addEventListener('click', () => {
      try {
        if (a.href.includes('linkedin.com')) showToast('Opening LinkedIn...');
        else if (a.href.includes('github.com')) showToast('Opening GitHub...');
        else if (a.hasAttribute('download')) showToast('Downloading resume...');
        else showToast('Opening link...');
      } catch (e) { /* silent */ }
    });
  });
  // Intro audio: best-effort autoplay without any visible UI.
  // Note: modern browsers often block unmuted autoplay. This attempts multiple plays
  // on load, focus, visibilitychange and user interaction, but may still be blocked.
  const introAudio = document.getElementById('introAudio');
  if (introAudio) {
    const speechBubble = document.querySelector('.speech-bubble');
    const setSpeaking = (isSpeaking) => {
      speechBubble?.classList.toggle('speaking', isSpeaking);
    };

    introAudio.addEventListener('play', () => setSpeaking(true));
    introAudio.addEventListener('pause', () => setSpeaking(false));
    introAudio.addEventListener('ended', () => setSpeaking(false));
    introAudio.addEventListener('error', () => setSpeaking(false));

    let attempts = 0;
    const maxAttempts = 6;
    const attemptPlay = () => {
      attempts += 1;
      const p = introAudio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          introAudio.removeAttribute('muted');
        }).catch(() => {
          // failed to autoplay — will retry on interaction/visibility
        });
      }
    };

    attemptPlay();

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        if (attempts < maxAttempts) attemptPlay();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    const onGesture = () => {
      if (attempts < maxAttempts) attemptPlay();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('touchstart', onGesture, { once: true });

    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    }, 30000);
  }
};

window.addEventListener('DOMContentLoaded', init);

/* Toast helper */
function showToast(message) {
  const existing = document.querySelector('.site-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'site-toast';
  t.textContent = message;
  document.body.appendChild(t);
  // force CSS animation
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 350);
  }, 2200);
}

// Avatar image fallback: hide broken img and show SVG if loading fails
document.addEventListener('DOMContentLoaded', () => {
  const avatar = document.getElementById('avatarImg');
  if (!avatar) return;
  avatar.addEventListener('error', () => {
    avatar.classList.add('hidden');
  });
  // If image loads successfully, hide svg fallback
  avatar.addEventListener('load', () => {
    const svg = document.querySelector('.avatar-fallback');
    if (svg) svg.style.display = 'none';
  });
});

// Show bottom social bar only when footer or contact panel is visible (or near page bottom)
document.addEventListener('DOMContentLoaded', () => {
  const socialBar = document.querySelector('.corner-social');
  if (!socialBar) return;

  const showBar = () => socialBar.classList.add('visible');
  const hideBar = () => socialBar.classList.remove('visible');

  // Observe footer and contact panel
  const targets = [];
  const footer = document.querySelector('.site-footer');
  if (footer) targets.push(footer);
  const contactPanel = document.querySelector('.contact-panel');
  if (contactPanel) targets.push(contactPanel);

  if (targets.length) {
    const obs = new IntersectionObserver((entries) => {
      const anyVisible = entries.some(e => e.isIntersecting);
      if (anyVisible) showBar(); else hideBar();
    }, { threshold: 0.15 });
    targets.forEach(t => obs.observe(t));
  }

  // fallback: also show when user scrolls near bottom
  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const remaining = docHeight - scrollTop;
    if (remaining < 220) showBar();
    else {
      // only hide if none of the observed targets are in view
      const anyInView = targets.some(t => t.getBoundingClientRect().top < window.innerHeight && t.getBoundingClientRect().bottom > 0);
      if (!anyInView) hideBar();
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // initial check
  onScroll();
});

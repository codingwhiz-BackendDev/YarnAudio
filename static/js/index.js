// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
  });

  // Close menu when clicking on a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      mobileMenuBtn.classList.remove('active');
    });
  });
}

// Hero Audio Player
const playBtn = document.getElementById('playBtn');
const waveform = document.getElementById('waveform');
let isPlaying = false;

if (playBtn) {
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      waveform.style.opacity = '1';
      animateProgress();
    } else {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      waveform.style.opacity = '0.5';
    }
  });
}

let currentProgress = 38;

function animateProgress() {
  if (isPlaying && currentProgress < 100) {
    currentProgress += 0.15;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = currentProgress + '%';
    }
    setTimeout(animateProgress, 100);
  }
}

// Progress bar click to seek
const progressBar = document.getElementById('progressBar');

if (progressBar) {
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    currentProgress = Math.max(0, Math.min(100, percent));
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = currentProgress + '%';
    }
  });
}

// Voice selector
const voiceSelect = document.getElementById('voiceSelect');

if (voiceSelect) {
  voiceSelect.addEventListener('change', (e) => {
    console.log('[v0] Voice changed to:', e.target.value);
  });
}

// Speed control buttons
const speedButtons = document.querySelectorAll('.speed-btn');

speedButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    speedButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    console.log('[v0] Speed changed to:', e.target.getAttribute('data-speed') + 'x');
  });
});

// FAQ Toggle with smooth animations
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach((question, index) => {
  question.addEventListener('click', () => {
    const answerId = question.getAttribute('data-faq');
    const answer = document.getElementById(`faq-${answerId}`);
    
    if (!answer) return;
    
    // Close all other answers
    faqQuestions.forEach((q, i) => {
      if (i !== index) {
        q.classList.remove('active');
        const otherAnswer = document.getElementById(`faq-${q.getAttribute('data-faq')}`);
        if (otherAnswer) {
          otherAnswer.classList.remove('visible');
        }
      }
    });
    
    // Toggle current answer
    question.classList.toggle('active');
    answer.classList.toggle('visible');
  });
});

// Waitlist Form with CSRF Token Support
const waitlistForm = document.getElementById('waitlistForm');
const emailInput = document.getElementById('emailInput');
const waitlistBtn = document.getElementById('waitlist-btn');

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
      emailInput.classList.add('error');
      showErrorToast('Please enter a valid email address');
      return;
    }
    
    // Get CSRF token from form or meta tag
    const getCsrfToken = () => {
      const token = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ||
                    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      return token;
    };
    
    const csrfToken = getCsrfToken();
    
    try {
      // Show loading state
      waitlistBtn.classList.add('loading');
      waitlistBtn.disabled = true;
      const originalText = waitlistBtn.textContent;
      waitlistBtn.textContent = 'Joining...';
      
      const response = await fetch('/waitlist/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        emailInput.value = '';
        emailInput.classList.remove('error');
        
        // Show success modal with confetti
        showSuccessModal();
        createConfetti();
        
        // Reset button after modal interaction
        setTimeout(() => {
          waitlistBtn.classList.remove('loading');
          waitlistBtn.disabled = false;
          waitlistBtn.textContent = originalText;
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to join waitlist');
      }
    } catch (error) {
      console.error('[v0] Waitlist error:', error);
      showErrorToast(error.message || 'An error occurred. Please try again.');
      waitlistBtn.classList.remove('loading');
      waitlistBtn.disabled = false;
      waitlistBtn.textContent = originalText;
    }
  });

  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      emailInput.classList.remove('error');
    });

    emailInput.addEventListener('blur', () => {
      if (emailInput.value && !validateEmail(emailInput.value)) {
        emailInput.classList.add('error');
      }
    });

    emailInput.addEventListener('input', () => {
      emailInput.classList.remove('error');
    });
  }
}

// Success Modal Functions
function showSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Close modal on background click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('successModal');
  if (modal && e.target === modal) {
    closeSuccessModal();
  }
});

// Error Toast Functions
function showErrorToast(message) {
  const toast = document.getElementById('errorToast');
  const errorMessage = document.getElementById('errorMessage');
  
  if (toast && errorMessage) {
    errorMessage.textContent = message;
    toast.classList.remove('hide');
    toast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        toast.classList.remove('show', 'hide');
      }, 300);
    }, 5000);
  }
}

// Confetti Creation
function createConfetti() {
  const confettiContainer = document.getElementById('confetti');
  if (!confettiContainer) return;
  
  const colors = ['#7c5cfc', '#3b82f6', '#22d3ee', '#34d399', '#f59e0b'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confettiPiece = document.createElement('div');
    confettiPiece.classList.add('confetti-piece');
    
    const size = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const tx = (Math.random() - 0.5) * 200;
    const delay = Math.random() * 0.2;
    
    confettiPiece.style.left = '50%';
    confettiPiece.style.top = '50%';
    confettiPiece.style.width = size + 'px';
    confettiPiece.style.height = size + 'px';
    confettiPiece.style.backgroundColor = color;
    confettiPiece.style.borderRadius = '50%';
    confettiPiece.style.setProperty('--tx', tx + 'px');
    confettiPiece.style.animationDelay = delay + 's';
    
    confettiContainer.appendChild(confettiPiece);
    
    // Remove confetti after animation
    setTimeout(() => {
      confettiPiece.remove();
    }, 3000 + delay * 1000);
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Scroll reveal animations with intersection observer
const revealElements = document.querySelectorAll(
  '.step-card, .feature-card, .testimonial-card, .pricing-card, .faq-item'
);

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

revealElements.forEach(el => {
  observer.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Parallax effect for background orbs on scroll
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const scrolled = window.pageYOffset;
      const orbs = document.querySelectorAll('.orb');
      
      orbs.forEach((orb, index) => {
        const depth = 0.3 + index * 0.15;
        orb.style.transform = `translateY(${scrolled * depth}px)`;
      });
      
      ticking = false;
    });
    ticking = true;
  }
});

// Mouse parallax for hero card (optional subtle effect)
document.addEventListener('mousemove', (e) => {
  const heroCard = document.querySelector('.hero-card');
  if (!heroCard) return;

  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  const moveX = (x - 0.5) * 20;
  const moveY = (y - 0.5) * 20;
  
  heroCard.style.transform = `perspective(1000px) rotateY(${moveX * 0.2}deg) rotateX(${-moveY * 0.2}deg) translateZ(10px)`;
});

// Keyboard navigation for speed buttons
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    const speeds = ['0.75', '1', '1.25', '1.5'];
    const currentActive = document.querySelector('.speed-btn.active');
    
    if (!currentActive) return;
    
    let currentIndex = speeds.indexOf(currentActive.getAttribute('data-speed'));
    
    if (e.key === 'ArrowUp' && currentIndex < speeds.length - 1) {
      currentIndex++;
    } else if (e.key === 'ArrowDown' && currentIndex > 0) {
      currentIndex--;
    }
    
    speedButtons[currentIndex].click();
  }
});

// Staggered animation on page load
window.addEventListener('load', () => {
  const cards = document.querySelectorAll('.step-card, .feature-card');
  
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});

// Disable animations for users who prefer reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  document.documentElement.style.scrollBehavior = 'auto';
  const style = document.createElement('style');
  style.textContent = `
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;
  document.head.appendChild(style);
}
 

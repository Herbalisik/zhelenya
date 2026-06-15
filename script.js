function setGuestNames() {
  const params = new URLSearchParams(window.location.search);
  const guest = params.get('guest') || params.get('name') || params.get('to');
  const guestLine = document.getElementById('guestLine');
  const guestEl = document.getElementById('guestNames');

  if (!guestLine || !guestEl) return;

  const cleanGuest = (guest || '').trim();
  if (cleanGuest) {
    guestEl.textContent = cleanGuest;
    guestLine.hidden = false;
  } else {
    guestEl.textContent = '';
    guestLine.hidden = true;
  }
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll('.reveal');
  if (!revealItems.length) return;

  function revealByViewport() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const isClose = rect.top < viewportHeight * 0.88 && rect.bottom > viewportHeight * 0.02;
      item.classList.toggle('is-visible', isClose);
    });
  }

  // Элементы теперь не только появляются, но и уходят обратно при прокрутке
  // в обе стороны: вниз и вверх.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px'
    });

    revealItems.forEach((item) => observer.observe(item));
  }

  let ticking = false;
  function requestReveal() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      revealByViewport();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestReveal, { passive: true });
  window.addEventListener('resize', requestReveal);
  window.addEventListener('load', revealByViewport);
  revealByViewport();
}

function setupProgramScrollAnimation() {
  const cards = Array.from(document.querySelectorAll('.program-card'));
  if (!cards.length) return;

  function setCardsByScroll() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const shouldBeVisible = rect.top < viewportHeight * 0.82 && rect.bottom > viewportHeight * 0.08;
      card.classList.toggle('is-visible', shouldBeVisible);
    });
  }

  // Для программы оставлен только scroll-based механизм: так карточки
  // стабильно выезжают и уезжают обратно даже при открытии сайта через file:// на Windows.
  let ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setCardsByScroll();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', setCardsByScroll);
  setCardsByScroll();
}

function setupBlockNavigation() {
  const sections = Array.from(document.querySelectorAll('.section'));
  const prevButton = document.getElementById('prevBlock');
  const nextButton = document.getElementById('nextBlock');

  if (!sections.length || !prevButton || !nextButton) return;

  function currentSectionIndex() {
    const marker = window.scrollY + window.innerHeight * 0.42;
    let index = 0;

    sections.forEach((section, sectionIndex) => {
      if (section.offsetTop <= marker) index = sectionIndex;
    });

    return index;
  }

  function updateButtons() {
    const index = currentSectionIndex();
    prevButton.disabled = index === 0;
    nextButton.disabled = index === sections.length - 1;
  }

  function scrollToSection(index) {
    const target = sections[Math.max(0, Math.min(index, sections.length - 1))];
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  prevButton.addEventListener('click', () => scrollToSection(currentSectionIndex() - 1));
  nextButton.addEventListener('click', () => scrollToSection(currentSectionIndex() + 1));
  window.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
}

function setupFormStatus() {
  const form = document.getElementById('rsvpForm');
  const status = document.getElementById('formStatus');
  const frame = document.querySelector('iframe[name="hiddenFrame"]');
  const drinksFieldset = document.getElementById('drinksFieldset');
  if (!form || !status) return;

  let isSubmitting = false;
  const submitButton = form.querySelector('button[type="submit"]');
  const attendanceInputs = Array.from(form.querySelectorAll('input[name="entry.668104351"]'));
  const drinkInputs = Array.from(form.querySelectorAll('input[name="entry.1880311026"]'));
  const valuesThatNeedDrinks = new Set(['Смогу', 'Смогу только 8']);

  function selectedAttendance() {
    const checked = attendanceInputs.find((input) => input.checked);
    return checked ? checked.value : '';
  }

  function shouldShowDrinks() {
    return valuesThatNeedDrinks.has(selectedAttendance());
  }

  function updateDrinksVisibility() {
    const showDrinks = shouldShowDrinks();

    if (drinksFieldset) {
      drinksFieldset.hidden = !showDrinks;
    }

    if (!showDrinks) {
      drinkInputs.forEach((input) => {
        input.checked = false;
      });
    }
  }

  attendanceInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateDrinksVisibility();
      status.textContent = '';
    });
  });

  updateDrinksVisibility();

  form.addEventListener('submit', (event) => {
    const action = form.getAttribute('action') || '';
    if (action.includes('PASTE_GOOGLE_FORM_ACTION_URL_HERE')) {
      event.preventDefault();
      status.textContent = 'Форма пока не подключена: нужно заменить action и entry-поля на данные вашей Google Формы.';
      return;
    }

    const needsDrink = shouldShowDrinks();
    const hasDrink = drinkInputs.some((input) => input.checked);
    if (needsDrink && !hasDrink) {
      event.preventDefault();
      status.textContent = 'Выберите хотя бы один напиток.';
      return;
    }

    isSubmitting = true;
    status.textContent = 'Отправляем ответ…';
    if (submitButton) submitButton.disabled = true;
  });

  if (frame) {
    frame.addEventListener('load', () => {
      if (!isSubmitting) return;
      isSubmitting = false;
      status.textContent = 'Спасибо, ответ отправлен.';
      form.reset();
      updateDrinksVisibility();
      if (submitButton) submitButton.disabled = false;
    });
  }
}

function setupImageRevealSections() {
  const sections = document.querySelectorAll('.image-reveal-section');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-bg-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.16,
    rootMargin: '0px 0px -10% 0px'
  });

  sections.forEach((section) => observer.observe(section));
}

setGuestNames();
setupRevealAnimations();
setupImageRevealSections();
setupProgramScrollAnimation();
setupFormStatus();

/* =============================================================
   Alexia & César — Invitación de boda
   script.js  ·  Se carga con "defer", por lo que el DOM ya está
   disponible cuando se ejecuta.
   ============================================================= */
'use strict';

(function () {

  /* ===========================================================
     CONFIGURACIÓN
     ===========================================================
     EmailJS (envío del RSVP sin backend):
       1. Crea una cuenta en https://www.emailjs.com
       2. Agrega un "Email Service"        → copia el Service ID
       3. Crea un "Email Template"         → copia el Template ID
          En el template configura:
            To Email : mariomayorga2010@gmail.com   (fijo)
            Cc       : {{cc_email}}                  (copia al invitado)
            Bcc      : ale_m_lozada@hotmail.com      (copia para Ale)
            Reply To : {{email}}
            Subject  : {{subject}}
            Cuerpo   : {{guest_list}} · {{guest_count}} · {{main_name}}
                       {{phone}}      → celular con formato (+52 55 1234 5678)
                       {{phone_raw}}  → solo dígitos (525512345678), para WhatsApp
       4. Copia tu Public Key en Account → General
       5. En Account → Security restringe los dominios permitidos
          a tu URL de GitHub Pages.
     =========================================================== */
  var CONFIG = {
    weddingDate:      '2026-11-13T16:30:00',
    contactEmail:     'mariomayorga2010@gmail.com',
    maxGuests:        4,
    emailjsPublicKey: 'Ggv9eMYLC_7B30RFb',
    emailjsServiceId: 'service_lor5poj',
    emailjsTemplateId:'template_de68zzr'
  };

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_DIGITS  = 10;              // México: 10 dígitos sin la lada país
  var PHONE_PREFIX  = '+52';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===========================================================
     1. NAVEGACIÓN
     =========================================================== */
  function initNav() {
    var nav  = $('#main-nav');
    var hero = $('#hero');
    if (!nav) return;

    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle('scrolled', !entries[0].isIntersecting);
      }, { threshold: 0.1 }).observe(hero);
    } else {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 80);
      }, { passive: true });
    }

    // Cierra el menú desplegable al elegir una sección (móvil)
    var collapseEl = $('#nav-links');
    $$('#nav-links .nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (!collapseEl || !collapseEl.classList.contains('show')) return;
        if (window.bootstrap && window.bootstrap.Collapse) {
          window.bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
        } else {
          collapseEl.classList.remove('show');
        }
      });
    });

    // Botón de scroll del hero
    $$('[data-scroll-to]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-scroll-to'));
        if (target) {
          target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /* ===========================================================
     2. CUENTA REGRESIVA
     =========================================================== */
  function initCountdown() {
    var els = {
      days:  $('#cd-days'),
      hours: $('#cd-hours'),
      mins:  $('#cd-mins'),
      secs:  $('#cd-secs')
    };
    if (!els.days || !els.hours || !els.mins || !els.secs) return;

    var target = new Date(CONFIG.weddingDate).getTime();
    if (isNaN(target)) return;

    function pad(n) { return String(n).padStart(2, '0'); }

    function render() {
      var diff = target - Date.now();

      if (diff <= 0) {
        els.days.textContent  = '00';
        els.hours.textContent = '00';
        els.mins.textContent  = '00';
        els.secs.textContent  = '00';
        clearInterval(timer);
        return;
      }

      els.days.textContent  = pad(Math.floor(diff / 86400000));
      els.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      els.mins.textContent  = pad(Math.floor((diff % 3600000) / 60000));
      els.secs.textContent  = pad(Math.floor((diff % 60000) / 1000));
    }

    render();
    var timer = setInterval(render, 1000);
  }

  /* ===========================================================
     3. ANIMACIONES AL HACER SCROLL
     =========================================================== */
  function initReveals() {
    var revealEls = $$('.reveal');
    var itinerarioItems = $$('#itinerario-timeline .itinerario-item');

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
      itinerarioItems.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('visible'); }, i * 80);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });

    var itinerarioObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el  = entry.target;
        var idx = itinerarioItems.indexOf(el);
        setTimeout(function () { el.classList.add('visible'); }, idx * 150);
        itinerarioObserver.unobserve(el);
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -60px 0px' });

    itinerarioItems.forEach(function (el) { itinerarioObserver.observe(el); });
  }

  /* ===========================================================
     4. MOSAICO + ÁLBUM EN MODAL
     -----------------------------------------------------------
     Cada pieza del mosaico declara en el HTML:
       data-album  → carpeta dentro de FOTOS (FOTOS/1, FOTOS/2…)
       data-count  → cuántas fotos tiene esa carpeta
       data-ext    → extensión de las fotos (jpeg, jpg, png…)
       data-title  → título que aparece en el modal
     Las fotos deben llamarse 1, 2, 3… dentro de cada carpeta.
     Si una foto no existe, se descarta sola: primero prueba con
     otras extensiones y, si tampoco están, la quita del álbum.
     =========================================================== */
  var EXT_FALLBACKS = ['jpeg', 'jpg', 'JPG', 'JPEG', 'png', 'PNG', 'webp'];

  function initAlbums() {
    var tiles    = $$('.mosaic-tile');
    var modalEl  = $('#album-modal');
    var titleEl  = $('#album-modal-title');
    var imageEl  = $('#album-image');
    var emptyEl  = $('#album-empty');
    var counterEl= $('#album-counter');
    var dotsEl   = $('#album-dots');
    var prevBtn  = $('#album-prev');
    var nextBtn  = $('#album-next');
    var stageEl  = $('#album-stage');

    if (!tiles.length || !modalEl || !imageEl) return;

    var photos  = [];   // [{ base, extIndex, src }]
    var index   = 0;
    var albumTitle = '';
    var lastTrigger = null;

    /* ---------- Construcción de la lista de fotos ---------- */
    function buildPhotos(folder, count, ext) {
      var list = [];
      var order = [ext].concat(EXT_FALLBACKS.filter(function (e) { return e !== ext; }));

      for (var i = 1; i <= count; i++) {
        list.push({
          base: 'FOTOS/' + folder + '/' + i,
          order: order,
          extIndex: 0
        });
      }
      return list;
    }

    function srcOf(photo) {
      return encodeURI(photo.base + '.' + photo.order[photo.extIndex]);
    }

    /* ---------- Render ---------- */
    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';

      photos.forEach(function (photo, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'album-dot' + (i === index ? ' active' : '');
        dot.setAttribute('aria-label', 'Ver foto ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsEl.appendChild(dot);
      });
    }

    function updateChrome() {
      var total = photos.length;

      if (counterEl) counterEl.textContent = total ? (index + 1) + ' / ' + total : '';
      if (prevBtn) prevBtn.hidden = total < 2;
      if (nextBtn) nextBtn.hidden = total < 2;

      $$('.album-dot', dotsEl).forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function showEmpty() {
      imageEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (counterEl) counterEl.textContent = '';
      if (dotsEl) dotsEl.innerHTML = '';
    }

    function goTo(i) {
      if (!photos.length) { showEmpty(); return; }

      index = (i + photos.length) % photos.length;
      var photo = photos[index];

      imageEl.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      imageEl.classList.remove('loaded');
      imageEl.alt = albumTitle + ' — foto ' + (index + 1);
      imageEl.src = srcOf(photo);

      updateChrome();
      preload(index + 1);
      preload(index - 1);
    }

    function preload(i) {
      if (photos.length < 2) return;
      var photo = photos[(i + photos.length) % photos.length];
      var img = new Image();
      img.src = srcOf(photo);
    }

    /* ---------- Fotos que no existen ---------- */
    imageEl.addEventListener('load', function () {
      imageEl.classList.add('loaded');
    });

    imageEl.addEventListener('error', function () {
      var photo = photos[index];
      if (!photo) return;

      // Prueba con la siguiente extensión posible
      if (photo.extIndex < photo.order.length - 1) {
        photo.extIndex++;
        imageEl.src = srcOf(photo);
        return;
      }

      // No existe en ningún formato: se elimina del álbum
      photos.splice(index, 1);

      if (!photos.length) { showEmpty(); return; }
      renderDots();
      goTo(index);
    });

    /* ---------- Apertura ---------- */
    function openAlbum(tile) {
      albumTitle = tile.getAttribute('data-title') || 'Nuestros momentos';
      var folder = tile.getAttribute('data-album');
      var count  = parseInt(tile.getAttribute('data-count'), 10);
      var ext    = tile.getAttribute('data-ext') || 'jpeg';

      if (!folder || !count || count < 1) count = 1;

      photos = buildPhotos(folder, count, ext);
      index  = 0;
      lastTrigger = tile;

      if (titleEl) titleEl.textContent = albumTitle;
      renderDots();
      goTo(0);

      if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      } else {
        openFallback();
      }
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () { openAlbum(tile); });
    });

    /* ---------- Navegación ---------- */
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    document.addEventListener('keydown', function (e) {
      if (!modalEl.classList.contains('show')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
    });

    // Deslizar con el dedo
    if (stageEl) {
      var touchX = null;
      var touchY = null;

      stageEl.addEventListener('touchstart', function (e) {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
      }, { passive: true });

      stageEl.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        var dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          goTo(index + (dx < 0 ? 1 : -1));
        }
        touchX = null;
        touchY = null;
      }, { passive: true });
    }

    // Devuelve el foco a la pieza del mosaico al cerrar
    modalEl.addEventListener('hidden.bs.modal', function () {
      imageEl.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    });

    /* ---------- Respaldo si Bootstrap no cargó ---------- */
    function openFallback() {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
      modalEl.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeFallback() {
      modalEl.classList.remove('show');
      modalEl.style.display = '';
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      imageEl.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    }

    if (!window.bootstrap || !window.bootstrap.Modal) {
      $$('[data-bs-dismiss="modal"]', modalEl).forEach(function (btn) {
        btn.addEventListener('click', closeFallback);
      });
      modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) closeFallback();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalEl.classList.contains('show')) closeFallback();
      });
    }
  }

  /* ===========================================================
     5. COPIAR CLABE
     =========================================================== */
  function initCopyClabe() {
    var btn      = $('#copy-clabe');
    var valueEl  = $('#clabe-value');
    var feedback = $('#copy-feedback');
    if (!btn || !valueEl) return;

    function notify(msg) {
      if (!feedback) return;
      feedback.textContent = msg;
      window.setTimeout(function () { feedback.textContent = ''; }, 2600);
    }

    function fallbackCopy(text) {
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(temp);
      return ok;
    }

    btn.addEventListener('click', function () {
      var text = valueEl.textContent.trim();

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          notify('CLABE copiada');
        }).catch(function () {
          notify(fallbackCopy(text) ? 'CLABE copiada' : 'Copia la CLABE manualmente');
        });
      } else {
        notify(fallbackCopy(text) ? 'CLABE copiada' : 'Copia la CLABE manualmente');
      }
    });
  }

  /* ===========================================================
     6. RSVP
     =========================================================== */
  function initRsvp() {
    var form       = $('#rsvp-form');
    var nameInput  = $('#name');
    var phoneInput = $('#phone');
    var phoneField = $('.phone-field');
    var emailInput = $('#email');
    var submitBtn  = $('#submit-btn');
    var addBtn     = $('#add-guest-btn');
    var extraWrap  = $('#extra-guests');
    var statusEl   = $('#form-status');

    if (!form || !nameInput || !emailInput || !phoneInput || !submitBtn || !addBtn || !extraWrap) return;

    var guestCount = 1;

    /* ---------- Estado del mensaje ---------- */
    function setStatus(type, message) {
      if (!statusEl) return;
      statusEl.className = 'form-status visible ' + type;
      statusEl.textContent = message;
    }

    function clearStatus() {
      if (!statusEl) return;
      statusEl.className = 'form-status';
      statusEl.textContent = '';
    }

    /* ---------- Errores de campo ---------- */
    function showError(fieldId, errId, show) {
      var field = document.getElementById(fieldId);
      var err   = document.getElementById(errId);
      if (field) field.classList.toggle('error', show);
      if (err)   err.classList.toggle('visible', show);
    }

    /* ---------- Invitados adicionales ---------- */
    function renumberGuestFields() {
      $$('.guest-extra-field', extraWrap).forEach(function (field, i) {
        var n     = i + 2;
        var label = $('label', field);
        var input = $('input', field);
        if (label && input) {
          label.textContent = 'Nombre del invitado ' + n;
          label.setAttribute('for', 'guest-' + n);
          input.id = 'guest-' + n;
          input.name = 'guest_' + n;
          input.placeholder = 'Nombre del invitado ' + n;
        }
      });
    }

    function updateAddGuestBtn() {
      addBtn.disabled = guestCount >= CONFIG.maxGuests;
    }

    function addGuestField() {
      if (guestCount >= CONFIG.maxGuests) return;
      guestCount++;

      var n = guestCount;
      var wrapper = document.createElement('div');
      wrapper.className = 'guest-extra-field';
      wrapper.innerHTML =
        '<div class="form-group">' +
          '<label for="guest-' + n + '">Nombre del invitado ' + n + '</label>' +
          '<input type="text" id="guest-' + n + '" name="guest_' + n + '" placeholder="Nombre del invitado ' + n + '" />' +
        '</div>' +
        '<button type="button" class="btn-remove-guest" aria-label="Quitar invitado">&times;</button>';

      extraWrap.appendChild(wrapper);

      var input = $('input', wrapper);
      if (input) input.focus();

      $('.btn-remove-guest', wrapper).addEventListener('click', function () {
        wrapper.remove();
        guestCount--;
        renumberGuestFields();
        updateAddGuestBtn();
      });

      updateAddGuestBtn();
    }

    addBtn.addEventListener('click', addGuestField);
    updateAddGuestBtn();

    /* ---------- Validación ---------- */
    function isEmailValid() {
      return EMAIL_PATTERN.test(emailInput.value.trim());
    }

    function phoneDigits() {
      var d = phoneInput.value.replace(/\D/g, '');

      // Si pegan el número con la lada del país (+52 55…), la quitamos
      if (d.length > PHONE_DIGITS && d.indexOf('52') === 0) d = d.slice(2);

      return d.slice(0, PHONE_DIGITS);
    }

    function isPhoneValid() {
      return phoneDigits().length === PHONE_DIGITS;
    }

    // Da formato mientras se escribe: 55 1234 5678
    function formatPhone() {
      var d = phoneDigits();
      var out = d;

      if (d.length > 2 && d.length <= 6)      out = d.slice(0, 2) + ' ' + d.slice(2);
      else if (d.length > 6)                  out = d.slice(0, 2) + ' ' + d.slice(2, 6) + ' ' + d.slice(6);

      if (phoneInput.value !== out) phoneInput.value = out;
    }

    function showPhoneError(show) {
      if (phoneField) phoneField.classList.toggle('error', show);
      var err = document.getElementById('phone-err');
      if (err) err.classList.toggle('visible', show);
    }

    function updateSubmitState() {
      submitBtn.disabled = !nameInput.value.trim() || !isPhoneValid() || !isEmailValid();
    }

    phoneInput.addEventListener('input', function () {
      formatPhone();
      if (isPhoneValid()) showPhoneError(false);
      clearStatus();
      updateSubmitState();
    });

    phoneInput.addEventListener('blur', function () {
      if (phoneInput.value.trim() && !isPhoneValid()) showPhoneError(true);
    });

    nameInput.addEventListener('input', function () {
      showError('name', 'name-err', false);
      clearStatus();
      updateSubmitState();
    });

    emailInput.addEventListener('input', function () {
      if (isEmailValid()) showError('email', 'email-err', false);
      clearStatus();
      updateSubmitState();
    });

    emailInput.addEventListener('blur', function () {
      if (emailInput.value.trim() && !isEmailValid()) {
        showError('email', 'email-err', true);
      }
    });

    updateSubmitState();

    /* ---------- EmailJS ---------- */
    var emailjsReady = false;
    if (window.emailjs && CONFIG.emailjsPublicKey) {
      try {
        window.emailjs.init({ publicKey: CONFIG.emailjsPublicKey });
        emailjsReady = true;
      } catch (err) {
        emailjsReady = false;
      }
    }

    function collectGuestNames() {
      var names = [nameInput.value.trim()];
      $$('input[type="text"]', extraWrap).forEach(function (input) {
        var val = input.value.trim();
        if (val) names.push(val);
      });
      return names;
    }

    /* ---------- Envío ---------- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;

      if (!nameInput.value.trim()) {
        showError('name', 'name-err', true);
        valid = false;
      } else {
        showError('name', 'name-err', false);
      }

      if (!isPhoneValid()) {
        showPhoneError(true);
        valid = false;
      } else {
        showPhoneError(false);
      }

      if (!isEmailValid()) {
        showError('email', 'email-err', true);
        valid = false;
      } else {
        showError('email', 'email-err', false);
      }

      if (!valid) return;

      if (!emailjsReady) {
        setStatus('error', 'El envío por correo no está disponible en este momento. Escríbenos directamente a ' + CONFIG.contactEmail + '.');
        return;
      }

      var guestNames = collectGuestNames();
      var firstName  = guestNames[0];

      var d = phoneDigits();
      var phonePretty = PHONE_PREFIX + ' ' + d.slice(0, 2) + ' ' + d.slice(2, 6) + ' ' + d.slice(6);

      var payload = {
        subject:     'Confirmación de invitados… ' + firstName,
        cc_email:    emailInput.value.trim(),
        email:       emailInput.value.trim(),      // usada por el campo Reply To del template
        guest_list:  guestNames.map(function (n, i) { return (i + 1) + '. ' + n; }).join('\n'),
        guest_count: guestNames.length,
        main_name:   firstName,
        phone:       phonePretty,                 // +52 55 1234 5678
        phone_raw:   PHONE_PREFIX.replace('+','') + d  // 525512345678 (útil para WhatsApp)
      };

      submitBtn.disabled = true;
      addBtn.disabled = true;
      setStatus('sending', 'Enviando tu confirmación…');

      window.emailjs.send(CONFIG.emailjsServiceId, CONFIG.emailjsTemplateId, payload)
        .then(function () {
          setStatus('success', '¡Gracias! Tu confirmación fue enviada con éxito. Recibirás una copia en tu correo.');
          form.reset();
          extraWrap.innerHTML = '';
          showPhoneError(false);
          guestCount = 1;
          updateAddGuestBtn();
          submitBtn.disabled = true;
        })
        .catch(function () {
          setStatus('error', 'No pudimos enviar tu confirmación. Intenta de nuevo o escríbenos a ' + CONFIG.contactEmail + '.');
          updateSubmitState();
          updateAddGuestBtn();
        });
    });
  }

  /* ===========================================================
     ARRANQUE
     =========================================================== */
  function init() {
    initNav();
    initCountdown();
    initReveals();
    initAlbums();
    initCopyClabe();
    initRsvp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

const preloader = document.getElementById("preloader");
const envelope = document.getElementById("envelope");
const sealBtn = document.getElementById("seal-btn");

const fabMusic = document.getElementById("fab-music");
const bgAudio = document.getElementById("bg-audio");

const openRsvp = document.getElementById("open-rsvp");
const closeRsvp = document.getElementById("close-rsvp");
const rsvpModal = document.getElementById("rsvp-modal");

const guestbookForm = document.getElementById("guestbook-form");
const guestName = document.getElementById("guest-name");
const guestMessage = document.getElementById("guest-message");
const chatList = document.getElementById("chat-list");
const chatEmpty = document.getElementById("chat-empty");
const albumModal = document.getElementById("album-modal");
const albumModalImg = document.getElementById("album-modal-img");
const albumModalCaption = document.getElementById("album-modal-caption");

const rsvpForm = document.getElementById("rsvp-form");
const toast = document.getElementById("toast");
const countdownLabel = document.getElementById("countdown-label");

let invitationOpened = false;
let musicPlaying = false;
const STORAGE_MESSAGES = "wedding_guestbook_messages";
const STORAGE_RSVP = "wedding_rsvp_entries";
const MONTH_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

function getTargetDate() {
  const cfg = window.WEDDING_TEXT || {};
  const targetStr = cfg.countdownTarget || "2026-05-03T17:00:00+07:00";
  const targetDate = new Date(targetStr);
  if (Number.isNaN(targetDate.getTime())) return null;
  return targetDate;
}

function applyTextContent() {
  const text = window.WEDDING_TEXT || {};
  const htmlMap = [
    ["couple-script", text.coupleScript],
    ["invite-message", text.inviteMessage],
    ["event-date-lunar", text.eventDateLunar],
    ["bride-family", text.brideFamily],
    ["groom-family", text.groomFamily],
    ["venue-address", text.venueAddress],
    ["footer-message", text.footerMessage]
  ];
  htmlMap.forEach(([id, value]) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  });

  const textMap = [
    ["couple-names", text.coupleNames],
    ["monogram-text", text.monogram],
    ["wedding-date", text.weddingDate],
    ["event-time", text.eventTime],
    ["event-date-text", text.eventDateText],
    ["venue-name", text.venueName],
    ["timeline-date", text.timelineDate],
    ["guestbook-title", text.guestbookTitle],
    ["footer-title", text.footerTitle]
  ];
  textMap.forEach(([id, value]) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function buildCalendar() {
  const targetDate = getTargetDate();
  if (!targetDate) return;
  const yearEl = document.getElementById("calendar-year");
  const monthEl = document.getElementById("calendar-month");
  const gridEl = document.getElementById("calendar-grid");
  if (!yearEl || !monthEl || !gridEl) return;

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();
  yearEl.textContent = String(year);
  monthEl.textContent = MONTH_VI[month];

  const headerHtml = "<div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>";
  const firstDay = new Date(year, month, 1).getDay(); // 0 cn, 1 t2...
  const mondayIndex = (firstDay + 6) % 7; // Monday=0
  const lastDate = new Date(year, month + 1, 0).getDate();

  let cells = "";
  for (let i = 0; i < mondayIndex; i++) cells += "<div></div>";
  for (let d = 1; d <= lastDate; d++) {
    if (d === day) cells += `<div class="heart-day">${d}</div>`;
    else cells += `<div>${d}</div>`;
  }
  gridEl.innerHTML = headerHtml + cells;
}

function applyImageContent() {
  const images = window.WEDDING_IMAGES || {};
  document.querySelectorAll("[data-img-key]").forEach(el => {
    const key = el.getAttribute("data-img-key");
    if (images[key]) {
      el.src = images[key];
    }
  });
}

function applyAssetContent() {
  const assets = window.WEDDING_ASSETS || {};
  document.querySelectorAll("[data-asset-key]").forEach(el => {
    const key = el.getAttribute("data-asset-key");
    if (assets[key]) {
      el.src = assets[key];
    }
  });
}

function initAlbumModal() {
  const images = document.querySelectorAll("#album-section .album-item");
  images.forEach((img) => {
    img.addEventListener("click", () => {
      const captionKey = img.getAttribute("data-caption-key");
      const txt = window.WEDDING_TEXT || {};
      albumModalImg.src = img.src;
      albumModalCaption.textContent = (captionKey && txt[captionKey]) ? txt[captionKey] : "Khoảnh khắc đáng nhớ của chúng mình.";
      openModal(albumModal);
    });
  });
  albumModal.addEventListener("click", () => closeModal(albumModal));
}

function hidePreloader() {
  setTimeout(() => {
    preloader.style.opacity = "0";
    preloader.style.transition = "opacity .4s ease";
    setTimeout(() => {
      preloader.style.display = "none";
      autoOpenEnvelope();
    }, 420);
  }, 900);
}

function openInvitation() {
  if (invitationOpened) return;
  invitationOpened = true;

  sealBtn.classList.add("hide");
  envelope.classList.add("open");

  setTimeout(() => {
    envelope.style.display = "none";
  }, 1100);

  playMusic();
}

function autoOpenEnvelope() {
  setTimeout(() => {
    openInvitation();
  }, 2000);
}

function playMusic() {
  const musicCfg = window.WEDDING_MUSIC || {};
  if (musicCfg.src && bgAudio.src !== musicCfg.src) {
    bgAudio.src = musicCfg.src;
  }
  if (typeof musicCfg.volume === "number") {
    bgAudio.volume = Math.min(1, Math.max(0, musicCfg.volume));
  }
  bgAudio.play()
    .then(() => {
      musicPlaying = true;
      fabMusic.classList.add("playing");
    })
    .catch(() => {
      musicPlaying = false;
      fabMusic.classList.remove("playing");
    });
}

function pauseMusic() {
  bgAudio.pause();
  musicPlaying = false;
  fabMusic.classList.remove("playing");
}

function toggleMusic() {
  if (musicPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function updateCountdown() {
  const targetDate = getTargetDate();
  const target = targetDate ? targetDate.getTime() : NaN;
  const now = Date.now();
  const gap = target - now;

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minsEl = document.getElementById("mins");
  const secsEl = document.getElementById("secs");

  if (!Number.isFinite(target)) {
    daysEl.textContent = "000";
    hoursEl.textContent = "00";
    minsEl.textContent = "00";
    secsEl.textContent = "00";
    countdownLabel.textContent = "Countdown chưa được cấu hình đúng trong text-content.js";
    return;
  }

  if (gap <= 0) {
    daysEl.textContent = "000";
    hoursEl.textContent = "00";
    minsEl.textContent = "00";
    secsEl.textContent = "00";
    countdownLabel.textContent = "The big day is here. Thank you for your love!";
    return;
  }

  const days = Math.floor(gap / (1000 * 60 * 60 * 24));
  const hours = Math.floor((gap / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((gap / (1000 * 60)) % 60);
  const secs = Math.floor((gap / 1000) % 60);

  daysEl.textContent = String(days).padStart(3, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minsEl.textContent = String(mins).padStart(2, "0");
  secsEl.textContent = String(secs).padStart(2, "0");
}

function initReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        } else {
          entry.target.classList.remove("active");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  const albumObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    { threshold: 0.55, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".album-reveal").forEach(el => albumObserver.observe(el));
}

function openModal(modalEl) {
  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modalEl) {
  modalEl.classList.add("hidden");
  const anyOpen = !rsvpModal.classList.contains("hidden") || !albumModal.classList.contains("hidden");
  if (!anyOpen) {
    document.body.style.overflow = "";
  }
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function appendChatBubble(name, message, animated = true) {
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${chatList.children.length % 2 ? "alt" : ""}`;
  bubble.innerHTML = `
    <p class="chat-name">${escapeHtml(name)}</p>
    <p class="chat-message">${escapeHtml(message)}</p>
  `;
  chatList.prepend(bubble);
  if (animated) {
    requestAnimationFrame(() => bubble.classList.add("show"));
  } else {
    bubble.classList.add("show");
  }
  chatList.scrollTop = 0;
}

function storeMessages(messages) {
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderMessages() {
  chatList.innerHTML = "";
  const messages = loadMessages();
  if (!messages.length) {
    chatEmpty.style.display = "block";
    return;
  }

  chatEmpty.style.display = "none";

  messages.forEach(item => appendChatBubble(item.name, item.message, false));
}

function seedMessagesIfEmpty() {
  const messages = loadMessages();
  if (messages.length) return;
  const seed = [
    { name: "Thanh Hà", message: "Chúc anh chị trăm năm hạnh phúc.\nMãi yêu thương và bình an!", at: Date.now() - 3000 },
    { name: "Quang Đức", message: "Mừng ngày trọng đại của hai bạn.\nHôn lễ thật viên mãn nhé!", at: Date.now() - 2000 }
  ];
  storeMessages(seed);
}

function saveRsvp(name, count) {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_RSVP);
    list = raw ? JSON.parse(raw) : [];
  } catch {
    list = [];
  }
  list.unshift({ name, count, at: Date.now() });
  localStorage.setItem(STORAGE_RSVP, JSON.stringify(list.slice(0, 100)));
}

function initPetals() {
  const canvas = document.getElementById("petal-canvas");
  const ctx = canvas.getContext("2d");

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const MAX_PETALS = 12; // so luong thap (petal ro rang hon)
  const MAX_TOTAL = 24; // tong so petal (fall + rest) de roi lien tuc
  const SPAWN_INTERVAL = 420; // ms

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function createPetal({ toTop = true } = {}) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const type = pick(["round", "pointy", "curved"]);
    const size = rand(9, 16);
    const startY = toTop ? rand(-120, -20) : rand(0, h);
    const startX = rand(0, w);
    return {
      x: startX,
      y: startY,
      vx: rand(-10, 10),
      vy: rand(22, 46),
      ax: rand(-4, 4),
      flutter: rand(0.8, 2.2),
      flutterAmp: rand(6, 18),
      angle: rand(0, Math.PI * 2),
      angularVel: rand(-1.4, 1.4),
      spinJitter: rand(0.6, 1.4),
      size,
      alpha: rand(0.35, 0.62),
      tint: rand(0, 0.16),
      type,
      state: "fall",
      restAt: 0,
      fadeAt: 0,
      fadeDur: rand(600, 1100) // ms
    };
  }

  const petals = Array.from({ length: MAX_PETALS }, () => createPetal({ toTop: false }));

  function drawPetalRound(size) {
    const w = size;
    const h = size * 0.72;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.9);
    ctx.bezierCurveTo(w * 0.7, -h, w * 0.95, -h * 0.2, w * 0.4, h * 0.75);
    ctx.bezierCurveTo(w * 0.12, h * 1.03, -w * 0.15, h * 0.86, -w * 0.36, h * 0.55);
    ctx.bezierCurveTo(-w * 0.95, -h * 0.2, -w * 0.7, -h, 0, -h * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  function drawPetalPointy(size) {
    const w = size * 1.08;
    const h = size * 0.88;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.quadraticCurveTo(w, -h * 0.35, w * 0.4, h * 0.82);
    ctx.quadraticCurveTo(0, h * 1.06, -w * 0.4, h * 0.82);
    ctx.quadraticCurveTo(-w, -h * 0.35, 0, -h);
    ctx.closePath();
    ctx.fill();
  }

  function drawPetalCurved(size) {
    const w = size;
    const h = size * 0.78;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h);
    ctx.bezierCurveTo(w * 0.95, -h * 0.85, w * 0.95, h * 0.1, w * 0.2, h * 0.95);
    ctx.bezierCurveTo(-w * 0.25, h * 1.05, -w * 0.85, h * 0.55, -w * 0.7, -h * 0.1);
    ctx.bezierCurveTo(-w * 0.6, -h * 0.7, -w * 0.25, -h * 1.05, -w * 0.1, -h);
    ctx.closePath();
    ctx.fill();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function petalGradient(size, tint) {
    // Vary nhẹ sắc hồng theo tint
    const g = ctx.createLinearGradient(-size, -size, size, size);
    const a0 = lerp(1.0, 0.98, tint);
    const a1 = lerp(0.90, 0.86, tint);
    const a2 = lerp(0.82, 0.76, tint);
    g.addColorStop(0, `rgba(255, ${Math.round(230 * a0)}, ${Math.round(238 * a0)}, 1)`);
    g.addColorStop(0.5, `rgba(248, ${Math.round(214 * a1)}, ${Math.round(227 * a1)}, 1)`);
    g.addColorStop(1, `rgba(239, ${Math.round(189 * a2)}, ${Math.round(210 * a2)}, 1)`);
    return g;
  }

  function petalHighlightStroke(size) {
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.lineWidth = Math.max(0.8, size * 0.07);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, -size * 0.68);
    ctx.quadraticCurveTo(size * 0.55, -size * 0.35, size * 0.12, size * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  let last = performance.now();
  let lastSpawn = performance.now();
  function draw() {
    const now = performance.now();
    const dt = Math.min(0.034, Math.max(0.008, (now - last) / 1000)); // clamp 8-34ms
    last = now;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // spawn lien tuc: khong can doi petal cu bien mat moi co petal moi
    if (petals.length < MAX_TOTAL && now - lastSpawn >= SPAWN_INTERVAL) {
      petals.push(createPetal({ toTop: true }));
      lastSpawn = now;
    }

    petals.forEach(p => {
      if (p.state === "fall") {
        // gravity-ish + wind flutter
        p.vx += p.ax * dt;
        p.vx *= 0.985;
        p.vy = Math.min(78, p.vy + 18 * dt);
        p.x += p.vx * dt + Math.sin((now / 1000) * p.flutter + p.y * 0.01) * (p.flutterAmp * dt);
        p.y += p.vy * dt;

        // soft flutter rotation
        p.angle += (p.angularVel + Math.sin((now / 1000) * p.spinJitter + p.x * 0.02) * 0.45) * dt;

        // wrap X
        if (p.x < -40) p.x = w + 40;
        if (p.x > w + 40) p.x = -40;

        // settle at bottom
        const bottom = h - 6;
        if (p.y >= bottom) {
          p.y = bottom;
          p.state = "rest";
          p.restAt = now;
          p.fadeAt = now + 10000; // stay 10s then fade
          p.vx = 0;
          p.vy = 0;
          p.ax = 0;
        }
      } else {
        // rest: fade out after 10s
        if (now >= p.fadeAt + p.fadeDur) {
          // xoa petal da tan. Petal moi duoc spawn boi scheduler o tren.
          p._dead = true;
        }
      }

      let alphaMul = 1;
      if (p.state === "rest" && now >= p.fadeAt) {
        alphaMul = 1 - Math.min(1, (now - p.fadeAt) / p.fadeDur);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha * alphaMul;

      ctx.fillStyle = petalGradient(p.size, p.tint);
      if (p.type === "round") drawPetalRound(p.size);
      else if (p.type === "pointy") drawPetalPointy(p.size);
      else drawPetalCurved(p.size);
      petalHighlightStroke(p.size);

      ctx.restore();
    });

    // don petal da tan (giu bo nho on dinh)
    for (let i = petals.length - 1; i >= 0; i--) {
      if (petals[i]._dead) petals.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }

  draw();
}

window.addEventListener("load", () => {
  applyTextContent();
  applyImageContent();
  applyAssetContent();
  buildCalendar();
  hidePreloader();
  initReveal();
  initAlbumModal();
  initPetals();
  seedMessagesIfEmpty();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  renderMessages();
});

sealBtn.addEventListener("click", openInvitation);

fabMusic.addEventListener("click", toggleMusic);

openRsvp.addEventListener("click", () => openModal(rsvpModal));
closeRsvp.addEventListener("click", () => closeModal(rsvpModal));

rsvpModal.addEventListener("click", e => {
  if (e.target === rsvpModal) closeModal(rsvpModal);
});

window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal(rsvpModal);
    closeModal(albumModal);
  }
});

guestbookForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = guestName.value.trim();
  const message = guestMessage.value.trim();

  if (!name || !message) {
    showToast("Bạn vui lòng nhập đầy đủ tên và lời chúc");
    return;
  }

  chatEmpty.style.display = "none";
  appendChatBubble(name, message, true);

  const messages = loadMessages();
  messages.unshift({ name, message, at: Date.now() });
  storeMessages(messages.slice(0, 40));

  guestName.value = "";
  guestMessage.value = "";
  showToast("Đã gửi lời chúc thành công");
});

rsvpForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("rsvp-name").value.trim();
  const count = document.getElementById("rsvp-count").value;
  if (!name || !count) {
    showToast("Vui lòng điền đầy đủ thông tin RSVP");
    return;
  }
  saveRsvp(name, Number(count));
  rsvpForm.reset();
  closeModal(rsvpModal);
  showToast(`Cảm ơn ${name}, đã ghi nhận ${count} khách`);
});

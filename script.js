const preloader = document.getElementById("preloader");
const preloaderText = document.getElementById("preloader-text");
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
const syncStatus = document.getElementById("sync-status"); // may be null (UI hidden/removed)

let invitationOpened = false;
let musicPlaying = false;
const STORAGE_MESSAGES = "wedding_guestbook_messages";
const STORAGE_RSVP = "wedding_rsvp_entries";
const STORAGE_SHEET_QUEUE = "wedding_sheet_queue";
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
    ["ceremony-church-title", text.ceremonyChurchTitle],
    ["ceremony-church-time", text.ceremonyChurchTime],
    ["ceremony-church-date", text.ceremonyChurchDate],
    ["ceremony-church-lunar", text.ceremonyChurchLunar],
    ["groom-full-name", text.groomFullName],
    ["bride-full-name", text.brideFullName],
    ["bride-intro-label", text.brideIntroLabel],
    ["groom-intro-label", text.groomIntroLabel],
    ["event-time", text.eventTime],
    ["event-date-text", text.eventDateText],
    ["venue-name", text.venueName],
    ["gift-title", text.giftTitle],
    ["gift-subtitle", text.giftSubtitle],
    ["guestbook-title", text.guestbookTitle],
    ["footer-title", text.footerTitle]
  ];
  textMap.forEach(([id, value]) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  if (text.mapLink) {
    const mapEl = document.getElementById("map-link");
    if (mapEl) mapEl.href = text.mapLink;
  }

  const stack = document.getElementById("ceremony-stack");
  if (stack) {
    const hasChurch = Boolean(text.ceremonyChurchTitle && String(text.ceremonyChurchTitle).trim());
    stack.style.display = hasChurch ? "" : "none";
  }

  // vows: allow \n line breaks
  const groomVowsEl = document.getElementById("groom-vows");
  if (groomVowsEl && text.groomVows) {
    groomVowsEl.innerHTML = String(text.groomVows).trim().replace(/\n+/g, "<br>");
  }
  const brideVowsEl = document.getElementById("bride-vows");
  if (brideVowsEl && text.brideVows) {
    brideVowsEl.innerHTML = String(text.brideVows).trim().replace(/\n+/g, "<br>");
  }
}

function applyFeatureFlags() {
  const f = window.WEDDING_FEATURES || {};
  const gifts = String(f.gifts || "on").toLowerCase() !== "off";
  const giftSection = document.getElementById("gift-section");
  if (giftSection) giftSection.style.display = gifts ? "" : "none";
}

function initGift() {
  const openGift = document.getElementById("open-gift");
  const giftModal = document.getElementById("gift-modal");
  const closeGift = document.getElementById("close-gift");
  if (!openGift || !giftModal || !closeGift) return;
  openGift.addEventListener("click", () => openModal(giftModal));
  closeGift.addEventListener("click", () => closeModal(giftModal));
  giftModal.addEventListener("click", e => {
    if (e.target === giftModal) closeModal(giftModal);
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
    if (!images[key]) return;
    try {
      el.decoding = "async";
    } catch {}
    if (el.closest(".album-section")) {
      el.loading = "lazy";
    } else {
      el.loading = "eager";
    }
    el.addEventListener(
      "error",
      () => {
        el.style.background = "linear-gradient(145deg,#ece8e0,#ddd8cf)";
        el.alt = el.alt || "";
      },
      { once: true }
    );
    el.src = images[key];
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
  const items = Array.from(document.querySelectorAll(".album-section .album-item"));
  if (!items.length) return;

  const txt = () => (window.WEDDING_TEXT || {});
  const gallery = items.map(img => ({
    src: img.src,
    captionKey: img.getAttribute("data-caption-key") || ""
  }));

  let current = 0;
  let lastSwipeAt = 0;
  let touch = null;

  function render(idx) {
    const item = gallery[idx];
    if (!item) return;
    current = idx;
    albumModalImg.src = item.src;
    const cap = item.captionKey && txt()[item.captionKey] ? txt()[item.captionKey] : "Khoảnh khắc đáng nhớ của chúng mình.";
    albumModalCaption.textContent = cap;
  }

  function openAt(idx) {
    render(idx);
    openModal(albumModal);
  }

  function next() {
    render((current + 1) % gallery.length);
  }

  function prev() {
    render((current - 1 + gallery.length) % gallery.length);
  }

  items.forEach((img, idx) => {
    img.addEventListener("click", () => openAt(idx));
  });

  // swipe navigation on modal
  function onTouchStart(e) {
    const p = e.touches && e.touches[0] ? e.touches[0] : null;
    if (!p) return;
    touch = { x: p.clientX, y: p.clientY, at: Date.now() };
  }
  function onTouchMove(e) {
    if (!touch) return;
    const p = e.touches && e.touches[0] ? e.touches[0] : null;
    if (!p) return;
    const dx = p.clientX - touch.x;
    const dy = p.clientY - touch.y;
    if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy)) {
      // prevent vertical scroll when swiping images
      e.preventDefault();
    }
  }
  function onTouchEnd(e) {
    if (!touch) return;
    const p = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null;
    if (!p) {
      touch = null;
      return;
    }
    const dx = p.clientX - touch.x;
    const dy = p.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      lastSwipeAt = Date.now();
      if (dx < 0) next();
      else prev();
    }
  }

  albumModal.addEventListener("touchstart", onTouchStart, { passive: true });
  albumModal.addEventListener("touchmove", onTouchMove, { passive: false });
  albumModal.addEventListener("touchend", onTouchEnd, { passive: true });

  // click anywhere to close (ignore immediately after swipe)
  albumModal.addEventListener("click", () => {
    if (Date.now() - lastSwipeAt < 280) return;
    closeModal(albumModal);
  });

  // keyboard navigation on desktop
  window.addEventListener("keydown", e => {
    if (albumModal.classList.contains("hidden")) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
}

function hidePreloader() {
  preloader.style.opacity = "0";
  preloader.style.transition = "opacity .4s ease";
  setTimeout(() => {
    preloader.style.display = "none";
    autoOpenEnvelope();
  }, 420);
}

function updatePreloader(message) {
  if (preloaderText && message) preloaderText.textContent = message;
}

function preloadOneImage(url, timeoutMs = 6000) {
  return new Promise(resolve => {
    if (!url) return resolve({ ok: false, url });
    const img = new Image();
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      resolve({ ok, url });
    };
    const t = setTimeout(() => finish(false), timeoutMs);
    img.onload = async () => {
      clearTimeout(t);
      try {
        if (typeof img.decode === "function") await img.decode();
      } catch {}
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(t);
      finish(false);
    };
    img.decoding = "async";
    img.src = url;
  });
}

async function preloadCriticalImages() {
  const images = window.WEDDING_IMAGES || {};
  const urls = Array.from(new Set(Object.values(images).filter(Boolean)));
  if (!urls.length) return;

  const startedAt = Date.now();
  // Giữ nguyên 1 câu duy nhất: “Xin chờ đợi ạ…”
  updatePreloader("Xin chờ đợi ạ...");

  // tải song song vừa phải để đỡ nghẽn mạng + tránh giật
  const concurrency = 4;
  let idx = 0;
  let done = 0;

  async function worker() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const myIdx = idx;
      idx += 1;
      if (myIdx >= urls.length) break;
      // eslint-disable-next-line no-await-in-loop
      await preloadOneImage(urls[myIdx], 9000);
      done += 1;
      // không hiển thị % để UI gọn, tránh giật text
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));

  // để UI “êm” trước khi mở phong bì
  const spent = Date.now() - startedAt;
  if (spent < 650) await new Promise(r => setTimeout(r, 650 - spent));
}

function openInvitation() {
  if (invitationOpened) return;
  invitationOpened = true;

  // Bắt đầu nhạc ngay khi user bấm mở thiệp để khớp animation
  playMusic();

  sealBtn.classList.add("hide");
  envelope.classList.add("open");

  setTimeout(() => {
    envelope.style.display = "none";
  }, 1100);
}

function autoOpenEnvelope() {
  setTimeout(() => {
    // Auto-open có thể bị chặn autoplay; không ép bật nhạc
    if (!invitationOpened) {
      sealBtn.classList.add("hide");
      envelope.classList.add("open");
      setTimeout(() => {
        envelope.style.display = "none";
      }, 1100);
      invitationOpened = true;
    }
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

  // preload nhanh hơn trước khi gọi play
  try {
    bgAudio.load();
  } catch {}

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
  // Hysteresis để tránh "chớp nháy" khi cuộn sát rìa viewport (đặc biệt ở khối ảnh CD/CR)
  const state = new WeakMap();
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const el = entry.target;
        const prev = state.get(el) || { active: false, last: 0 };
        const now = Date.now();
        const ratio = entry.intersectionRatio || 0;
        const wantOn = entry.isIntersecting && ratio >= 0.14;
        const wantOff = !entry.isIntersecting || ratio <= 0.02;

        // debounce nhỏ để tránh toggle liên tục khi scroll rung
        if (now - prev.last < 140) return;

        if (!prev.active && wantOn) {
          el.classList.add("active");
          state.set(el, { active: true, last: now });
        } else if (prev.active && wantOff) {
          el.classList.remove("active");
          state.set(el, { active: false, last: now });
        }
      });
    },
    { threshold: [0, 0.02, 0.14, 0.22], rootMargin: "0px 0px -28px 0px" }
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
  modalEl.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeModal(modalEl) {
  modalEl.classList.add("hidden");
  modalEl.classList.remove("is-open");
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

function setSyncStatus(message, tone = "") {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.classList.remove("ok", "warn", "err");
  if (tone) syncStatus.classList.add(tone);
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
  const messages = loadMessages();
  renderChatFromMessages(messages);
}

/** Hien thi danh sach len khu chat (tu Sheet hoac local). Thu tu: cu -> moi, bubble moi nhat o tren. */
function renderChatFromMessages(messages) {
  chatList.innerHTML = "";
  if (!messages.length) {
    chatEmpty.style.display = "block";
    return;
  }
  chatEmpty.style.display = "none";
  messages.forEach(item => appendChatBubble(item.name, item.message, false));
}

function sheetRowsToMessages(entries) {
  return entries
    .map(row => {
      const at = row.submittedAt ? Date.parse(row.submittedAt) : NaN;
      return {
        name: String(row.name || "").trim(),
        message: String(row.message || "").trim(),
        at: Number.isNaN(at) ? Date.now() : at
      };
    })
    .filter(m => m.name && m.message);
}

async function fetchGuestbookFromSheet() {
  const cfg = window.WEDDING_SHEET || {};
  if (!cfg.webhookUrl) return { ok: false, entries: null, reason: "missing_webhook" };
  try {
    const url = new URL(cfg.webhookUrl);
    url.searchParams.set("action", "guestbook");
    if (cfg.token) url.searchParams.set("token", cfg.token);
    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const raw = await res.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }
    const ok = Boolean(res.ok && body && body.ok === true && Array.isArray(body.entries));
    return {
      ok,
      entries: ok ? body.entries : [],
      reason: ok ? "" : (body && body.error) || "bad_response"
    };
  } catch {
    return { ok: false, entries: null, reason: "network_error" };
  }
}

async function refreshGuestbookFromSheet() {
  const cfg = window.WEDDING_SHEET || {};
  if (!cfg.webhookUrl) return;
  const res = await fetchGuestbookFromSheet();
  if (!res.ok || !Array.isArray(res.entries)) return;
  const msgs = sheetRowsToMessages(res.entries);
  storeMessages(msgs.slice(0, 40));
  renderChatFromMessages(msgs);
}

async function initGuestbookDisplay() {
  const cfg = window.WEDDING_SHEET || {};
  if (cfg.webhookUrl) {
    const res = await fetchGuestbookFromSheet();
    if (res.ok && Array.isArray(res.entries) && res.entries.length) {
      const msgs = sheetRowsToMessages(res.entries);
      storeMessages(msgs.slice(0, 40));
      renderChatFromMessages(msgs);
      return;
    }
    if (res.ok && (!res.entries || !res.entries.length)) {
      renderChatFromMessages([]);
      return;
    }
    const local = loadMessages();
    if (local.length) {
      renderChatFromMessages(local);
      return;
    }
    renderChatFromMessages([]);
    return;
  }
  if (!loadMessages().length) seedMessagesIfEmpty();
  renderMessages();
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

async function sendToSheet(payload) {
  const cfg = window.WEDDING_SHEET || {};
  if (!cfg.webhookUrl) return { ok: false, reason: "missing_webhook" };
  const envelope = {
    token: cfg.token || "",
    submittedAt: new Date().toISOString(),
    ...payload
  };
  try {
    const res = await fetch(cfg.webhookUrl, {
      method: "POST",
      // Dung form-urlencoded de tranh CORS preflight voi Apps Script
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      // Chi gui payload= (JSON) — tranh body dang payload&type&... lam server parse sai
      body: new URLSearchParams({
        payload: JSON.stringify(envelope)
      }).toString(),
      redirect: "follow",
      cache: "no-store",
      keepalive: true
    });

    const raw = await res.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }
    const bodyOk = body && typeof body.ok === "boolean" ? body.ok : (typeof raw === "string" && raw.includes("\"ok\":true"));
    return { ok: Boolean(res.ok && bodyOk), reason: body && body.error ? body.error : (bodyOk ? "" : "unknown_response") };
  } catch {
    // fallback gui text/plain
    try {
      const res2 = await fetch(cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(envelope),
        keepalive: true
      });
      const raw2 = await res2.text();
      const ok2 = raw2.includes("\"ok\":true");
      return { ok: Boolean(res2.ok && ok2), reason: ok2 ? "" : "fallback_failed" };
    } catch {
      // fallback cuoi: sendBeacon (fire-and-forget)
      try {
        const body = new URLSearchParams({
          payload: JSON.stringify(envelope)
        }).toString();
        const sent = navigator.sendBeacon(cfg.webhookUrl, new Blob([body], { type: "application/x-www-form-urlencoded;charset=UTF-8" }));
        return { ok: Boolean(sent), reason: sent ? "" : "network_error" };
      } catch {
        return { ok: false, reason: "network_error" };
      }
    }
  }
}

function loadSheetQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSheetQueue(items) {
  localStorage.setItem(STORAGE_SHEET_QUEUE, JSON.stringify(items.slice(0, 150)));
}

function enqueueSheetPayload(payload) {
  const queue = loadSheetQueue();
  queue.push({ ...payload, queuedAt: Date.now() });
  saveSheetQueue(queue);
  setSyncStatus(`Chờ đồng bộ ${queue.length} mục`, "warn");
}

async function flushSheetQueue() {
  const queue = loadSheetQueue();
  if (!queue.length) {
    setSyncStatus("Đồng bộ datasheet thành công", "ok");
    return;
  }

  setSyncStatus(`Đang đồng bộ ${queue.length} mục...`, "warn");
  const remain = [];
  for (const item of queue) {
    // eslint-disable-next-line no-await-in-loop
    const result = await sendToSheet(item);
    if (!result.ok) remain.push(item);
  }
  saveSheetQueue(remain);
  if (remain.length) {
    setSyncStatus(`Chờ đồng bộ ${remain.length} mục`, "warn");
  } else {
    setSyncStatus("Đồng bộ datasheet thành công", "ok");
    await refreshGuestbookFromSheet();
  }
}

setInterval(() => {
  if (navigator.onLine && loadSheetQueue().length > 0) {
    flushSheetQueue();
  }
}, 15000);

function submitSheetWithQueue(payload, successMsg) {
  sendToSheet(payload).then(async result => {
    if (!result.ok) {
      enqueueSheetPayload(payload);
      showToast(`Đã lưu cục bộ (${result.reason || "pending"}), sẽ tự đồng bộ datasheet`);
    } else {
      setSyncStatus(successMsg, "ok");
      if (loadSheetQueue().length > 0) {
        await flushSheetQueue();
      }
      if (payload.type === "guestbook") {
        await refreshGuestbookFromSheet();
      }
    }
  });
}

function initPetals() {
  const canvas = document.getElementById("petal-canvas");
  const ctx = canvas.getContext("2d");

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const MAX_PETALS = 12;
  const MAX_TOTAL = 24;
  const SPAWN_INTERVAL = 420;

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

window.addEventListener("load", async () => {
  applyTextContent();
  applyImageContent();
  applyAssetContent();
  applyFeatureFlags();
  buildCalendar();
  // Warm-up audio to load nhanh hơn cho lần mở thiệp sau
  try {
    bgAudio.load();
  } catch {}
  // preload ảnh quan trọng trước khi mở thiệp để tránh giật/lag khi lướt
  try {
    await preloadCriticalImages();
  } catch {}

  hidePreloader();
  initReveal();
  initAlbumModal();
  // petals để sau khi đã preload xong (đỡ giật lúc mới vào)
  initPetals();
  initGift();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  void initGuestbookDisplay();
  const cfg = window.WEDDING_SHEET || {};
  if (!cfg.webhookUrl) {
    setSyncStatus("Chưa cấu hình webhook datasheet", "err");
  } else {
    setSyncStatus("Sẵn sàng đồng bộ datasheet", "ok");
    flushSheetQueue();
  }
});

window.addEventListener("online", () => {
  flushSheetQueue();
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
  showToast("Cảm ơn bạn đã gửi lời chúc");

  submitSheetWithQueue({
    type: "guestbook",
    name,
    message
  }, "Đã gửi lời chúc lên datasheet");
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
  showToast("Đã ghi nhận xác nhận tham dự");

  submitSheetWithQueue({
    type: "rsvp",
    name,
    guests: Number(count)
  }, "Đã gửi RSVP lên datasheet");
});

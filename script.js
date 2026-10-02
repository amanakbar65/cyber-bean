(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const money = (n) => "$" + n.toFixed(2);
  const pad = (n) => String(n).padStart(2, "0");
  const clock = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
   * Menu
   * ------------------------------------------------------------------ */
  const MENU = [
    { id: "neon-espresso", cat: "espresso", name: "Neon Espresso", price: 3.5,
      desc: "Double ristretto of our house blend. Syrupy, bright, gone in three sips.",
      spec: "18 g → 27 g · 24 s · 93 °C", tags: ["hot"] },
    { id: "chrome-cortado", cat: "espresso", name: "Chrome Cortado", price: 4.5,
      desc: "Equal parts espresso and steamed whole milk, served in a 4.5 oz glass.",
      spec: "18 g → 36 g + 60 ml milk", tags: ["hot"] },
    { id: "synthwave-latte", cat: "espresso", name: "Synthwave Latte", price: 6,
      desc: "Double shot, oat milk and a ribbon of purple ube. Tastes like vanilla and toasted rice.",
      spec: "18 g → 36 g · 10 oz oat", tags: ["hot", "iced", "new"] },

    { id: "glitch-cold-brew", cat: "cold", name: "Glitch Cold Brew", price: 5.25,
      desc: "Colombia Huila steeped slow in the fridge. Cocoa, red apple, no bitterness.",
      spec: "1:8 ratio · 18 h at 4 °C", tags: ["iced"] },
    { id: "nitro-night", cat: "cold", name: "Nitro Night", price: 6,
      desc: "Our cold brew on a nitrogen tap. Poured like a stout with a thick, creamy head.",
      spec: "Nitro tap · 30 psi", tags: ["iced"] },
    { id: "espresso-tonic", cat: "cold", name: "Espresso Tonic", price: 5.75,
      desc: "Ethiopian espresso floated over yuzu tonic and ice. Sharp and floral.",
      spec: "18 g → 36 g · 150 ml tonic", tags: ["iced"] },

    { id: "kernel-panic", cat: "signature", name: "Kernel Panic", price: 7,
      desc: "Triple shot, 70% dark chocolate and salted cream. For the 3 AM deploy.",
      spec: "3 shots · 189 mg caffeine", tags: ["hot", "iced"] },
    { id: "overclock", cat: "signature", name: "Overclock", price: 5.5,
      desc: "A quad-shot Sumatra americano. Cedar, clove and a very long night ahead.",
      spec: "4 shots · 252 mg caffeine", tags: ["hot", "iced"] },
    { id: "ghost-matcha", cat: "signature", name: "Ghost Matcha", price: 6.5,
      desc: "Ceremonial Uji matcha whisked with coconut milk and black sesame.",
      spec: "4 g matcha · 80 °C water", tags: ["hot", "iced", "new"] },

    { id: "circuit-croissant", cat: "bites", name: "Circuit Croissant", price: 4.25,
      desc: "Butter croissant with 27 laminated layers, finished with cardamom sugar.",
      spec: "Baked daily at 23:00", tags: [] },
    { id: "byte-bomboloni", cat: "bites", name: "Byte Bomboloni", price: 3.75,
      desc: "A small Italian doughnut filled to order with espresso custard.",
      spec: "Filled to order", tags: ["new"] },
    { id: "midnight-onigiri", cat: "bites", name: "Midnight Onigiri", price: 5.5,
      desc: "Miso-glazed salmon rice ball wrapped in crisp nori. Two per order.",
      spec: "Made fresh every 2 h", tags: [] },
  ];

  const menuGrid = $("#menuGrid");
  const tabs = $$("#menuTabs [role=tab]");

  function renderMenu(cat) {
    const items = cat === "all" ? MENU : MENU.filter((m) => m.cat === cat);
    menuGrid.innerHTML = items.map((m, i) => `
      <article class="item" style="animation-delay:${i * 35}ms">
        <div class="item__top">
          <h3>${m.name}</h3>
          <span class="item__price">${money(m.price)}</span>
        </div>
        <div style="display:grid;gap:.6rem;align-content:start">
          <p class="item__desc">${m.desc}</p>
          <p class="item__spec">${m.spec}</p>
        </div>
        <div class="item__foot">
          <div class="tags">${m.tags.map((t) => `<span class="tag tag--${t}">${t}</span>`).join("")}</div>
          <button class="add-btn" type="button" data-add="${m.id}" aria-label="Add ${m.name} to order">+</button>
        </div>
      </article>`).join("");
  }

  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    renderMenu(tab.dataset.cat);
  }

  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  menuGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const m = MENU.find((x) => x.id === btn.dataset.add);
    addToCart({ id: m.id, name: m.name, meta: m.spec, price: m.price });
    btn.classList.add("is-added");
    btn.textContent = "✓";
    setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = "+"; }, 900);
  });

  renderMenu("all");

  /* ------------------------------------------------------------------
   * Brew Lab
   * ------------------------------------------------------------------ */
  const LAB = {
    base: { espresso: 4, coldbrew: 5, matcha: 5.25 },
    size: { S: -0.5, M: 0, L: 0.75 },
    oz: { S: 8, M: 12, L: 16 },
    milk: { none: 0, whole: 0, oat: 0.75, coconut: 0.75 },
    milkKcalPerOz: { none: 0, whole: 18, oat: 15, coconut: 6 },
    milkName: { none: "", whole: "", oat: "Oat", coconut: "Coconut" },
    milkColor: { whole: "#f1e6d6", oat: "#e8d3ab", coconut: "#f7f4ef" },
    syrupName: { none: "", vanilla: "Vanilla", sesame: "Black Sesame", yuzu: "Yuzu" },
    syrupLabel: { vanilla: "neon vanilla", sesame: "black sesame", yuzu: "yuzu" },
    syrupColor: { vanilla: "#ff6fb8", sesame: "#34303d", yuzu: "#ffd84a" },
    baseColor: { espresso: "linear-gradient(#5a2d17, #2a130a)", coldbrew: "linear-gradient(#6b3718, #3c1c0c)", matcha: "linear-gradient(#8fd068, #5a9d3c)" },
    coldBrewCaf: { S: 150, M: 200, L: 260 },
    matchaCaf: { S: 50, M: 70, L: 90 },
    shotWord: ["Double", "Triple", "Quad", "Five-shot"],
    extraShotPrice: 1,
    maxExtra: 3,
  };

  const labForm = $("#labForm");
  const shotsOut = $("#shotsOut");
  const shotsUp = $("#shotsUp");
  const shotsDown = $("#shotsDown");
  let extraShots = 0;

  function readLab() {
    const fd = new FormData(labForm);
    return {
      base: fd.get("base"),
      size: fd.get("size"),
      milk: fd.get("milk"),
      syrup: fd.get("syrup"),
      temp: fd.get("temp"),
      extra: extraShots,
    };
  }

  function computeBuild(b) {
    const iced = b.temp === "iced";
    const oz = LAB.oz[b.size];
    const hasMilk = b.milk !== "none";
    const hasSyrup = b.syrup !== "none";

    // Price
    const price = LAB.base[b.base] + LAB.size[b.size] + LAB.milk[b.milk]
      + (hasSyrup ? 0.5 : 0) + b.extra * LAB.extraShotPrice;

    // Caffeine: 63 mg per espresso shot
    let caf = b.extra * 63;
    if (b.base === "espresso") caf += 126;
    if (b.base === "coldbrew") caf += LAB.coldBrewCaf[b.size];
    if (b.base === "matcha") caf += LAB.matchaCaf[b.size];

    // Volumes (oz) for the glass and energy estimate
    const shotOz = (b.base === "espresso" ? 2 : 0) + b.extra;
    let milkOz = 0;
    if (hasMilk) {
      if (b.base === "espresso") milkOz = Math.max(oz - shotOz, 1);
      else if (b.base === "coldbrew") milkOz = 3;
      else milkOz = oz - 2;
    }
    if (iced) milkOz *= 0.75; // ice takes up room
    let kcal = milkOz * LAB.milkKcalPerOz[b.milk]
      + (hasSyrup ? 60 * (oz / 12) : 0)
      + (b.base === "matcha" ? 10 : 4);

    // Name
    let core;
    if (b.base === "espresso") {
      if (hasMilk) core = b.size === "S" && !iced ? "Flat White" : "Latte";
      else core = iced ? "Americano" : `${LAB.shotWord[b.extra]} Espresso`;
    } else if (b.base === "coldbrew") {
      core = hasMilk ? "Cold Brew Latte" : "Cold Brew";
    } else {
      core = hasMilk ? "Matcha Latte" : "Matcha";
      if (b.extra) core = "Dirty " + core;
    }
    const nameParts = [iced && b.base !== "coldbrew" ? "Iced" : "", LAB.milkName[b.milk], LAB.syrupName[b.syrup], core];
    let name = nameParts.filter(Boolean).join(" ");
    const totalShots = (b.base === "espresso" ? 2 : 0) + b.extra;
    if (totalShots >= 4) name += " · Overclocked";

    // Spec line
    const baseLabel = { espresso: "Double espresso", coldbrew: "18 h cold brew", matcha: "Uji matcha" }[b.base];
    const spec = [
      baseLabel + (b.extra ? ` + ${b.extra} shot${b.extra > 1 ? "s" : ""}` : ""),
      hasMilk ? `${b.milk} milk` : "no milk",
      hasSyrup ? LAB.syrupLabel[b.syrup] : "no syrup",
      iced ? "iced" : "hot",
      `${oz} oz`,
    ].join(" · ");

    // Glass layers, bottom to top, in oz
    const layers = [];
    const coffee = LAB.baseColor.espresso;
    if (hasSyrup) layers.push({ oz: 0.6, bg: LAB.syrupColor[b.syrup] });
    if (b.base === "espresso") {
      const body = hasMilk ? shotOz : (iced ? oz * 0.8 : shotOz);
      if (iced && hasMilk) {
        layers.push({ oz: milkOz, bg: LAB.milkColor[b.milk] }, { oz: body, bg: coffee });
      } else {
        layers.push({ oz: body, bg: coffee });
        if (hasMilk) layers.push({ oz: milkOz - 1, bg: LAB.milkColor[b.milk] }, { oz: 1, foam: true });
      }
    } else if (b.base === "coldbrew") {
      layers.push({ oz: oz * 0.8 - milkOz - b.extra, bg: LAB.baseColor.coldbrew });
      if (hasMilk) layers.push({ oz: milkOz, bg: LAB.milkColor[b.milk] });
      if (b.extra) layers.push({ oz: b.extra, bg: coffee });
    } else {
      const matchaOz = hasMilk ? 2 : oz * (iced ? 0.8 : 0.9);
      if (iced && hasMilk) {
        layers.push({ oz: milkOz, bg: LAB.milkColor[b.milk] }, { oz: matchaOz, bg: LAB.baseColor.matcha });
      } else {
        layers.push({ oz: matchaOz, bg: LAB.baseColor.matcha });
        if (hasMilk) layers.push({ oz: milkOz - 1, bg: LAB.milkColor[b.milk] }, { oz: 1, foam: true });
      }
      if (b.extra) layers.push({ oz: b.extra, bg: coffee });
    }

    return { price, caf, kcal: Math.round(kcal / 5) * 5, name, spec, layers, oz, iced };
  }

  const glass = $("#glass");
  const glassFill = $("#glassFill");
  const glassIce = $("#glassIce");
  let currentBuild = null;

  function updateLab() {
    const b = readLab();

    // Cold brew is only served iced
    const hot = $("#temp-hot");
    hot.disabled = b.base === "coldbrew";
    if (hot.disabled && b.temp === "hot") {
      $("#temp-iced").checked = true;
      b.temp = "iced";
    }

    shotsOut.textContent = b.extra;
    shotsDown.disabled = b.extra <= 0;
    shotsUp.disabled = b.extra >= LAB.maxExtra;
    $("#shotsHint").textContent = b.base === "espresso"
      ? "Double shot included. Each extra shot adds 63 mg of caffeine and $1.00."
      : "Add espresso shots on top. Each adds 63 mg of caffeine and $1.00.";

    const r = computeBuild(b);
    currentBuild = { ...b, ...r };

    $("#buildName").textContent = r.name;
    $("#buildSpec").textContent = r.spec;
    $("#buildCaf").textContent = `${r.caf} mg`;
    $("#buildCal").textContent = `${r.kcal} kcal`;
    $("#buildPrice").textContent = money(r.price);

    glass.dataset.size = b.size;
    glassIce.style.opacity = r.iced ? 1 : 0;
    const total = r.layers.reduce((s, l) => s + Math.max(l.oz, 0), 0);
    const fillPct = Math.min(total / r.oz, 1) * 100;
    glassFill.style.height = `${fillPct * 0.92}%`;
    glassFill.innerHTML = r.layers
      .filter((l) => l.oz > 0)
      .map((l) => `<div class="${l.foam ? "layer--foam" : ""}" style="flex-basis:${(l.oz / total) * 100}%;${l.bg ? `background:${l.bg}` : ""}"></div>`)
      .join("");
  }

  labForm.addEventListener("change", updateLab);
  shotsUp.addEventListener("click", () => { extraShots = Math.min(extraShots + 1, LAB.maxExtra); updateLab(); });
  shotsDown.addEventListener("click", () => { extraShots = Math.max(extraShots - 1, 0); updateLab(); });

  $("#buildAdd").addEventListener("click", () => {
    const b = currentBuild;
    const id = `lab:${b.base}:${b.size}:${b.milk}:${b.syrup}:${b.temp}:${b.extra}`;
    addToCart({ id, name: b.name, meta: b.spec, price: b.price });
  });

  updateLab();

  /* ------------------------------------------------------------------
   * Cart
   * ------------------------------------------------------------------ */
  const cart = new Map();
  const cartEl = $("#cart");
  const scrim = $("#scrim");
  const cartCount = $("#cartCount");
  const cartList = $("#cartList");
  const cartEmpty = $("#cartEmpty");
  const checkoutForm = $("#checkoutForm");
  const confirmEl = $("#confirm");
  const cartBody = $("#cartBody");
  const TAX = 0.08;
  let lastFocus = null;
  let progressTimers = [];

  function addToCart(item) {
    const existing = cart.get(item.id);
    if (existing) existing.qty += 1;
    else cart.set(item.id, { ...item, qty: 1 });
    renderCart();
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth;
    cartCount.classList.add("bump");
    toast(`Added ${item.name}`);
  }

  function renderCart() {
    const items = [...cart.values()];
    const count = items.reduce((s, i) => s + i.qty, 0);
    const sub = items.reduce((s, i) => s + i.qty * i.price, 0);

    cartCount.textContent = count;
    cartCount.classList.toggle("has-items", count > 0);
    $("#cartOpen").setAttribute("aria-label", `Open order, ${count} item${count === 1 ? "" : "s"}`);

    cartEmpty.hidden = count > 0;
    cartList.innerHTML = items.map((i) => `
      <li>
        <span class="cart__name">${i.name}</span>
        <span class="cart__line">${money(i.price * i.qty)}</span>
        <span class="cart__meta">${i.meta}</span>
        <span class="qty">
          <button type="button" data-dec="${i.id}" aria-label="Remove one ${i.name}">−</button>
          <span>${i.qty}</span>
          <button type="button" data-inc="${i.id}" aria-label="Add one ${i.name}">+</button>
        </span>
      </li>`).join("");

    $("#cartSub").textContent = money(sub);
    $("#cartTax").textContent = money(sub * TAX);
    $("#cartTotal").textContent = money(sub * (1 + TAX));
    $("#checkoutBtn").disabled = count === 0;
  }

  cartList.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) cart.get(inc.dataset.inc).qty += 1;
    if (dec) {
      const it = cart.get(dec.dataset.dec);
      it.qty -= 1;
      if (it.qty <= 0) cart.delete(dec.dataset.dec);
    }
    if (inc || dec) renderCart();
  });

  function openCart() {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    cartEl.hidden = false;
    document.body.style.overflow = "hidden";
    $("#cartClose").focus();
  }

  function closeCart() {
    scrim.hidden = true;
    cartEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  $("#cartOpen").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  scrim.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (cartEl.hidden) return;
    if (e.key === "Escape") closeCart();
    if (e.key === "Tab") {
      const focusable = $$("button:not(:disabled), input, select", cartEl).filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = $("#pickupName");
    const err = $("#checkoutError");
    const name = nameInput.value.trim();

    if (!cart.size) { err.textContent = "Add at least one item before placing the order."; return; }
    if (!name) {
      err.textContent = "Enter a name so the barista can call your order.";
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return;
    }
    err.textContent = "";
    nameInput.removeAttribute("aria-invalid");

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const choice = $("#pickupTime").value;
    const waitMins = choice === "asap" ? Number($("#tWait").textContent) || 6 : Number(choice);
    const code = "CB-" + Math.random().toString(16).slice(2, 6).toUpperCase();

    $("#confirmCode").textContent = code;
    $("#confirmMsg").textContent =
      `Thanks, ${name}. Your order will be ready at ${clock(nowMins + waitMins)}. Collect it from the counter under the pink sign and give the barista your code.`;

    checkoutForm.hidden = true;
    cartBody.hidden = true;
    confirmEl.hidden = false;
    runProgress(waitMins);
    $("#newOrder").focus();
  });

  function runProgress(waitMins) {
    progressTimers.forEach(clearTimeout);
    progressTimers = [];
    const steps = $$("#progress li");
    const setStep = (n) => steps.forEach((li, i) => {
      li.classList.toggle("done", i < n);
      li.classList.toggle("active", i === n);
    });
    const waitMs = waitMins * 60000;
    // Grinding and pulling start a few minutes before pickup (immediately for ASAP)
    const grindAt = Math.max(waitMs - 5 * 60000, 2000);
    const pullAt = Math.max(waitMs - 3 * 60000, 5000);
    setStep(0);
    progressTimers.push(
      setTimeout(() => setStep(1), grindAt),
      setTimeout(() => setStep(2), pullAt),
      setTimeout(() => setStep(3), waitMs),
    );
  }

  $("#newOrder").addEventListener("click", () => {
    progressTimers.forEach(clearTimeout);
    cart.clear();
    renderCart();
    checkoutForm.reset();
    confirmEl.hidden = true;
    checkoutForm.hidden = false;
    cartBody.hidden = false;
    closeCart();
  });

  renderCart();

  /* ------------------------------------------------------------------
   * Toast
   * ------------------------------------------------------------------ */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ------------------------------------------------------------------
   * Hours and open status (viewer's local time)
   * ------------------------------------------------------------------ */
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // [open, close] in minutes after midnight; close > 1440 runs past midnight
  const HOURS = [
    [9 * 60, 22 * 60],  // Sun
    [7 * 60, 24 * 60],  // Mon
    [7 * 60, 24 * 60],  // Tue
    [7 * 60, 24 * 60],  // Wed
    [7 * 60, 24 * 60],  // Thu
    [7 * 60, 26 * 60],  // Fri
    [7 * 60, 26 * 60],  // Sat
  ];
  const ORDER = [1, 2, 3, 4, 5, 6, 0];

  function duration(m) {
    const h = Math.floor(m / 60);
    return h ? `${h} h ${m % 60} min` : `${m} min`;
  }

  function hoursStatus(date) {
    const d = date.getDay();
    const m = date.getHours() * 60 + date.getMinutes();
    const [open, close] = HOURS[d];
    const [, yClose] = HOURS[(d + 6) % 7];

    if (yClose > 1440 && m < yClose - 1440) return { open: true, closeAt: yClose - 1440, left: yClose - 1440 - m };
    if (m >= open && m < close) return { open: true, closeAt: close, left: close - m };
    if (m < open) return { open: false, opensAt: open, when: "today" };
    return { open: false, opensAt: HOURS[(d + 1) % 7][0], when: "tomorrow" };
  }

  function renderHours() {
    const now = new Date();
    const today = now.getDay();
    $("#hoursBody").innerHTML = ORDER.map((d) => `
      <tr class="${d === today ? "is-today" : ""}">
        <td>${DAYS[d]}</td>
        <td>${clock(HOURS[d][0])} – ${clock(HOURS[d][1])}</td>
      </tr>`).join("");

    const s = hoursStatus(now);
    const pill = $("#navStatus");
    pill.classList.toggle("is-open", s.open);
    pill.classList.toggle("is-closed", !s.open);
    pill.lastElementChild.textContent = s.open ? `Open · until ${clock(s.closeAt)}` : `Closed · opens ${clock(s.opensAt)}`;

    $("#visitStatus").innerHTML = s.open
      ? `<strong class="open">Open now.</strong> Closes at ${clock(s.closeAt)}, in ${duration(s.left)}.`
      : `<strong class="closed">Closed right now.</strong> Opens ${s.when} at ${clock(s.opensAt)}.`;
  }

  renderHours();
  setInterval(renderHours, 30000);

  /* ------------------------------------------------------------------
   * Espresso machine readout
   * ------------------------------------------------------------------ */
  const tBoiler = $("#tBoiler");
  const tBar = $("#tBar");
  const tShots = $("#tShots");
  const tQueue = $("#tQueue");
  const tWait = $("#tWait");
  const startHour = new Date().getHours();
  let shots = 180 + Math.max(startHour - 7, 0) * 26 + Math.floor(Math.random() * 20);
  let queue = 3;
  tShots.textContent = shots;

  function tick() {
    tBoiler.textContent = (93 + Math.random() * 0.4).toFixed(1);
    tBar.textContent = (8.9 + Math.random() * 0.2).toFixed(1);
    if (Math.random() < 0.35) shots += 1 + Math.floor(Math.random() * 2);
    if (Math.random() < 0.25) queue = Math.min(6, Math.max(1, queue + (Math.random() < 0.5 ? -1 : 1)));
    tShots.textContent = shots;
    tQueue.textContent = queue;
    tWait.textContent = queue * 2;
  }
  setInterval(tick, reducedMotion ? 5000 : 1600);

  /* ------------------------------------------------------------------
   * Newsletter
   * ------------------------------------------------------------------ */
  $("#joinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#joinEmail");
    const msg = $("#joinMsg");
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    msg.className = "join__msg " + (ok ? "ok" : "err");
    if (!ok) {
      input.setAttribute("aria-invalid", "true");
      msg.textContent = "That email address looks incomplete. Check it and try again.";
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    msg.textContent = `Subscribed ${input.value.trim()}. The next roast-day email goes out on Tuesday.`;
    input.value = "";
  });
})();

const IMG = "imgs/";
const SUITS = ["Spades", "Hearts", "Clubs", "Diamonds"];
const RANKS = [["Ace","Rare"],["2","Common"],["3","Common"],["4","Common"],["5","Common"],["6","Common"],["7","Common"],["8","Common"],["9","Common"],["10","Common"],["Jack","Uncommon"],["Queen","Uncommon"],["King","Uncommon"]];

const CARDS = [];
SUITS.forEach((s, si) => RANKS.forEach((r, ri) => CARDS.push({
  id: String(15209500000 + ri * 4 + si + 1), suit: si, rank: ri, q: r[1], name: r[0] + " of " + s
})));
CARDS.push({ id: "15209500053", suit: 4, rank: 13, q: "Epic", name: "Small Joker" });
CARDS.push({ id: "15209500054", suit: 4, rank: 14, q: "Legendary", name: "Big Joker" });

const KEY = "df_ahsarah_card_collection";
let state = { have: {}, sortBy: "suit", dir: 1, disp: "all" };
const RANK_SUIT = [3, 0, 2, 1]; // within a rank: Hearts, Diamonds, Clubs, Spades (SUITS index -> position)
const hasChrome = () => window.chrome && chrome.storage && chrome.storage.local;
const $ = id => document.getElementById(id);

async function load() {
  try { if (hasChrome()) { const r = await chrome.storage.local.get(KEY); if (r[KEY]) state = Object.assign(state, r[KEY]); return; } } catch (e) {}
  try { const v = localStorage.getItem(KEY); if (v) state = Object.assign(state, JSON.parse(v)); } catch (e) {}
}
function save() {
  try { if (hasChrome()) { chrome.storage.local.set({ [KEY]: state }); return; } } catch (e) {}
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

function updateStats() {
  const n = Object.keys(state.have).length, t = CARDS.length;
  $("count").textContent = n + "/" + t;
  $("pct").textContent = Math.round(n / t * 100) + "% collected";
  $("fill").style.width = (n / t * 100) + "%";
  document.querySelectorAll("#sort button").forEach(b => {
    const on = b.dataset.v === state.sortBy;
    b.classList.toggle("on", on);
    b.textContent = (b.dataset.v === "suit" ? "Suit" : "Rank") + " " + (on && state.dir < 0 ? "↓" : "↑");
  });
  document.querySelectorAll("#disp button").forEach(b => b.classList.toggle("on", b.dataset.v === state.disp));
}

function render() {
  const dir = state.dir;
  const cmp = state.sortBy === "rank"
    ? (a, b) => (a.rank - b.rank) || ((a.suit === 4 ? 0 : RANK_SUIT[a.suit]) - (b.suit === 4 ? 0 : RANK_SUIT[b.suit]))
    : (a, b) => (a.suit - b.suit) || (a.rank - b.rank);
  let list = CARDS.slice().sort((a, b) => dir * cmp(a, b));
  if (state.disp === "have") list = list.filter(c => state.have[c.id]);
  if (state.disp === "missing") list = list.filter(c => !state.have[c.id]);
  const g = $("grid"); g.innerHTML = "";
  if (!list.length) g.innerHTML = '<div class="empty">No cards to show.</div>';
  list.forEach(c => {
    const el = document.createElement("div");
    el.className = "card " + (state.have[c.id] ? "have" : "missing");
    el.style.setProperty("--q", "var(--" + c.q + ")");
    el.innerHTML = '<div class="strip"></div><div class="imgw"><img loading="lazy" alt="' + c.name + ' – Delta Force Ahsarah card" src="' + IMG + c.id + '.png" onerror="this.style.display=\'none\'"></div><div class="name">' + c.name + '</div><div class="tick">✓</div>';
    el.onclick = () => {
      if (state.have[c.id]) delete state.have[c.id]; else state.have[c.id] = 1;
      save();
      if (state.disp === "all") { el.classList.toggle("have"); el.classList.toggle("missing"); updateStats(); } // keeps translated text intact
      else render();
    };
    g.appendChild(el);
  });
  updateStats();
}

$("sort").onclick = e => {
  const v = e.target.dataset.v; if (!v) return;
  if (state.sortBy === v) state.dir = -state.dir; else { state.sortBy = v; state.dir = 1; }
  save(); render();
};
$("disp").onclick = e => { if (e.target.dataset.v) { state.disp = e.target.dataset.v; save(); render(); } };
const modal = $("modal");
$("trash").onclick = () => modal.classList.add("show");
$("no").onclick = () => modal.classList.remove("show");
modal.onclick = e => { if (e.target === modal) modal.classList.remove("show"); };
$("yes").onclick = () => { state.have = {}; save(); render(); modal.classList.remove("show"); };

/* Google Translate (native widget hidden, custom dropdown drives it) */
const langBtn = $("langBtn"), langMenu = $("langMenu"), langName = $("langName");
let combo = null;
function currentCode() {
  const m = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}
function buildLangMenu() {
  langMenu.innerHTML = "";
  const items = [["en", "English"]];
  Array.from(combo.options).forEach(o => { if (o.value && o.value !== "en") items.push([o.value, o.text]); });
  const cur = currentCode();
  items.forEach(([code, name]) => {
    const li = document.createElement("li");
    li.textContent = name; li.dataset.code = code; li.setAttribute("role", "option");
    if (code === cur) { li.classList.add("sel"); langName.textContent = name; }
    li.onclick = () => {
      combo.value = code === "en" && !Array.from(combo.options).some(o => o.value === "en") ? "" : code;
      combo.dispatchEvent(new Event("change"));
      langName.textContent = name;
      langMenu.querySelectorAll("li").forEach(x => x.classList.toggle("sel", x === li));
      closeLang();
    };
    langMenu.appendChild(li);
  });
}
function closeLang() { langMenu.classList.remove("show"); langBtn.setAttribute("aria-expanded", "false"); }
langBtn.onclick = e => {
  e.stopPropagation();
  const open = langMenu.classList.toggle("show");
  langBtn.setAttribute("aria-expanded", open);
  const sel = langMenu.querySelector(".sel"); if (open && sel) sel.scrollIntoView({ block: "center" });
};
document.addEventListener("click", closeLang);
window.googleTranslateElementInit = function () {
  new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "gt");
  let tries = 0;
  const t = setInterval(() => {
    combo = document.querySelector("#gt .goog-te-combo");
    if (combo && combo.options.length > 1) { clearInterval(t); buildLangMenu(); }
    else if (++tries > 60) clearInterval(t);
  }, 250);
};
const gs = document.createElement("script");
gs.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
gs.async = true;
document.head.appendChild(gs);

load().then(render);

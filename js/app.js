const IMG = "imgs/";
const SUITS = ["Spades", "Hearts", "Clubs", "Diamonds"];
const RANKS = [["Ace","Rare"],["2","Common"],["3","Common"],["4","Common"],["5","Common"],["6","Common"],["7","Common"],["8","Common"],["9","Common"],["10","Common"],["Jack","Uncommon"],["Queen","Uncommon"],["King","Uncommon"]];

const CARDS = [];
SUITS.forEach((s, si) => RANKS.forEach((r, ri) => CARDS.push({
  id: String(15209500000 + ri * 4 + si + 1), suit: si, rank: ri, q: r[1], name: r[0] + " of " + s
})));
CARDS.push({ id: "15209500053", suit: 4, rank: 0, q: "Epic", name: "Small Joker" });
CARDS.push({ id: "15209500054", suit: 4, rank: 1, q: "Legendary", name: "Big Joker" });

const KEY = "df_ahsarah_card_collection";
let state = { have: {}, sort: "up", disp: "all" };
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
  document.querySelectorAll("#sort button").forEach(b => b.classList.toggle("on", b.dataset.v === state.sort));
  document.querySelectorAll("#disp button").forEach(b => b.classList.toggle("on", b.dataset.v === state.disp));
}

function render() {
  const dir = state.sort === "up" ? 1 : -1;
  let list = CARDS.slice().sort((a, b) => dir * ((a.suit - b.suit) || (a.rank - b.rank)));
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

$("sort").onclick = e => { if (e.target.dataset.v) { state.sort = e.target.dataset.v; save(); render(); } };
$("disp").onclick = e => { if (e.target.dataset.v) { state.disp = e.target.dataset.v; save(); render(); } };
const modal = $("modal");
$("trash").onclick = () => modal.classList.add("show");
$("no").onclick = () => modal.classList.remove("show");
modal.onclick = e => { if (e.target === modal) modal.classList.remove("show"); };
$("yes").onclick = () => { state.have = {}; save(); render(); modal.classList.remove("show"); };

/* Google Translate */
window.googleTranslateElementInit = function () {
  new google.translate.TranslateElement({ pageLanguage: "en", layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, "gt");
};
const gs = document.createElement("script");
gs.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
gs.async = true;
document.head.appendChild(gs);

load().then(render);

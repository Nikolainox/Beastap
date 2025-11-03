// Eläinkunta v4.0 – bugfix + visuaaliset parannukset
const STORAGE_KEY = "animal-evolution-v4.0";

const weights    = { legs:1.2, push:1.0, pull:1.0, core:0.8 };
const loadFactors= { legs:2.0, push:1.6, pull:1.4, core:0.8 };
// Kynnysarvot (efektiiviset pisteet)
const thresholds = [0,100,250,500,900,1400,2000,2700,3500];

// Evoluutiopolut (aidompi suunta, emojit MVP:ssä)
const branches = {
  balanced: [
    {name:"Mato",emoji:"🪱"},{name:"Meduusa",emoji:"🪸"},{name:"Kala",emoji:"🐠"},
    {name:"Sammakko",emoji:"🐸"},{name:"Lisko",emoji:"🦎"},{name:"Lintu",emoji:"🐦"},
    {name:"Apina",emoji:"🐒"},{name:"Ihminen",emoji:"🧑"}
  ],
  legs: [
    {name:"Mato",emoji:"🪱"},{name:"Käärme",emoji:"🐍"},{name:"Lisko",emoji:"🦎"},
    {name:"Jänis",emoji:"🐇"},{name:"Kenguru",emoji:"🦘"},{name:"Norsu",emoji:"🐘"}
  ],
  push: [
    {name:"Mato",emoji:"🪱"},{name:"Rapu",emoji:"🦀"},{name:"Krokotiili",emoji:"🐊"},
    {name:"Karhu",emoji:"🐻"},{name:"Leijona",emoji:"🦁"}
  ],
  pull: [
    {name:"Mato",emoji:"🪱"},{name:"Kala",emoji:"🐟"},{name:"Apina",emoji:"🐒"},
    {name:"Gorilla",emoji:"🦍"},{name:"Ihminen",emoji:"🧑‍🦱"}
  ],
  core: [
    {name:"Mato",emoji:"🪱"},{name:"Meritähti",emoji:"🌟"},{name:"Kilpikonna",emoji:"🐢"},
    {name:"Delfiini",emoji:"🐬"},{name:"Valas",emoji:"🐋"}
  ]
};

// --------- State ---------
function defaultState(){
  return {
    totals:{legs:0,push:0,pull:0,core:0},
    last:{points:0, level:0, branch:"balanced"}
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultState();
    // Varmistetaan kentät
    return {
      totals: Object.assign({legs:0,push:0,pull:0,core:0}, parsed.totals||{}),
      last:   Object.assign({points:0, level:0, branch:"balanced"}, parsed.last||{})
    };
  }catch{
    return defaultState();
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
let state = loadState();

// --------- DOM ---------
const $ = (id)=>document.getElementById(id);
const els = {
  totals:{
    legs:$("legs-total"), push:$("push-total"), pull:$("pull-total"), core:$("core-total"), all:$("all-total")
  },
  inputs:{
    legs:$("legs"), push:$("push"), pull:$("pull"), core:$("core")
  },
  addBtn:$("add-reps"), resetBtn:$("reset"),
  evoProgress:$("evo-progress"), evoText:$("evo-level-text"),
  branchText:$("branch-text"),
  avatarEmoji:$("avatar-emoji"), avatarName:$("avatar-name"),
  nextText:$("next-text"),
  timeline:$("timeline-bar"),
  pi:{
    legs:$("pi-legs"), push:$("pi-push"), pull:$("pi-pull"), core:$("pi-core"),
    legsBar:$("pi-legs-bar"), pushBar:$("pi-push-bar"), pullBar:$("pi-pull-bar"), coreBar:$("pi-core-bar")
  },
  toast: $("evolve-toast"),
  toastEmoji: $("toast-emoji"),
  toastText: $("toast-text")
};

// --------- Logic helpers ---------
function toPoints(t){
  return t.legs*weights.legs + t.push*weights.push + t.pull*weights.pull + t.core*weights.core;
}
function pickBranch(t){
  const pairs = Object.entries(t).sort((a,b)=>b[1]-a[1]); // suurimmasta pienimpään
  if (pairs.length<2 || pairs[0][1]===0) return "balanced";
  const diff = (pairs[0][1]-pairs[1][1]) / (pairs[0][1] || 1);
  return diff < 0.15 ? "balanced" : pairs[0][0]; // jos tasainen -> balanced
}
function pickLevel(points){
  let lvl = 0;
  for (let i=0;i<thresholds.length;i++){
    if(points>=thresholds[i]) lvl = i;
  }
  const curr = thresholds[lvl];
  const next = thresholds[Math.min(lvl+1, thresholds.length-1)];
  const denom = Math.max(1, next - curr); // suoja nollajaolta
  const pct = Math.max(0, Math.min(1, (points - curr) / denom));
  return {lvl, pct};
}
function calcPI(t, lvl){
  const out = {};
  for(const k of ["legs","push","pull","core"]){
    const base = ((lvl+1)*(t[k]/100)*loadFactors[k]);
    out[k] = Number.isFinite(base) ? Number(base.toFixed(1)) : 0;
  }
  return out;
}
function setTheme(branch){
  const b = document.body;
  b.classList.remove("theme-balanced","theme-legs","theme-push","theme-pull","theme-core");
  const key = ["balanced","legs","push","pull","core"].includes(branch) ? branch : "balanced";
  b.classList.add(`theme-${key}`);
}
function showToast(emoji, text){
  els.toastEmoji.textContent = emoji;
  els.toastText.textContent  = text;
  els.toast.hidden = false;
  setTimeout(()=>{ els.toast.hidden = true; }, 1800);
}

// --------- Render ---------
let firstRender = true;
function render(){
  // Totals
  const t = state.totals;
  els.totals.legs.textContent = t.legs;
  els.totals.push.textContent = t.push;
  els.totals.pull.textContent = t.pull;
  els.totals.core.textContent = t.core;
  els.totals.all.textContent  = t.legs + t.push + t.pull + t.core;

  // Points -> branch, level
  const points = toPoints(t);
  const br = pickBranch(t);
  const {lvl, pct} = pickLevel(points);
  const seq = branches[br] || branches.balanced;
  const currStage = seq[Math.min(lvl, seq.length-1)];
  const nextStage = seq[Math.min(lvl+1, seq.length-1)];

  // UI: avatar & header
  els.avatarEmoji.textContent = currStage.emoji;
  els.avatarEmoji.classList.remove("bounce");
  void els.avatarEmoji.offsetWidth; // reflow for animation reset
  els.avatarEmoji.classList.add("bounce");

  els.avatarName.textContent   = currStage.name;
  els.branchText.textContent   = `Polku: ${br[0].toUpperCase()}${br.slice(1)}`;
  els.evoProgress.value        = Math.round(pct*100);
  els.evoText.textContent      = `Taso ${lvl} • ${Math.round(pct*100)}%`;
  els.nextText.textContent     = `Seuraavaksi: ${nextStage.emoji} ${nextStage.name}`;

  // Theme
  setTheme(br);

  // Timeline badges
  els.timeline.innerHTML = "";
  seq.forEach((st, i)=>{
    const span = document.createElement("div");
    span.className = "badge" + (i<=lvl?" reached":"") + (i===lvl?" current":"");
    span.title = st.name;
    span.setAttribute("aria-label", st.name);
    span.textContent = st.emoji;
    els.timeline.appendChild(span);
  });

  // PI
  const pi = calcPI(t, lvl);
  const piMax = Math.max(1, ...Object.values(pi)); // asteikko palkkeihin
  const setPI = (key, val, barEl)=>{
    const pct = Math.max(0, Math.min(100, Math.round((val/piMax)*100)));
    els.pi[key].textContent = val.toFixed ? val.toFixed(1) : String(val);
    barEl.style.width = pct + "%";
  };
  setPI("legs", pi.legs, els.pi.legsBar);
  setPI("push", pi.push, els.pi.pushBar);
  setPI("pull", pi.pull, els.pi.pullBar);
  setPI("core", pi.core, els.pi.coreBar);

  // Evolution toast vain kun taso kasvaa tai polku vaihtuu
  if (!firstRender && (lvl > state.last.level || br !== state.last.branch)) {
    showToast(currStage.emoji, `Olet nyt ${currStage.name}`);
  }
  firstRender = false;

  // Päivitä last ja tallenna
  state.last.points = points;
  state.last.level  = lvl;
  state.last.branch = br;
  saveState();
}

// --------- Events ---------
function parseIntSafe(v){
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
els.addBtn.addEventListener("click", ()=>{
  let updated = false;
  for (const key of ["legs","push","pull","core"]){
    const inc = parseIntSafe(els.inputs[key].value);
    if (inc>0){ state.totals[key] += inc; updated = true; }
    els.inputs[key].value = "";
  }
  if (updated) render();
});
els.resetBtn.addEventListener("click", ()=>{
  if (confirm("Nollataanko kaikki tiedot?")){
    state = defaultState();
    render();
  }
});

// Ensimmäinen render
render();

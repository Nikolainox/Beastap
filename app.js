// Eläinkunta v5.0 – visuaali + laajemmat polut + presetit + historia + export
const STORAGE_KEY = "animal-evolution-v5.0";
const LEGACY_KEYS  = ["animal-evolution-v4.0","animal-evolution-v4","animal-evolution-v3","animal-evolution-state-v1","animal-evolution-v3.1"];

// Painot ja PI-kertoimet
const weights     = { legs:1.2, push:1.0, pull:1.0, core:0.8 };
const loadFactors = { legs:2.0, push:1.6, pull:1.4, core:0.8 };

// Kynnykset (riittää ~16 tasolle)
const thresholds = [0,100,250,500,900,1400,2000,2700,3500,4400,5400,6500,7700,9000,10400,11900,13500,15200];

// Laajennetut polut (emoji-MVP). Nimet + emojit – pidetty suurin piirtein luonnollisina.
const branches = {
  balanced: [
    {name:"Mato",emoji:"🪱"},{name:"Meduusa",emoji:"🪸"},{name:"Kala",emoji:"🐠"},
    {name:"Sammakko",emoji:"🐸"},{name:"Lisko",emoji:"🦎"},{name:"Lintu",emoji:"🐦"},
    {name:"Pieni Nisäkäs",emoji:"🐁"},{name:"Kissaeläin",emoji:"🐈"},{name:"Apina",emoji:"🐒"},
    {name:"Ihminen",emoji:"🧑"},{name:"Taitava Ihminen",emoji:"🧑‍🎓"},{name:"Atleetti",emoji:"🏃"}
  ],
  legs: [
    {name:"Mato",emoji:"🪱"},{name:"Käärme",emoji:"🐍"},{name:"Lisko",emoji:"🦎"},
    {name:"Jänis",emoji:"🐇"},{name:"Kenguru",emoji:"🦘"},{name:"Gepardi",emoji:"🐆"},
    {name:"Strutsi",emoji:"🦤"},{name:"Norsu",emoji:"🐘"},{name:"Sarvikuono",emoji:"🦏"},
    {name:"Villit Sorkkaeläimet",emoji:"🦌"}
  ],
  push: [
    {name:"Mato",emoji:"🪱"},{name:"Rapu",emoji:"🦀"},{name:"Krokotiili",emoji:"🐊"},
    {name:"Karhu",emoji:"🐻"},{name:"Härkä",emoji:"🐂"},{name:"Leijona",emoji:"🦁"},
    {name:"Kotka (työntövoima)",emoji:"🦅"},{name:"Jääkarhu",emoji:"🐻‍❄️"}
  ],
  pull: [
    {name:"Mato",emoji:"🪱"},{name:"Kala",emoji:"🐟"},{name:"Apina",emoji:"🐒"},
    {name:"Gorilla",emoji:"🦍"},{name:"OrankI",emoji:"🦧"},{name:"Vuorikiipeilijä",emoji:"🧗"},
    {name:"Ihminen",emoji:"🧑‍🦱"}
  ],
  core: [
    {name:"Mato",emoji:"🪱"},{name:"Meritähti",emoji:"🌟"},{name:"Kilpikonna",emoji:"🐢"},
    {name:"Merilehmä",emoji:"🫎"}, // humoristinen vivahde, voi vaihtaa manaatiksi kun saat emojin
    {name:"Delfiini",emoji:"🐬"},{name:"Valas",emoji:"🐋"},{name:"Merikapteeni",emoji:"🧭"}
  ]
};

// ---------- State & migraatio ----------
function defaultState(){
  return {
    totals:{legs:0,push:0,pull:0,core:0},
    last:{points:0,level:0,branch:"balanced",updatedAt:null},
    history:[] // {ts, legs, push, pull, core}
  };
}
function migrateLegacy(base){
  const s = {...base};
  for(const key of LEGACY_KEYS){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) continue;
      const old = JSON.parse(raw);
      if(old?.totals){
        for(const k of ["legs","push","pull","core"]){
          s.totals[k] += Number(old.totals[k]||0);
        }
      }
    }catch{}
  }
  return s;
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      // uusi käyttäjä – koeta migroida
      const migrated = migrateLegacy(defaultState());
      return migrated;
    }
    const parsed = JSON.parse(raw);
    return {
      totals:Object.assign({legs:0,push:0,pull:0,core:0}, parsed.totals||{}),
      last:Object.assign({points:0,level:0,branch:"balanced",updatedAt:null}, parsed.last||{}),
      history:Array.isArray(parsed.history)?parsed.history:[],
    };
  }catch{
    return defaultState();
  }
}
let state = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ---------- Utils ----------
const $ = (id)=>document.getElementById(id);
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
function toPoints(t){ return t.legs*weights.legs + t.push*weights.push + t.pull*weights.pull + t.core*weights.core; }
function pickBranch(t){
  const arr = Object.entries(t).sort((a,b)=>b[1]-a[1]);
  if(arr.length<2 || arr[0][1]===0) return "balanced";
  const diff = (arr[0][1]-arr[1][1]) / (arr[0][1] || 1);
  return diff < 0.15 ? "balanced" : arr[0][0];
}
function pickLevel(points){
  let lvl=0; for(let i=0;i<thresholds.length;i++){ if(points>=thresholds[i]) lvl=i; }
  const curr = thresholds[lvl];
  const next = thresholds[Math.min(lvl+1, thresholds.length-1)];
  const denom = Math.max(1, next - curr);
  const pct = clamp((points - curr)/denom, 0, 1);
  return {lvl,pct};
}
function calcPI(t,lvl){
  const out={};
  for(const k of ["legs","push","pull","core"]){
    const val = ((lvl+1)*(t[k]/100)*loadFactors[k]);
    out[k] = Number.isFinite(val) ? Number(val.toFixed(1)) : 0;
  }
  return out;
}
function fmtDate(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleString('fi-FI');
  }catch{return String(ts)}
}
function setTheme(branch){
  const b=document.body;
  b.classList.remove("theme-balanced","theme-legs","theme-push","theme-pull","theme-core");
  const key = ["balanced","legs","push","pull","core"].includes(branch)?branch:"balanced";
  b.classList.add(`theme-${key}`);
}

// ---------- DOM refs ----------
const els = {
  totals:{legs:$("legs-total"),push:$("push-total"),pull:$("pull-total"),core:$("core-total"),all:$("all-total")},
  inputs:{legs:$("legs"),push:$("push"),pull:$("pull"),core:$("core")},
  addBtn:$("add-reps"), resetBtn:$("reset"),
  evoProgress:$("evo-progress"), evoText:$("evo-level-text"),
  branchText:$("branch-text"), avatarEmoji:$("avatar-emoji"), avatarName:$("avatar-name"),
  nextText:$("next-text"), lastUpdate:$("last-update"),
  timeline:$("timeline-bar"),
  pi:{legs:$("pi-legs"),push:$("pi-push"),pull:$("pi-pull"),core:$("pi-core"),
      legsBar:$("pi-legs-bar"),pushBar:$("pi-push-bar"),pullBar:$("pi-pull-bar"),coreBar:$("pi-core-bar")},
  toast:$("evolve-toast"), toastEmoji:$("toast-emoji"), toastText:$("toast-text"),
  history:$("history-list"),
  exportJSON:$("export-json"), exportCSV:$("export-csv"),
  backupCopy:$("backup-copy"), importBtn:$("import-data"), importArea:$("import-area"),
  presetBtns:document.querySelectorAll(".preset")
};

// ---------- Render ----------
let firstRender = true;
function render(){
  const t = state.totals;
  // totals
  els.totals.legs.textContent=t.legs;
  els.totals.push.textContent=t.push;
  els.totals.pull.textContent=t.pull;
  els.totals.core.textContent=t.core;
  els.totals.all.textContent=t.legs+t.push+t.pull+t.core;

  // evolution
  const points = toPoints(t);
  const br = pickBranch(t);
  const {lvl,pct} = pickLevel(points);
  const seq = branches[br] || branches.balanced;
  const curr = seq[Math.min(lvl, seq.length-1)];
  const next = seq[Math.min(lvl+1, seq.length-1)];

  els.avatarEmoji.textContent = curr.emoji;
  els.avatarEmoji.classList.remove("bounce"); void els.avatarEmoji.offsetWidth; els.avatarEmoji.classList.add("bounce");
  els.avatarName.textContent = curr.name;
  els.branchText.textContent = `Polku: ${br[0].toUpperCase()}${br.slice(1)}`;
  els.evoProgress.value = Math.round(pct*100);
  els.evoText.textContent = `Taso ${lvl} • ${Math.round(pct*100)}%`;
  els.nextText.textContent = `Seuraavaksi: ${next.emoji} ${next.name}`;
  els.lastUpdate.textContent = `Viimeisin päivitys: ${state.last.updatedAt ? fmtDate(state.last.updatedAt) : "—"}`;

  setTheme(br);

  // timeline
  els.timeline.innerHTML="";
  seq.forEach((st,i)=>{
    const badge=document.createElement("div");
    badge.className="badge"+(i<=lvl?" reached":"")+(i===lvl?" current":"");
    badge.title=st.name; badge.textContent=st.emoji;
    els.timeline.appendChild(badge);
  });

  // PI
  const pi = calcPI(t,lvl);
  const piMax = Math.max(1, ...Object.values(pi));
  function setPI(k,val,bar){
    const pct = Math.round((val/piMax)*100);
    els.pi[k].textContent = val.toFixed ? val.toFixed(1) : String(val);
    bar.style.width = `${pct}%`;
  }
  setPI("legs",pi.legs,els.pi.legsBar);
  setPI("push",pi.push,els.pi.pushBar);
  setPI("pull",pi.pull,els.pi.pullBar);
  setPI("core",pi.core,els.pi.coreBar);

  // toast (tasolla/polulla muutos)
  if(!firstRender && (lvl>state.last.level || br!==state.last.branch)){
    els.toastEmoji.textContent = curr.emoji;
    els.toastText.textContent = `Olet nyt ${curr.name}`;
    els.toast.hidden = false; setTimeout(()=>els.toast.hidden=true, 1800);
  }
  firstRender=false;

  // history (viimeiset 10)
  renderHistory();

  // last & save
  state.last.points = points;
  state.last.level = lvl;
  state.last.branch = br;
  saveState();
}
function renderHistory(){
  els.history.innerHTML="";
  const last10 = state.history.slice(-10).reverse();
  if(!last10.length){
    const empty=document.createElement("div");
    empty.className="history-item";
    empty.innerHTML = `<span>Ei kirjauksia vielä.</span>`;
    els.history.appendChild(empty);
    return;
  }
  last10.forEach(h=>{
    const div=document.createElement("div");
    div.className="history-item";
    div.innerHTML = `
      <div><strong>+${h.legs}/${h.push}/${h.pull}/${h.core}</strong> (j/p/v/c)</div>
      <div class="when">${fmtDate(h.ts)}</div>
    `;
    els.history.appendChild(div);
  });
}

// ---------- Actions ----------
function parseInc(v){ const n=Number(v); return (Number.isFinite(n)&&n>0)?Math.floor(n):0; }
function addReps(delta){
  let changed=false;
  for(const k of ["legs","push","pull","core"]){
    const inc = parseInc(delta[k]||0);
    if(inc>0){ state.totals[k]+=inc; changed=true; }
  }
  if(changed){
    state.history.push({ts:Date.now(), legs:delta.legs|0, push:delta.push|0, pull:delta.pull|0, core:delta.core|0});
    // pidä historia kohtuullisena (n. 5000 riviä ~ 90 päivää kovaa käyttöä)
    if(state.history.length>5000) state.history = state.history.slice(-5000);
    state.last.updatedAt = Date.now();
    render();
  }
}

// Presetit → täyttävät inputit ja tallentavat
const presetMap = {
  squat:    {legs:10,push:0,pull:0,core:0},
  bench:    {legs:0,push:10,pull:0,core:0},
  deadlift: {legs:4,push:0,pull:2,core:2},   // mave jakaa kuormaa
  pullup:   {legs:0,push:0,pull:8,core:1},
  pushup:   {legs:0,push:5,pull:0,core:0},
  row:      {legs:0,push:0,pull:6,core:1},
  ohp:      {legs:0,push:6,pull:0,core:0},
  plank:    {legs:0,push:0,pull:0,core:3},   // 60s ≈ 3 “toistoa” corelle
  crunch:   {legs:0,push:0,pull:0,core:5}
};
els.presetBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const k = btn.dataset.preset;
    const d = presetMap[k];
    if(!d) return;
    // lisää suoraan
    addReps(d);
  });
});

// Manual add
els.addBtn.addEventListener("click", ()=>{
  const d = {
    legs: parseInc(els.inputs.legs.value),
    push: parseInc(els.inputs.push.value),
    pull: parseInc(els.inputs.pull.value),
    core: parseInc(els.inputs.core.value)
  };
  // tyhjennä
  els.inputs.legs.value = els.inputs.push.value = els.inputs.pull.value = els.inputs.core.value = "";
  addReps(d);
});

// Reset
els.resetBtn.addEventListener("click", ()=>{
  if(confirm("Nollataanko kaikki tiedot? Tämä poistaa historian.")){
    state = defaultState();
    saveState();
    location.reload();
  }
});

// ---------- Export / Import ----------
function download(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}
els.exportJSON.addEventListener("click", ()=>{
  const payload = JSON.stringify(state, null, 2);
  download(`elainkunta_export_${new Date().toISOString().slice(0,10)}.json`, payload);
});
els.exportCSV.addEventListener("click", ()=>{
  // CSV: ts,legs,push,pull,core,totals after entry (optional)
  let csv = "timestamp,legs,push,pull,core\n";
  state.history.forEach(h=>{
    csv += `${new Date(h.ts).toISOString()},${h.legs},${h.push},${h.pull},${h.core}\n`;
  });
  download(`elainkunta_history_${new Date().toISOString().slice(0,10)}.csv`, csv);
});
els.backupCopy.addEventListener("click", ()=>{
  navigator.clipboard?.writeText(JSON.stringify(state)).then(()=>{
    alert("Varmuuskopio kopioitu leikepöydälle.");
  },()=>{
    alert("Kopiointi epäonnistui — käytä 'Lataa JSON'.");
  });
});
els.importBtn.addEventListener("click", ()=>{
  try{
    const txt = els.importArea.value.trim();
    if(!txt){ alert("Liitä varmuuskopio tekstikenttään."); return; }
    const obj = JSON.parse(txt);
    if(!obj || !obj.totals) throw new Error("Virheellinen formaatti.");
    state = {
      totals:Object.assign({legs:0,push:0,pull:0,core:0}, obj.totals||{}),
      last:Object.assign({points:0,level:0,branch:"balanced",updatedAt:Date.now()}, obj.last||{}),
      history:Array.isArray(obj.history)?obj.history.slice(-5000):[]
    };
    saveState();
    render();
    alert("Varmuuskopio tuotu onnistuneesti!");
  }catch(e){
    alert("Tuonti epäonnistui: "+e.message);
  }
});

// ---------- Init ----------
render();

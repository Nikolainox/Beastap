// Eläinkunta – Evolve 7.0 (täysin toimiva, bugikorjattu)
const STORAGE_KEY = "animal-evolve-7.0";

// ---------- Perustila ----------
function defaultState(){
  return {
    totals:{legs:0,push:0,pull:0,core:0,mind:0},
    last:{points:0,level:0,track:"balanced",updatedAt:null,bestKey:null},
    history:[] // {ts, legs,push,pull,core, cardioMin, runKm, mindMin}
  };
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return raw?JSON.parse(raw):defaultState();
  }catch{ return defaultState(); }
}
let state = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ---------- Apuja ----------
const $ = (id)=>document.getElementById(id);
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

// pisteytys (taso-palkkiin)
const weights = { legs:1.2, push:1.0, pull:1.0, core:0.8, mind:0.6 };
const loadFactors = { legs:2.0, push:1.6, pull:1.4, core:0.8, mind:0.6 };
const thresholds  = [0,100,250,500,900,1400,2000,2700,3500,4400,5400,6500,7700,9000,10400,11900];

function toPoints(t){
  return t.legs*weights.legs + t.push*weights.push + t.pull*weights.pull + t.core*weights.core + t.mind*weights.mind;
}
function pickLevel(points){
  let lvl=0; for(let i=0;i<thresholds.length;i++){ if(points>=thresholds[i]) lvl=i; }
  const curr=thresholds[lvl], next=thresholds[Math.min(lvl+1,thresholds.length-1)];
  const pct=clamp((points-curr)/Math.max(1,next-curr),0,1);
  return {lvl,pct};
}
function calcPI(t,lvl){
  const out={}; for(const k of ["legs","push","pull","core","mind"]){
    const v=((lvl+1)*(t[k]/100)*(loadFactors[k]||1));
    out[k]=Number.isFinite(v)?Number(v.toFixed(1)):0;
  } return out;
}
function fmtDate(ts){ try{return new Date(ts).toLocaleString('fi-FI');}catch{return String(ts)} }

// ---------- Eläinmoottori ----------
// Realistinen profiili 0..100 (nopeus voi käyttää myös km/h skaalattuna)
const ANIMALS = [
  // speed / land
  {key:"cheetah", name:"Gepardi", emoji:"🐆", track:"speed", attrs:{speed:100,strength:40,endurance:35,agility:90,focus:30}},
  {key:"ostrich", name:"Strutsi", emoji:"🦤", track:"speed", attrs:{speed:75,strength:45,endurance:55,agility:60,focus:35}},
  {key:"horse", name:"Hevonen", emoji:"🐎", track:"speed", attrs:{speed:70,strength:65,endurance:70,agility:60,focus:40}},
  {key:"greyhound", name:"Vinttikoira", emoji:"🐕", track:"speed", attrs:{speed:72,strength:35,endurance:50,agility:65,focus:35}},
  // strength
  {key:"lion", name:"Leijona", emoji:"🦁", track:"strength", attrs:{speed:80,strength:85,endurance:45,agility:70,focus:40}},
  {key:"tiger", name:"Tiikeri", emoji:"🐯", track:"strength", attrs:{speed:65,strength:88,endurance:50,agility:75,focus:45}},
  {key:"bear", name:"Karhu", emoji:"🐻", track:"strength", attrs:{speed:48,strength:90,endurance:60,agility:55,focus:40}},
  {key:"gorilla", name:"Gorilla", emoji:"🦍", track:"strength", attrs:{speed:40,strength:95,endurance:40,agility:60,focus:45}},
  {key:"elephant", name:"Norsu", emoji:"🐘", track:"strength", attrs:{speed:40,strength:99,endurance:70,agility:35,focus:50}},
  // endurance
  {key:"wolf", name:"Susi", emoji:"🐺", track:"endurance", attrs:{speed:60,strength:55,endurance:85,agility:65,focus:45}},
  {key:"camel", name:"Kameli", emoji:"🐪", track:"endurance", attrs:{speed:40,strength:60,endurance:95,agility:40,focus:50}},
  {key:"reindeer", name:"Poro", emoji:"🦌", track:"endurance", attrs:{speed:60,strength:55,endurance:85,agility:60,focus:45}},
  {key:"dolphin", name:"Delfiini", emoji:"🐬", track:"endurance", attrs:{speed:60,strength:55,endurance:75,agility:80,focus:50}},
  // agility
  {key:"cat", name:"Kissa", emoji:"🐈", track:"agility", attrs:{speed:48,strength:40,endurance:45,agility:95,focus:45}},
  {key:"chimp", name:"Simpanssi", emoji:"🐒", track:"agility", attrs:{speed:35,strength:70,endurance:45,agility:85,focus:50}},
  {key:"eagle", name:"Kotka", emoji:"🦅", track:"agility", attrs:{speed:90,strength:50,endurance:60,agility:95,focus:55}},
  // mind/focus
  {key:"owl", name:"Pöllö", emoji:"🦉", track:"mind", attrs:{speed:60,strength:30,endurance:45,agility:90,focus:85}},
  {key:"butterfly", name:"Perhonen", emoji:"🦋", track:"mind", attrs:{speed:40,strength:20,endurance:40,agility:70,focus:70}},
  {key:"sage", name:"Viisas", emoji:"🧙", track:"mind", attrs:{speed:40,strength:40,endurance:60,agility:60,focus:95}},
  // balanced milestones
  {key:"human", name:"Ihminen", emoji:"🧑", track:"balanced", attrs:{speed:50,strength:60,endurance:65,agility:70,focus:60}},
  {key:"athlete", name:"Atleetti", emoji:"🏃", track:"balanced", attrs:{speed:70,strength:75,endurance:80,agility:80,focus:70}},
  // early chain (aloitus)
  {key:"worm", name:"Mato", emoji:"🪱", track:"balanced", attrs:{speed:1,strength:1,endurance:1,agility:1,focus:1}},
  {key:"jelly", name:"Meduusa", emoji:"🪸", track:"balanced", attrs:{speed:5,strength:5,endurance:10,agility:10,focus:10}},
  {key:"fish", name:"Kala", emoji:"🐠", track:"balanced", attrs:{speed:20,strength:10,endurance:20,agility:25,focus:20}},
  {key:"frog", name:"Sammakko", emoji:"🐸", track:"balanced", attrs:{speed:15,strength:20,endurance:15,agility:35,focus:25}},
  {key:"lizard", name:"Lisko", emoji:"🦎", track:"balanced", attrs:{speed:20,strength:25,endurance:20,agility:40,focus:30}},
  {key:"bird", name:"Lintu", emoji:"🐦", track:"balanced", attrs:{speed:50,strength:20,endurance:40,agility:80,focus:40}}
];

function userVector(){
  const t = state.totals;
  // Strength: toistot (jalat, push, pull)
  const strength = (t.legs*1.2 + t.push*1.0 + t.pull*1.0) / 10;
  // Agility: core + vetävät + hieman push
  const agility  = t.pull*0.3 + t.core*0.8 + t.push*0.2;
  // Mind/focus: suoraan mieliminuutit * skaala
  const focus = t.mind/2; // 200 min ≈ 100
  // Speed: viimeisimmästä juoksusyötöstä
  const km  = Number(document.getElementById("run-km")?.value || 0);
  const min = Number(document.getElementById("run-min")?.value || 0);
  const speed = (km>0 && min>0) ? (km/min)*60 : 0; // km/h
  // Endurance: historian cardio-min + nykyinen
  const cardioMin = (state.history||[]).reduce((a,h)=>a+(h.cardioMin||0),0) + (min||0);
  const endurance = cardioMin/5; // 500 min ≈ 100

  return {
    speed:    clamp(speed,0,100),
    strength: clamp(strength,0,100),
    endurance:clamp(endurance,0,100),
    agility:  clamp(agility,0,100),
    focus:    clamp(focus,0,100)
  };
}
function cosSim(a,b){
  const av=[a.speed,a.strength,a.endurance,a.agility,a.focus];
  const bv=[b.speed,b.strength,b.endurance,b.agility,b.focus];
  let dot=0,an=0,bn=0;
  for(let i=0;i<5;i++){ dot+=av[i]*bv[i]; an+=av[i]*av[i]; bn+=bv[i]*bv[i]; }
  if(an===0||bn===0) return 0;
  return dot/(Math.sqrt(an)*Math.sqrt(bn));
}
function pickBest(vec, n=5){
  return ANIMALS.map(x=>({x, s:cosSim(vec,x.attrs)}))
                .sort((a,b)=>b.s-a.s)
                .slice(0,n);
}

function branchLabel(track){
  switch(track){
    case "speed": return "Nopeus";
    case "strength": return "Voima";
    case "endurance": return "Kestävyys";
    case "agility": return "Ketteryys";
    case "mind": return "Mieli";
    default: return "Tasapainoinen";
  }
}
function themeClass(track){
  return {
    speed:"theme-speed", strength:"theme-strength", endurance:"theme-endurance",
    agility:"theme-agility", mind:"theme-mind", balanced:"theme-speed"
  }[track] || "theme-speed";
}

// ---------- DOM viittaukset ----------
const els = {
  totals:{legs:$("legs-total"),push:$("push-total"),pull:$("pull-total"),core:$("core-total"),mind:$("mind-total"),all:$("all-total")},
  inputs:{legs:$("legs"),push:$("push"),pull:$("pull"),core:$("core")},
  addBtn:$("add-reps"), resetBtn:$("reset"),
  evoProgress:$("evo-progress"), evoText:$("evo-level-text"),
  branchText:$("branch-text"), avatarEmoji:$("avatar-emoji"), avatarName:$("avatar-name"),
  nextText:$("next-text"), lastUpdate:$("last-update"),
  timeline:$("timeline-bar"),
  pi:{legs:$("pi-legs"),push:$("pi-push"),pull:$("pi-pull"),core:$("pi-core"),mind:$("pi-mind"),
      legsBar:$("pi-legs-bar"),pushBar:$("pi-push-bar"),pullBar:$("pi-pull-bar"),coreBar:$("pi-core-bar"),mindBar:$("pi-mind-bar")},
  toast:$("evolve-toast"), toastEmoji:$("toast-emoji"), toastText:$("toast-text"),
  history:$("history-list"),
  exportJSON:$("export-json"), exportCSV:$("export-csv"), backupCopy:$("backup-copy"),
  runKm:$("run-km"), runMin:$("run-min"), addRun:$("add-run"),
  mindMin:$("mind-min"), addMind:$("add-mind"),
  presetBtns:document.querySelectorAll(".preset")
};

// ---------- Render ----------
let firstRender = true;
function setTheme(track){
  const b=document.body;
  b.classList.remove("theme-speed","theme-strength","theme-endurance","theme-agility","theme-mind");
  b.classList.add(themeClass(track));
}
function renderHistory(){
  els.history.innerHTML="";
  const last10 = state.history.slice(-10).reverse();
  if(!last10.length){
    const d=document.createElement("div"); d.className="history-item"; d.textContent="Ei kirjauksia vielä.";
    els.history.appendChild(d); return;
  }
  last10.forEach(h=>{
    const d=document.createElement("div"); d.className="history-item";
    const parts=[];
    if(h.legs) parts.push(`jalat+${h.legs}`);
    if(h.push) parts.push(`push+${h.push}`);
    if(h.pull) parts.push(`veto+${h.pull}`);
    if(h.core) parts.push(`core+${h.core}`);
    if(h.cardioMin) parts.push(`cardio ${h.cardioMin}min ${h.runKm?`(${h.runKm}km)`:``}`);
    if(h.mindMin) parts.push(`mieli ${h.mindMin}min`);
    d.innerHTML=`<div><strong>${parts.join(" • ")||"—"}</strong></div><div class="when">${fmtDate(h.ts)}</div>`;
    els.history.appendChild(d);
  });
}
function render(){
  const t=state.totals;
  els.totals.legs.textContent=t.legs; els.totals.push.textContent=t.push; els.totals.pull.textContent=t.pull; els.totals.core.textContent=t.core; els.totals.mind.textContent=t.mind;
  els.totals.all.textContent=t.legs+t.push+t.pull+t.core;

  const points=toPoints(t);
  const {lvl,pct}=pickLevel(points);
  els.evoProgress.value=Math.round(pct*100);
  els.evoText.textContent=`Taso ${lvl} • ${Math.round(pct*100)}%`;
  els.lastUpdate.textContent=`Viimeisin päivitys: ${state.last.updatedAt?fmtDate(state.last.updatedAt):"—"}`;

  // PI
  const pi=calcPI(t,lvl); const piMax=Math.max(1,...Object.values(pi));
  const setPI=(k,val,bar)=>{ const p=Math.round((val/piMax)*100); els.pi[k].textContent=val.toFixed(1); bar.style.width=`${p}%`; };
  setPI("legs",pi.legs,els.pi.legsBar); setPI("push",pi.push,els.pi.pushBar); setPI("pull",pi.pull,els.pi.pullBar); setPI("core",pi.core,els.pi.coreBar); setPI("mind",pi.mind,els.pi.mindBar);

  // Animal selection
  const vec=userVector();
  const ranked=pickBest(vec,5);
  const best=ranked[0];

  if(best){
    const a=best.x;
    els.avatarEmoji.textContent=a.emoji;
    els.avatarEmoji.classList.remove("bounce"); void els.avatarEmoji.offsetWidth; els.avatarEmoji.classList.add("bounce");
    els.avatarName.textContent=a.name;
    els.branchText.textContent=`Polku: ${branchLabel(a.track)}`;
    // ohje: mikä ominaisuus kauimpana
    const diff={
      speed: Math.max(0,a.attrs.speed-vec.speed),
      strength: Math.max(0,a.attrs.strength-vec.strength),
      endurance: Math.max(0,a.attrs.endurance-vec.endurance),
      agility: Math.max(0,a.attrs.agility-vec.agility),
      focus: Math.max(0,a.attrs.focus-vec.focus)
    };
    const nextKey=Object.entries(diff).sort((p,q)=>q[1]-p[1])[0][0];
    const nextLabel = {speed:"juoksunopeutta",strength:"voimaa",endurance:"kestävyyttä",agility:"ketteryyttä",focus:"fokusta"}[nextKey] || "tasapainoa";
    els.nextText.textContent=`Seuraavaksi: lisää ${nextLabel}`;
    setTheme(a.track);

    if(!firstRender && state.last.bestKey!==a.key){
      $("toast-emoji").textContent=a.emoji;
      $("toast-text").textContent=`Olet nyt ${a.name} (${branchLabel(a.track)})`;
      $("evolve-toast").hidden=false; setTimeout(()=>{$("evolve-toast").hidden=true;},1800);
    }
    state.last.bestKey=a.key;
  }

  // Top-5 badges
  els.timeline.innerHTML="";
  ranked.forEach((r,i)=>{
    const badge=document.createElement("div");
    badge.className="badge"+(i===0?" current":" reached");
    badge.title=`${r.x.name} • ${Math.round(r.s*100)}%`;
    badge.textContent=r.x.emoji;
    els.timeline.appendChild(badge);
  });

  renderHistory();

  state.last.points=points; state.last.level=lvl;
  saveState();
  firstRender=false;
}

// ---------- Tapahtumat ----------
function parseInc(v){ const n=Number(v); return (Number.isFinite(n)&&n>0)?Math.floor(n):0; }
function addReps(delta){
  let changed=false;
  for(const k of ["legs","push","pull","core"]){
    const inc=parseInc(delta[k]||0); if(inc>0){ state.totals[k]+=inc; changed=true; }
  }
  if(changed){
    state.history.push({ts:Date.now(), legs:delta.legs|0, push:delta.push|0, pull:delta.pull|0, core:delta.core|0});
    if(state.history.length>5000) state.history=state.history.slice(-5000);
    state.last.updatedAt=Date.now(); render();
  }
}
function addRunEntry(km,min){
  if(!(km>0 && min>0)){ alert("Anna sekä km että minuutit."); return; }
  state.history.push({ts:Date.now(), legs:0,push:0,pull:0,core:0, cardioMin:min, runKm:km});
  if(state.history.length>5000) state.history=state.history.slice(-5000);
  state.last.updatedAt=Date.now(); saveState(); render();
}
function addMindEntry(min){
  if(!(min>0)){ alert("Lisää mieliminuutit (>0)."); return; }
  state.totals.mind += Math.floor(min);
  state.history.push({ts:Date.now(), legs:0,push:0,pull:0,core:0, mindMin:Math.floor(min)});
  if(state.history.length>5000) state.history=state.history.slice(-5000);
  state.last.updatedAt=Date.now(); saveState(); render();
}

// napit
els.addBtn.addEventListener("click", ()=>{
  const d={ legs:parseInc(els.inputs.legs.value), push:parseInc(els.inputs.push.value),
            pull:parseInc(els.inputs.pull.value), core:parseInc(els.inputs.core.value) };
  els.inputs.legs.value=els.inputs.push.value=els.inputs.pull.value=els.inputs.core.value="";
  addReps(d);
});
els.resetBtn.addEventListener("click", ()=>{
  if(confirm("Nollataanko kaikki tiedot? Tämä poistaa historian.")){
    state=defaultState(); saveState(); location.reload();
  }
});
els.addRun.addEventListener("click", ()=>{
  const km=Number(els.runKm.value||0), min=Number(els.runMin.value||0);
  addRunEntry(km,min);
});
els.addMind.addEventListener("click", ()=>{
  const min=Number(els.mindMin.value||0);
  els.mindMin.value="";
  addMindEntry(min);
});

// Presetit (suora lisäys)
const presetMap = {
  squat:{legs:10,push:0,pull:0,core:0},
  bench:{legs:0,push:10,pull:0,core:0},
  deadlift:{legs:4,push:0,pull:2,core:2},
  pullup:{legs:0,push:0,pull:8,core:1},
  pushup:{legs:0,push:5,pull:0,core:0},
  row:{legs:0,push:0,pull:6,core:1},
  ohp:{legs:0,push:6,pull:0,core:0},
  plank:{legs:0,push:0,pull:0,core:3},
  mind10:null // käsitellään erikseen
};
document.querySelectorAll(".preset").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const k=btn.dataset.preset;
    if(k==="mind10"){ addMindEntry(10); return; }
    const d=presetMap[k]; if(d) addReps(d);
  });
});

// Exportit
function download(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },0);
}
$("export-json").addEventListener("click", ()=>download(`elainkunta_export_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state,null,2)));
$("export-csv").addEventListener("click", ()=>{
  let csv="timestamp,legs,push,pull,core,mind,cardioMin,runKm\n";
  state.history.forEach(h=>{
    csv+=`${new Date(h.ts).toISOString()},${h.legs||0},${h.push||0},${h.pull||0},${h.core||0},${0},${h.mindMin||h.cardioMin||0},${h.runKm||0}\n`;
  });
  download(`elainkunta_history_${new Date().toISOString().slice(0,10)}.csv`, csv);
});
$("backup-copy").addEventListener("click", ()=>{
  navigator.clipboard?.writeText(JSON.stringify(state)).then(()=>alert("Varmuuskopio kopioitu!"),()=>alert("Kopiointi epäonnistui – käytä Lataa JSON."));
});

// Init
render();

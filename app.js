// ===== Evolve 8.0 – Pelimäinen, emoji-napit, laaja eläinlogiikka =====
const STORAGE_KEY = "evolve-8.0-state";

// ---------- Apurit ----------
const $ = (q) => document.querySelector(q);
const clamp = (n, lo=0, hi=100) => Math.max(lo, Math.min(hi, n));
const nowISO = () => new Date().toISOString();

// ---------- Tila ----------
function defaultState(){
  return {
    totals: { legs:0, push:0, pull:0, mindMin:0, runKm:0, runMin:0 },
    history: [],                 // {ts, type, qty, meta?}
    last: { level:0, points:0, bestKey:null, track:"balanced" }
  };
}
function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState(); }catch{ return defaultState(); } }
let state = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ---------- Eläintietokanta (~60 lajia) ----------
/*
 attrs skaalat 0..100:
 - speed: huippunopeus / liikkumisnopeus
 - strength: raaka voima
 - endurance: pitkäkestoinen suoritus
 - agility: ketteryys/koordinaatio
 - focus: mielen kirkkaus/älykkyys
 track: nopeus | voima | kestävyys | ketteryys | mieli | balanced
*/
const ANIMALS = [
  // Balanced chain / milestones
  A("worm","Mato","🪱","balanced",{speed:1,strength:1,endurance:1,agility:1,focus:1}),
  A("jelly","Meduusa","🪸","balanced",{speed:5,strength:5,endurance:10,agility:10,focus:10}),
  A("fish","Kala","🐠","balanced",{speed:20,strength:10,endurance:20,agility:25,focus:15}),
  A("frog","Sammakko","🐸","balanced",{speed:18,strength:20,endurance:20,agility:35,focus:20}),
  A("lizard","Lisko","🦎","balanced",{speed:22,strength:25,endurance:22,agility:40,focus:25}),
  A("bird","Lintu","🐦","balanced",{speed:50,strength:20,endurance:40,agility:80,focus:35}),
  A("human","Ihminen","🧑","balanced",{speed:50,strength:60,endurance:65,agility:70,focus:60}),
  A("athlete","Atleetti","🏃","balanced",{speed:70,strength:75,endurance:80,agility:80,focus:65}),

  // Speed (maa/ilma)
  A("cheetah","Gepardi","🐆","speed",{speed:100,strength:40,endurance:35,agility:90,focus:30}),
  A("ostrich","Strutsi","🦤","speed",{speed:75,strength:45,endurance:55,agility:60,focus:35}),
  A("horse","Hevonen","🐎","speed",{speed:70,strength:65,endurance:70,agility:60,focus:40}),
  A("greyhound","Vinttikoira","🐕","speed",{speed:72,strength:35,endurance:50,agility:65,focus:35}),
  A("hare","Jänis","🐇","speed",{speed:55,strength:25,endurance:45,agility:70,focus:35}),
  A("pronghorn","Gaselli","🦌","speed",{speed:80,strength:40,endurance:70,agility:70,focus:35}),
  A("eagle","Kotka","🦅","speed",{speed:90,strength:50,endurance:60,agility:95,focus:55}),
  A("falcon","Muuttohaukka","🦅","speed",{speed:100,strength:45,endurance:55,agility:95,focus:55}),
  A("swift","Pääskynen","🐦","speed",{speed:85,strength:25,endurance:60,agility:95,focus:45}),
  A("ostrich2","Emu","🦤","speed",{speed:65,strength:50,endurance:60,agility:55,focus:35}),

  // Strength
  A("lion","Leijona","🦁","strength",{speed:80,strength:88,endurance:45,agility:70,focus:45}),
  A("tiger","Tiikeri","🐯","strength",{speed:65,strength:90,endurance:50,agility:78,focus:45}),
  A("bear","Karhu","🐻","strength",{speed:48,strength:92,endurance:60,agility:55,focus:40}),
  A("gorilla","Gorilla","🦍","strength",{speed:40,strength:95,endurance:40,agility:60,focus:50}),
  A("elephant","Norsu","🐘","strength",{speed:40,strength:99,endurance:70,agility:35,focus:50}),
  A("rhino","Sarvikuono","🦏","strength",{speed:50,strength:96,endurance:60,agility:40,focus:40}),
  A("bison","Biisoni","🦬","strength",{speed:56,strength:90,endurance:70,agility:45,focus:40}),
  A("hippo","Virtahepo","🦛","strength",{speed:48,strength:90,endurance:60,agility:35,focus:35}),
  A("yak","Jaki","🐂","strength",{speed:30,strength:80,endurance:70,agility:35,focus:40}),
  A("boar","Villisika","🐗","strength",{speed:40,strength:70,endurance:60,agility:45,focus:35}),

  // Endurance (maa/meri)
  A("wolf","Susi","🐺","endurance",{speed:60,strength:55,endurance:85,agility:65,focus:50}),
  A("camel","Kameli","🐪","endurance",{speed:40,strength:60,endurance:95,agility:40,focus:50}),
  A("reindeer","Poro","🦌","endurance",{speed:60,strength:55,endurance:85,agility:60,focus:45}),
  A("husky","Husky","🐕","endurance",{speed:58,strength:50,endurance:90,agility:60,focus:50}),
  A("dolphin","Delfiini","🐬","endurance",{speed:60,strength:55,endurance:75,agility:80,focus:55}),
  A("orca","Miekkavalas","🐋","endurance",{speed:70,strength:85,endurance:85,agility:60,focus:60}),
  A("seal","Hylje","🦭","endurance",{speed:45,strength:50,endurance:70,agility:55,focus:40}),
  A("penguin","Pingviini","🐧","endurance",{speed:36,strength:30,endurance:60,agility:60,focus:40}),
  A("tuna","Tonnikala","🐟","endurance",{speed:75,strength:50,endurance:80,agility:70,focus:40}),
  A("goose","Hanhi","🪿","endurance",{speed:80,strength:35,endurance:85,agility:70,focus:45}),

  // Agility / climb / jump
  A("cat","Kissa","🐈","agility",{speed:48,strength:40,endurance:45,agility:95,focus:45}),
  A("fox","Kettu","🦊","agility",{speed:48,strength:35,endurance:55,agility:78,focus:50}),
  A("chimp","Simpanssi","🐒","agility",{speed:35,strength:70,endurance:45,agility:85,focus:55}),
  A("gibbon","Gibboni","🐒","agility",{speed:38,strength:65,endurance:45,agility:88,focus:55}),
  A("lemur","Leemuri","🐒","agility",{speed:32,strength:35,endurance:40,agility:82,focus:45}),
  A("squirrel","Orava","🐿️","agility",{speed:30,strength:25,endurance:40,agility:90,focus:45}),
  A("kangaroo","Kenguru","🦘","agility",{speed:56,strength:60,endurance:55,agility:75,focus:45}),
  A("ibex","Vuorikauris","🦌","agility",{speed:40,strength:55,endurance:55,agility:88,focus:45}),
  A("parrot","Papukaija","🦜","agility",{speed:55,strength:25,endurance:50,agility:90,focus:55}),
  A("owl","Pöllö","🦉","agility",{speed:60,strength:30,endurance:45,agility:92,focus:85}),

  // Mind / focus
  A("raven","Korppi","🪶","mind",{speed:50,strength:25,endurance:45,agility:75,focus:80}),
  A("dolphin-mind","Delfiini (älykäs)","🐬","mind",{speed:60,strength:55,endurance:75,agility:80,focus:80}),
  A("octopus","Mustekala","🐙","mind",{speed:30,strength:30,endurance:40,agility:85,focus:90}),
  A("elephant-mind","Norsu (muisti)","🐘","mind",{speed:40,strength:99,endurance:70,agility:35,focus:85}),
  A("sage","Viisas","🧙","mind",{speed:40,strength:40,endurance:60,agility:60,focus:95}),
  A("master","Mestari","🧠","mind",{speed:50,strength:50,endurance:60,agility:70,focus:100})
];
function A(key,name,emoji,track,attrs){ return {key,name,emoji,track,attrs}; }

// ---------- UI elementit ----------
const avatar = $("#avatar");
const animalName = $("#animalName");
const trackText = $("#track");
const bar = $("#bar");
const toast = $("#toast");
const toastText = $("#toastText");

// napit
const btns = document.querySelectorAll(".buttons button");

// ---------- Laskenta: käyttäjävektori ----------
function userVector(){
  const t = state.totals;
  // Strength – toistokertymät (jalat/push/pull)
  const strength = (t.legs*1.2 + t.push*1.0 + t.pull*1.0) / 10;

  // Agility – vetävät + jalat hiukan
  const agility  = t.pull*0.6 + t.legs*0.2;

  // Mind/focus – mieliminuutit
  const focus = t.mindMin / 2; // 200min ~ 100 pist.

  // Speed – juoksun keskinop. km/h
  const speed = (t.runKm>0 && t.runMin>0) ? (t.runKm / t.runMin) * 60 : 0;

  // Endurance – cardio-minuutit
  const endurance = t.runMin / 5; // 500min ~ 100 pist.

  return {
    speed: clamp(speed),
    strength: clamp(strength),
    endurance: clamp(endurance),
    agility: clamp(agility),
    focus: clamp(focus)
  };
}

// ---------- Kosinisimilaarisuus ----------
function cosSim(a,b){
  const av=[a.speed,a.strength,a.endurance,a.agility,a.focus];
  const bv=[b.speed,b.strength,b.endurance,b.agility,b.focus];
  let dot=0, an=0, bn=0;
  for(let i=0;i<5;i++){ dot+=av[i]*bv[i]; an+=av[i]*av[i]; bn+=bv[i]*bv[i]; }
  if(an===0 || bn===0) return 0;
  return dot/(Math.sqrt(an)*Math.sqrt(bn));
}
function bestAnimals(vec, n=5){
  return ANIMALS.map(x=>({x, s:cosSim(vec,x.attrs)})).sort((a,b)=>b.s-a.s).slice(0,n);
}

// ---------- Taso-pisteet (progress) ----------
const levelThresholds = [0,120,300,600,1000,1500,2100,2800,3600,4500,5500,6600,7800,9100];
function points(){
  // pisteytys: keskitetään reps/logit
  // legs/push/pull 1p/rep, mindMin 0.5p/min, runMin 0.6p/min
  const t=state.totals;
  return t.legs + t.push + t.pull + (t.mindMin*0.5) + (t.runMin*0.6);
}
function pickLevel(pts){
  let lvl=0; for(let i=0;i<levelThresholds.length;i++){ if(pts>=levelThresholds[i]) lvl=i; }
  const curr=levelThresholds[lvl], next=levelThresholds[Math.min(lvl+1,levelThresholds.length-1)];
  const pct = (pts-curr)/Math.max(1,(next-curr));
  return { lvl, pct: clamp(pct*100, 0, 100) };
}

// ---------- Render ----------
let firstRender=true;
function render(){
  // käyttäjävektori + paras eläin
  const vec = userVector();
  const ranked = bestAnimals(vec, 5);
  const best = ranked[0]?.x || ANIMALS[0];

  // avatar & tekstit
  if(state.last.bestKey !== best.key){
    avatar.classList.remove("bump"); void avatar.offsetWidth; avatar.classList.add("bump");
    showToast(`🆙 Uusi muoto: ${best.emoji} ${best.name}`);
  }
  avatar.textContent = best.emoji;
  animalName.textContent = best.name;
  trackText.textContent = `Polku: ${trackLabel(best.track)}`;
  document.body.className = document.body.className
    .replace(/theme-\w+/g,'')
    .trim() + ' ' + themeClass(best.track);

  // progress
  const pts = points();
  const {lvl, pct} = pickLevel(pts);
  bar.value = Math.round(pct);

  // talteen
  state.last.bestKey = best.key;
  state.last.track = best.track;
  state.last.level = lvl;
  state.last.points = pts;
  save();
  firstRender = false;
}

function trackLabel(t){
  return ({speed:"Nopeus",strength:"Voima",endurance:"Kestävyys",agility:"Ketteryys",mind:"Mieli",balanced:"Tasapainoinen"})[t] || "Tasapainoinen";
}
function themeClass(t){
  return ({speed:"theme-speed",strength:"theme-strength",endurance:"theme-endurance",agility:"theme-agility",mind:"theme-mind",balanced:"theme-speed"})[t] || "theme-speed";
}

// ---------- Interaktio: emoji-napit ----------
btns.forEach(b=>{
  b.addEventListener("click", (e)=>{
    const act = b.dataset.act;
    if(act==="legs")  return applyAction("legs",10, "🦵 +10");
    if(act==="push")  return applyAction("push",10, "💪 +10");
    if(act==="pull")  return applyAction("pull",8,  "🧗‍♂️ +8");
    if(act==="mind")  return addMind(10,  "🧘 +10min");
    if(act==="run")   return addRun(1,6,   "🏃‍♂️ +1km / 6min"); // steady jog 10 km/h
  });
  // tuplaklikkaus = sprintti (nopeusboosti)
  b.addEventListener("dblclick",(e)=>{
    if(b.dataset.act!=="run") return;
    addRun(0.2,0.5,"⚡ Sprintti +0.2km / 0.5min");
  });
});

function applyAction(type, qty, label){
  // lisää toistot, kirjaa historia
  state.totals[type] += qty;
  state.history.push({ ts: nowISO(), type, qty });
  dropParticle(label);
  render();
}
function addMind(min, label){
  state.totals.mindMin += min;
  state.history.push({ ts: nowISO(), type:"mind", qty:min });
  dropParticle(label);
  render();
}
function addRun(km, min, label){
  state.totals.runKm  += km;
  state.totals.runMin += min;
  state.history.push({ ts: nowISO(), type:"run", qty:km, meta:{min} });
  dropParticle(label);
  render();
}

// ---------- Pienet visuaaliset tehosteet ----------
function dropParticle(text){
  const p = document.createElement("div");
  p.className = "particle";
  p.textContent = text;
  const rect = $(".buttons").getBoundingClientRect();
  const x = rect.left + rect.width/2 + (Math.random()*80-40);
  const y = rect.top  + 10 + (Math.random()*12-6);
  p.style.left = `${x}px`; p.style.top = `${y}px`;
  document.body.appendChild(p);
  setTimeout(()=>p.remove(), 950);
}
let toastTimer=null;
function showToast(msg){
  toastText.textContent = msg;
  toast.hidden = false;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.hidden=true, 1800);
}

// ---------- Vienti / reset ----------
$("#export").addEventListener("click", ()=>{
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=`elainkunta_evolve8_export_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  showToast("📤 JSON tallennettu");
});

$("#reset").addEventListener("click", ()=>{
  if(confirm("Nollataanko kaikki? Historia poistuu.")){
    state = defaultState();
    save(); render();
    showToast("🔁 Nollattu");
  }
});

// ---------- Alustus ----------
render();

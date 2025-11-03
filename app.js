// ===== Evolve 8.1 – täysin toimiva, bugikorjattu =====
const STORAGE_KEY = "evolve-8.1-state";
const $ = (q) => document.querySelector(q);
const clamp = (n, lo=0, hi=100) => Math.max(lo, Math.min(hi, n));
const nowISO = () => new Date().toISOString();

/* ---------- Pysyvä tila ---------- */
function defaultState(){
  return { totals:{ legs:0, push:0, pull:0, mindMin:0, runKm:0, runMin:0 },
           history:[], last:{ level:0, points:0, bestKey:null, track:"balanced" } };
}
function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState(); }catch{ return defaultState(); } }
let state = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ---------- Eläinkirjasto (~60) ---------- */
function A(key,name,emoji,track,attrs){ return {key,name,emoji,track,attrs}; }
/* attrs: speed/strength/endurance/agility/focus 0..100 */
const ANIMALS = [
  // Balanced chain
  A("worm","Mato","🪱","balanced",{speed:1,strength:1,endurance:1,agility:1,focus:1}),
  A("jelly","Meduusa","🪸","balanced",{speed:5,strength:5,endurance:10,agility:10,focus:10}),
  A("fish","Kala","🐠","balanced",{speed:20,strength:10,endurance:20,agility:25,focus:15}),
  A("frog","Sammakko","🐸","balanced",{speed:18,strength:20,endurance:20,agility:35,focus:20}),
  A("lizard","Lisko","🦎","balanced",{speed:22,strength:25,endurance:22,agility:40,focus:25}),
  A("bird","Lintu","🐦","balanced",{speed:50,strength:20,endurance:40,agility:80,focus:35}),
  A("human","Ihminen","🧑","balanced",{speed:50,strength:60,endurance:65,agility:70,focus:60}),
  A("athlete","Atleetti","🏃","balanced",{speed:70,strength:75,endurance:80,agility:80,focus:65}),

  // Speed
  A("cheetah","Gepardi","🐆","speed",{speed:100,strength:40,endurance:35,agility:90,focus:30}),
  A("ostrich","Strutsi","🦤","speed",{speed:75,strength:45,endurance:55,agility:60,focus:35}),
  A("horse","Hevonen","🐎","speed",{speed:70,strength:65,endurance:70,agility:60,focus:40}),
  A("greyhound","Vinttikoira","🐕","speed",{speed:72,strength:35,endurance:50,agility:65,focus:35}),
  A("hare","Jänis","🐇","speed",{speed:55,strength:25,endurance:45,agility:70,focus:35}),
  A("pronghorn","Gaselli","🦌","speed",{speed:80,strength:40,endurance:70,agility:70,focus:35}),
  A("swift","Pääskynen","🐦","speed",{speed:85,strength:25,endurance:60,agility:95,focus:45}),
  A("eagle","Kotka","🦅","speed",{speed:90,strength:50,endurance:60,agility:95,focus:55}),
  A("falcon","Muuttohaukka","🦅","speed",{speed:100,strength:45,endurance:55,agility:95,focus:55}),
  A("emu","Emu","🦤","speed",{speed:65,strength:50,endurance:60,agility:55,focus:35}),

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

  // Endurance
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

  // Agility
  A("cat","Kissa","🐈","agility",{speed:48,strength:40,endurance:45,agility:95,focus:45}),
  A("fox","Kettu","🦊","agility",{speed:48,strength:35,endurance:55,agility:78,focus:50}),
  A("chimp","Simpanssi","🐒","agility",{speed:35,strength:70,endurance:45,agility:85,focus:55}),
  A("gibbon","Gibboni","🐒","agility",{speed:38,strength:65,endurance:45,agility:88,focus:55}),
  A("lemur","Leemuri","🐒","agility",{speed:32,strength:35,endurance:40,agility:82,focus:45}),
  A("squirrel","Orava","🐿️","agility",{speed:30,strength:25,endurance:40,agility:90,focus:45}),
  A("ibex","Vuorikauris","🦌","agility",{speed:40,strength:55,endurance:55,agility:88,focus:45}),
  A("parrot","Papukaija","🦜","agility",{speed:55,strength:25,endurance:50,agility:90,focus:55}),
  A("kangaroo","Kenguru","🦘","agility",{speed:56,strength:60,endurance:55,agility:75,focus:45}),
  A("owl","Pöllö","🦉","agility",{speed:60,strength:30,endurance:45,agility:92,focus:85}),

  // Mind
  A("raven","Korppi","🪶","mind",{speed:50,strength:25,endurance:45,agility:75,focus:80}),
  A("octopus","Mustekala","🐙","mind",{speed:30,strength:30,endurance:40,agility:85,focus:90}),
  A("elephant-mind","Norsu (muisti)","🐘","mind",{speed:40,strength:99,endurance:70,agility:35,focus:85}),
  A("dolphin-mind","Delfiini (älykäs)","🐬","mind",{speed:60,strength:55,endurance:75,agility:80,focus:80}),
  A("sage","Viisas","🧙","mind",{speed:40,strength:40,endurance:60,agility:60,focus:95}),
  A("master","Mestari","🧠","mind",{speed:50,strength:50,endurance:60,agility:70,focus:100})
];

/* ---------- Laskenta ---------- */
function userVector(){
  const t = state.totals;
  const strength  = (t.legs*1.2 + t.push*1.0 + t.pull*1.0)/10;
  const agility   = t.pull*0.6 + t.legs*0.2;
  const focus     = t.mindMin/2;                           // 200min ~ 100
  const speed     = (t.runKm>0 && t.runMin>0) ? (t.runKm/t.runMin)*60 : 0;
  const endurance = t.runMin/5;                            // 500min ~ 100
  return {
    speed:clamp(speed), strength:clamp(strength),
    endurance:clamp(endurance), agility:clamp(agility), focus:clamp(focus)
  };
}
function cosSim(a,b){
  const A=[a.speed,a.strength,a.endurance,a.agility,a.focus];
  const B=[b.speed,b.strength,b.endurance,b.agility,b.focus];
  let dot=0, an=0, bn=0; for(let i=0;i<5;i++){ dot+=A[i]*B[i]; an+=A[i]*A[i]; bn+=B[i]*B[i]; }
  return (an===0||bn===0) ? 0 : dot/(Math.sqrt(an)*Math.sqrt(bn));
}
function bestAnimals(vec, n=5){
  return ANIMALS.map(x=>({x, s:cosSim(vec,x.attrs)})).sort((a,b)=>b.s-a.s).slice(0,n);
}

/* Progress (tasot) – reps + mieli + cardio */
const LVL = [0,120,300,600,1000,1500,2100,2800,3600,4500,5500,6600,7800,9100];
function points(){
  const t=state.totals;
  return t.legs + t.push + t.pull + (t.mindMin*0.5) + (t.runMin*0.6);
}
function pickLevel(pts){
  let lvl=0; for(let i=0;i<LVL.length;i++){ if(pts>=LVL[i]) lvl=i; }
  const curr=LVL[lvl], next=LVL[Math.min(lvl+1,LVL.length-1)];
  return { lvl, pct: clamp((pts-curr)/Math.max(1,next-curr)*100,0,100) };
}

/* ---------- UI & tapahtumat ---------- */
const avatar    = $("#avatar");
const animalName= $("#animalName");
const trackText = $("#track");
const hint      = $("#hint");
const bar       = $("#bar");
const chip = {
  legs: $("#chip-legs"), push: $("#chip-push"), pull: $("#chip-pull"),
  run:  $("#chip-run"),  mind: $("#chip-mind")
};
const toast = $("#toast"), toastText = $("#toastText");

document.querySelectorAll(".buttons button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const act = btn.dataset.act;
    if(act==="legs") return addReps("legs",10,"🦵 +10");
    if(act==="push") return addReps("push",10,"💪 +10");
    if(act==="pull") return addReps("pull",8,"🧗‍♂️ +8");
    if(act==="mind") return addMind(10,"🧘 +10min");
    if(act==="run")  return addRun(1,6,"🏃 +1km / 6min"); // ~10km/h
  });
  // run double-click = sprint boost
  btn.addEventListener("dblclick", ()=>{
    if(btn.dataset.act!=="run") return;
    addRun(0.2,0.5,"⚡ Sprintti +0.2km / 0.5min");
  });
});

$("#export").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=`evolve8_export_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},0);
  toastMsg("📤 JSON tallennettu");
});

$("#reset").addEventListener("click", ()=>{
  if(confirm("Nollataanko kaikki? Historia poistuu.")){ state=defaultState(); save(); render(); toastMsg("🔁 Nollattu"); }
});

/* ---------- Datatoiminnot ---------- */
function addReps(type, qty, label){
  state.totals[type]+=qty;
  state.history.push({ts:nowISO(),type,qty});
  particle(label); render();
}
function addMind(min,label){
  state.totals.mindMin+=min;
  state.history.push({ts:nowISO(),type:"mind",qty:min});
  particle(label); render();
}
function addRun(km,min,label){
  state.totals.runKm+=km; state.totals.runMin+=min;
  state.history.push({ts:nowISO(),type:"run",qty:km,meta:{min}});
  particle(label); render();
}

/* ---------- Render ---------- */
function render(){
  const vec = userVector();
  const ranked = bestAnimals(vec,5);
  const best = ranked[0]?.x || ANIMALS[0];

  // avatar & tekstit
  if(state.last.bestKey!==best.key){
    avatar.classList.remove("bump"); void avatar.offsetWidth; avatar.classList.add("bump");
    toastMsg(`🆙 Uusi muoto: ${best.emoji} ${best.name}`);
  }
  avatar.textContent = best.emoji;
  animalName.textContent = best.name;
  trackText.textContent = `Polku: ${trackLabel(best.track)}`;
  document.body.className = document.body.className.replace(/theme-\w+/g,'').trim() + ' ' + themeClass(best.track);

  // vihje: mikä ominaisuus kauimpana
  const diff={
    speed:Math.max(0,best.attrs.speed-vec.speed),
    strength:Math.max(0,best.attrs.strength-vec.strength),
    endurance:Math.max(0,best.attrs.endurance-vec.endurance),
    agility:Math.max(0,best.attrs.agility-vec.agility),
    focus:Math.max(0,best.attrs.focus-vec.focus)
  };
  const nextKey = Object.entries(diff).sort((a,b)=>b[1]-a[1])[0][0];
  const map={speed:"nopeutta 🏃",strength:"voimaa 💪",endurance:"kestävyyttä 🧭",agility:"ketteryyttä 🤸",focus:"mieltä 🧘"};
  hint.textContent = `Seuraavaksi: lisää ${map[nextKey]}`;

  // progress
  const pts = points(); const {lvl,pct} = pickLevel(pts);
  bar.value = Math.round(pct);

  // chipit
  const t=state.totals;
  chip.legs.textContent=`🦵 ${t.legs}`;
  chip.push.textContent=`💪 ${t.push}`;
  chip.pull.textContent=`🧗‍♂️ ${t.pull}`;
  chip.run.textContent =`🏃 ${t.runKm.toFixed(1)} km / ${Math.round(t.runMin)} min`;
  chip.mind.textContent=`🧘 ${Math.round(t.mindMin)} min`;

  // talteen
  state.last.bestKey=best.key; state.last.track=best.track; state.last.level=lvl; state.last.points=pts; save();
}

function trackLabel(t){ return ({speed:"Nopeus",strength:"Voima",endurance:"Kestävyys",agility:"Ketteryys",mind:"Mieli",balanced:"Tasapainoinen"})[t]||"Tasapainoinen"; }
function themeClass(t){ return ({speed:"theme-speed",strength:"theme-strength",endurance:"theme-endurance",agility:"theme-agility",mind:"theme-mind",balanced:"theme-speed"})[t]||"theme-speed"; }

/* ---------- Animaatiot ---------- */
function particle(text){
  const wrap=document.querySelector(".buttons").getBoundingClientRect();
  const p=document.createElement("div"); p.className="particle"; p.textContent=text;
  const x=wrap.left+wrap.width/2+(Math.random()*120-60); const y=wrap.top+10+(Math.random()*12-6);
  p.style.left=`${x}px`; p.style.top=`${y}px`; document.body.appendChild(p); setTimeout(()=>p.remove(),900);
}
let toastTimer=null;
function toastMsg(msg){ $("#toastText").textContent=msg; $("#toast").hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$("#toast").hidden=true,1700); }

/* ---------- Init ---------- */
render();

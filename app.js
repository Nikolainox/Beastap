const animals = [
  { name: "Mato", emoji: "🪱", s:1,f:1,e:1,a:1,m:1 },
  { name: "Konna", emoji: "🐸", s:2,f:2,e:3,a:2,m:2 },
  { name: "Kissa", emoji: "🐈", s:4,f:3,e:3,a:4,m:2 },
  { name: "Koira", emoji: "🐕", s:4,f:4,e:5,a:3,m:3 },
  { name: "Leijona", emoji: "🦁", s:8,f:9,e:7,a:8,m:5 },
  { name: "Korppi", emoji: "🐦‍⬛", s:6,f:3,e:6,a:7,m:8 },
  { name: "Gepardi", emoji: "🐆", s:10,f:8,e:6,a:9,m:5 },
  { name: "Delfiini", emoji: "🐬", s:8,f:5,e:8,a:8,m:9 },
  { name: "Pöllö", emoji: "🦉", s:4,f:3,e:5,a:4,m:10 }
];

let stats = JSON.parse(localStorage.getItem("evolveStats") || 
  '{"legs":0,"push":0,"pull":0,"run":0,"mind":0,"day":0}'
);

const xpBar = document.getElementById("xpBar");
const avatar = document.getElementById("avatar");
const nameEl = document.getElementById("animalName");

function calcVector() {
  return {
    s: stats.run / 10 + stats.legs / 20,
    f: stats.push / 10 + stats.pull / 10,
    e: stats.run / 5 + stats.legs / 10,
    a: stats.pull / 10 + stats.run / 10,
    m: stats.mind / 5
  };
}

function findAnimal(v) {
  let best = animals[0], bestScore = -999;
  for (const a of animals) {
    const score = a.s*v.s + a.f*v.f + a.e*v.e + a.a*v.a + a.m*v.m;
    if (score > bestScore) { best = a; bestScore = score; }
  }
  return best;
}

function updateUI() {
  const v = calcVector();
  const current = findAnimal(v);
  avatar.textContent = current.emoji;
  nameEl.textContent = current.name;
  document.getElementById("s-val").textContent = v.s.toFixed(1);
  document.getElementById("f-val").textContent = v.f.toFixed(1);
  document.getElementById("e-val").textContent = v.e.toFixed(1);
  document.getElementById("a-val").textContent = v.a.toFixed(1);
  document.getElementById("m-val").textContent = v.m.toFixed(1);
  const total = v.s+v.f+v.e+v.a+v.m;
  xpBar.value = Math.min(total,100);
  document.getElementById("chip-legs").textContent = `🦵 ${stats.legs}`;
  document.getElementById("chip-push").textContent = `💪 ${stats.push}`;
  document.getElementById("chip-pull").textContent = `🧗‍♂️ ${stats.pull}`;
  document.getElementById("chip-run").textContent = `🏃 ${stats.run} km`;
  document.getElementById("chip-mind").textContent = `🧘 ${stats.mind} min`;
}

document.querySelectorAll(".big").forEach(b=>{
  b.addEventListener("click",()=>{
    const act = b.dataset.act;
    if(act==="legs") stats.legs++;
    if(act==="push") stats.push++;
    if(act==="pull") stats.pull++;
    if(act==="run") stats.run+=0.5;
    if(act==="mind") stats.mind+=1;
    localStorage.setItem("evolveStats",JSON.stringify(stats));
    updateUI();
    toast("+"+act);
  });
});

function toast(txt) {
  const t=document.getElementById("toast");
  document.getElementById("toastText").textContent=txt;
  t.hidden=false;
  setTimeout(()=>t.hidden=true,1000);
}

document.getElementById("btn-export").onclick=()=>{
  const blob=new Blob([JSON.stringify(stats)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="evolve-data.json";
  a.click();
};

document.getElementById("btn-reset").onclick=()=>{
  if(confirm("Nollataanko tiedot?")){
    localStorage.removeItem("evolveStats");
    stats={legs:0,push:0,pull:0,run:0,mind:0};
    updateUI();
  }
};

updateUI();

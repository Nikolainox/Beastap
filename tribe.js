const tribes = {
  earth:{emoji:"🌍",xp:0},
  water:{emoji:"🌊",xp:0},
  air:{emoji:"🌬️",xp:0},
  mind:{emoji:"🧠",xp:0}
};

function getStats(){
  const s = localStorage.getItem("evolveStats");
  return s ? JSON.parse(s) : {legs:0,push:0,pull:0,run:0,mind:0};
}

const s = getStats();
const total = s.legs+s.push+s.pull+s.run+s.mind;
let myTribe = "earth";
if(s.run> s.legs && s.run> s.push) myTribe="air";
if(s.mind> s.run && s.mind> s.push) myTribe="mind";
if(s.run<s.mind && s.run<s.legs) myTribe="water";
tribes[myTribe].xp = total;

document.getElementById("tribeAvatar").textContent = tribes[myTribe].emoji;
document.getElementById("tribeName").textContent = myTribe.toUpperCase();
document.getElementById("tribeXP").textContent = "XP: "+total;
document.getElementById("tribeWeek").textContent = "Viikko "+(Math.ceil(total/50)||1);

const snapshot = {tribe:myTribe,xp:total};
document.getElementById("myTribe").value = JSON.stringify(snapshot);
document.getElementById("copyTribe").onclick = ()=>{
  navigator.clipboard.writeText(JSON.stringify(snapshot));
  alert("Kopioitu!");
};

document.getElementById("rankBtn").onclick=()=>{
  const peers=document.getElementById("peers").value.split("\n").filter(x=>x);
  const all=[snapshot];
  for(const p of peers){
    try{all.push(JSON.parse(p));}catch{}
  }
  all.sort((a,b)=>b.xp-a.xp);
  document.getElementById("rankList").innerHTML = all.map((t,i)=>`${i+1}. ${t.tribe} (${t.xp})`).join("<br>");
};

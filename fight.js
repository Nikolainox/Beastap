function getProfile() {
  const s = localStorage.getItem("evolveStats");
  return s ? JSON.parse(s) : {legs:0,push:0,pull:0,run:0,mind:0};
}

const myProfile = document.getElementById("myProfile");
myProfile.value = JSON.stringify(getProfile());
document.getElementById("copyMe").onclick = () => {
  navigator.clipboard.writeText(myProfile.value);
  alert("Kopioitu!");
};

document.getElementById("fightBtn").onclick = () => {
  try {
    const opp = JSON.parse(document.getElementById("oppProfile").value);
    const mine = getProfile();
    const winner = fight(mine, opp);
    document.getElementById("resultBox").textContent = winner.text;
    document.getElementById("resultMeta").textContent = winner.meta;
  } catch(e){
    alert("Virhe profiilissa!");
  }
};

function fight(p1,p2){
  const v1 = {s:p1.run/10, f:p1.push/5, e:p1.legs/5, a:p1.pull/5, m:p1.mind/2};
  const v2 = {s:p2.run/10, f:p2.push/5, e:p2.legs/5, a:p2.pull/5, m:p2.mind/2};
  let score1=0, score2=0;
  const keys = Object.keys(v1);
  for(const k of keys){
    if(v1[k]>v2[k]) score1++;
    if(v2[k]>v1[k]) score2++;
  }
  // Mieli voi kääntää tilanteen
  const mindDiff = v1.m - v2.m;
  if(Math.random() < Math.abs(mindDiff)*0.05){
    if(mindDiff>0) score1+=2; else score2+=2;
  }
  const res = score1>score2 ? "Voitto" : score2>score1 ? "Häviö" : "Tasapeli";
  const meta = `S1:${score1} S2:${score2} (Mieli vaikutus mahdollinen)`;
  return {text:res, meta};
}

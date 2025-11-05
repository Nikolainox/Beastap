// DNA intro – lukee käyttäjän treenidatan ja näyttää kromosomien kasvun

const STORAGE = "evolve-train-v2025";
const btn = document.getElementById("btn-continue");
const statusEl = document.getElementById("status");

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE)) || {};
  } catch {
    return {};
  }
}

function calculateGenes(data) {
  const t = data.totals || {};
  return {
    s: (t.runKm || 0) * 5 + (t.legs || 0) * 0.2,
    f: (t.push || 0) * 0.3 + (t.pull || 0) * 0.2 + (t.full || 0) * 0.3,
    e: (t.runMin || 0) * 0.4 + (t.legs || 0) * 0.1 + (t.full || 0) * 0.3,
    a: (t.pull || 0) * 0.3 + (t.core || 0) * 0.3 + (t.legs || 0) * 0.1,
    m: (t.mind || 0) * 1.2
  };
}

function clamp(v) { return Math.min(100, Math.round(v)); }

function renderGenes(g) {
  document.getElementById("gene-s").value = clamp(g.s);
  document.getElementById("gene-f").value = clamp(g.f);
  document.getElementById("gene-e").value = clamp(g.e);
  document.getElementById("gene-a").value = clamp(g.a);
  document.getElementById("gene-m").value = clamp(g.m);
}

function readyToEvolve(g) {
  return g.s > 40 && g.f > 40 && g.e > 40 && g.a > 40 && g.m > 40;
}

function main() {
  const data = loadData();
  const genes = calculateGenes(data);
  renderGenes(genes);

  if (readyToEvolve(genes)) {
    statusEl.textContent = "Kromosomit yhdistyvät...";
    setTimeout(() => {
      btn.hidden = false;
      btn.classList.add("fadein");
      statusEl.textContent = "Elämä on valmis. Avaa evoluutio.";
    }, 1500);
  } else {
    const needed = 40 - Math.min(genes.s, genes.f, genes.e, genes.a, genes.m);
    statusEl.textContent = `Kerää vielä n. ${Math.round(needed)} yksikköä energiaa.`;
  }

  btn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

main();

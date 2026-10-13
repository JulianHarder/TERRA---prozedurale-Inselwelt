/* Seitenleiste: Angaben zur Welt, Minikarte, Legende - und die kurze
 * Einblendung ueber der Karte.
 */
window.TERRA = window.TERRA || {};

TERRA.Seitenleiste = (function () {
  'use strict';

  var teile = {};
  var hinweisZeit = null;

  function starten() {
    teile.seed = document.getElementById('wert-seed');
    teile.regionen = document.getElementById('wert-regionen');
    teile.land = document.getElementById('wert-land');
    teile.dauer = document.getElementById('wert-dauer');
    teile.legende = document.getElementById('legende');
    teile.hinweis = document.getElementById('entdeckt-hinweis');
  }

  function zahlenAktualisieren(z) {
    if (!z.welt) return;
    var felder = z.welt.groesse * z.welt.groesse;
    teile.seed.textContent = z.welt.seed;
    teile.regionen.textContent = z.welt.anzahlRegionen;
    teile.land.textContent = (z.welt.landFelder / felder * 100).toFixed(0) + ' %';
    teile.dauer.textContent = Math.round(z.welt.dauerMs) + ' ms';
  }

  /* Legende: nur die Biome, die in dieser Welt wirklich vorkommen. */
  function legendeAufbauen(z) {
    var d = TERRA.daten.biome;
    var vorhanden = new Uint8Array(d.reihenfolge.length);
    for (var i = 0; i < z.welt.biom.length; i++) vorhanden[z.welt.biom[i]] = 1;

    teile.legende.innerHTML = '';
    for (var n = 0; n < d.reihenfolge.length; n++) {
      if (!vorhanden[n]) continue;
      var info = d.liste[d.reihenfolge[n]];
      var li = document.createElement('li');
      var farbe = document.createElement('i');
      farbe.style.background = info.farbe;
      li.appendChild(farbe);
      li.appendChild(document.createTextNode(info.name));
      teile.legende.appendChild(li);
    }
  }

  /* Kurze Einblendung ueber der Karte. */
  function hinweis(text) {
    if (!teile.hinweis) return;
    teile.hinweis.textContent = text;
    teile.hinweis.classList.add('sichtbar');
    if (hinweisZeit) window.clearTimeout(hinweisZeit);
    hinweisZeit = window.setTimeout(function () {
      teile.hinweis.classList.remove('sichtbar');
    }, 2600);
  }

  function neueWelt(z) {
    legendeAufbauen(z);
    zahlenAktualisieren(z);
  }

  return {
    starten: starten,
    neueWelt: neueWelt,
    zahlenAktualisieren: zahlenAktualisieren,
    legendeAufbauen: legendeAufbauen,
    hinweis: hinweis
  };
})();

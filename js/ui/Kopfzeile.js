/* Kopfzeile: Seed-Eingabe, Knoepfe, PNG-Export, Teilen-Link. */
window.TERRA = window.TERRA || {};

TERRA.Kopfzeile = (function () {
  'use strict';

  var feld, form;

  function starten(aufWelt) {
    form = document.getElementById('seed-form');
    feld = document.getElementById('seed-feld');

    form.addEventListener('submit', function (ereignis) {
      ereignis.preventDefault();
      var wort = feld.value.trim();
      if (wort) aufWelt(wort);
      feld.blur();
    });

    document.getElementById('knopf-wuerfel').addEventListener('click', function () {
      feld.value = TERRA.Zufall.zufallsWort();
      aufWelt(feld.value);
    });

    document.getElementById('knopf-png').addEventListener('click', function () {
      pngSpeichern(TERRA.Zustand);
    });

    document.getElementById('knopf-link').addEventListener('click', function () {
      linkKopieren(TERRA.Zustand);
    });
  }

  function seedSetzen(wort) {
    if (feld) feld.value = wort;
  }

  /* Seed aus der Adresse lesen: ?seed=nordwind oder #seed=nordwind.
   * Beides, weil ueber file:// je nach Browser nur eines davon ankommt. */
  function seedAusAdresse() {
    var treffer = /[?#&]seed=([^&]+)/.exec(window.location.search + window.location.hash);
    return treffer ? decodeURIComponent(treffer[1]) : null;
  }

  function linkKopieren(z) {
    if (!z.welt) return;
    var basis = window.location.href.split('#')[0].split('?')[0];
    var link = basis + '?seed=' + encodeURIComponent(z.welt.seed);

    if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
      window.navigator.clipboard.writeText(link).then(function () {
        TERRA.Seitenleiste.hinweis('Link kopiert');
      }, function () {
        TERRA.Seitenleiste.hinweis('Seed: ' + z.welt.seed);
      });
    } else {
      TERRA.Seitenleiste.hinweis('Seed: ' + z.welt.seed);
    }
  }

  /* Die Karte als Bild speichern, dreifach vergroessert und mit den Namen
   * aller Regionen beschriftet. */
  function pngSpeichern(z) {
    if (!z.welt) return;
    var N = z.welt.groesse;
    var skala = 3;
    var leinwand = document.createElement('canvas');
    leinwand.width = N * skala;
    leinwand.height = N * skala;
    var ctx = leinwand.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(TERRA.Ansicht.gelaende(), 0, 0, N * skala, N * skala);

    if (z.einstellungen.namen) beschriften(ctx, z, skala);

    leinwand.toBlob(function (brocken) {
      if (!brocken) { TERRA.Seitenleiste.hinweis('Export nicht moeglich'); return; }
      var adresse = window.URL.createObjectURL(brocken);
      var a = document.createElement('a');
      a.href = adresse;
      a.download = 'terra-' + z.welt.seed.replace(/[^\w-]+/g, '_') + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { window.URL.revokeObjectURL(adresse); }, 4000);
      TERRA.Seitenleiste.hinweis('Karte gespeichert');
    }, 'image/png');
  }

  function beschriften(ctx, z, skala) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    var regionen = z.welt.inseln.concat(z.welt.merkmale);
    for (var i = 0; i < regionen.length; i++) {
      var region = regionen[i];
      var gross = region.art === 'festland' || region.art === 'insel';
      ctx.font = (gross ? 'bold 15px ' : '12px ') + 'Georgia, serif';
      ctx.strokeStyle = 'rgba(8, 11, 16, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.fillStyle = gross ? '#fff4dd' : 'rgba(255, 240, 215, 0.92)';
      var text = gross ? region.name.toUpperCase() : region.name;
      var x = region.mitte.x * skala;
      var y = region.mitte.y * skala;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }

    // Kopfzeile auf dem Bild
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.strokeStyle = 'rgba(8, 11, 16, 0.85)';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#ffffff';
    var zeile = 'TERRA  ·  Seed: ' + z.welt.seed + '  ·  ' +
      z.welt.anzahlRegionen + ' Regionen';
    ctx.strokeText(zeile, 18, 26);
    ctx.fillText(zeile, 18, 26);
  }

  return {
    starten: starten,
    seedSetzen: seedSetzen,
    seedAusAdresse: seedAusAdresse,
    pngSpeichern: pngSpeichern,
    linkKopieren: linkKopieren
  };
})();

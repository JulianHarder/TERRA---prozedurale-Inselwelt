/* Werkstatt: die Generierung von innen.
 *
 * Zeigt die Zwischenschritte als eigene Bilder und laesst die Regler
 * verstellen, aus denen die Welt entsteht. Wer hier einmal am Regler
 * "Inselform" gezogen hat, versteht die Inselmaske besser als nach jeder
 * Erklaerung.
 *
 * Jede Reglerbewegung erzeugt die Welt neu. Die Feldgroesse ist die
 * Ausnahme: sie aendert nur die Darstellung, nicht die Welt.
 */
window.TERRA = window.TERRA || {};

TERRA.Werkstatt = (function () {
  'use strict';

  var fenster, aufNeu, aufDarstellung;
  var warten = null;

  // Welche Zwischenschritte gezeigt werden, in der Reihenfolge der Entstehung.
  var BILDER = [
    { id: 'lage1',    titel: '1 · Eine Rauschlage',  text: 'Die groebste Lage allein. Weiche Flecken, noch keine Landschaft.' },
    { id: 'fbm',      titel: '2 · Alle Lagen (fBm)', text: 'Fünf Lagen addiert, jede doppelt so fein und halb so stark.' },
    { id: 'maske',    titel: '3 · Inselmaske',       text: 'Mitte 1, Rand 0 - der Abstand ist mit Rauschen verzerrt.' },
    { id: 'hoehe',    titel: '4 · Höhe',             text: 'Lagen × Maske, danach auf die volle Spanne gestreckt.' },
    { id: 'feuchte',  titel: '5 · Feuchtigkeit',     text: 'Zweite, unabhängige Rauschkarte. Hell = feucht.' },
    { id: 'biomRoh',  titel: '6 · Biome',            text: 'Höhe × Feuchtigkeit in der Tabelle nachgeschlagen.' },
    { id: 'fluss',    titel: '7 · Flüsse',           text: 'Einzugsgebiet je Feld. Hell = viel Land entwässert hierhin.' },
    { id: 'fertig',   titel: '8 · Fertige Karte',    text: 'Flüsse und Seen eingetragen, Relief und Küstenkante dazu.' }
  ];

  // Die Regler. 'neu' bedeutet: Welt muss neu erzeugt werden.
  var REGLER = [
    { schluessel: 'lagen',         titel: 'Rauschlagen',   min: 1,    max: 8,   schritt: 1,    neu: true,  nach: 0 },
    { schluessel: 'frequenz',      titel: 'Grundfrequenz', min: 1,    max: 9,   schritt: 0.5,  neu: true,  nach: 1 },
    { schluessel: 'inselform',     titel: 'Inselform',     min: 0,    max: 1,   schritt: 0.02, neu: true,  nach: 2 },
    { schluessel: 'meeresspiegel', titel: 'Meeresspiegel', min: 0.08, max: 0.6, schritt: 0.01, neu: true,  nach: 2 },
    { schluessel: 'umverteilung',  titel: 'Umverteilung',  min: 0.5,  max: 2.2, schritt: 0.05, neu: true,  nach: 2 },
    { schluessel: 'flussAb',       titel: 'Flussdichte',   min: 15,   max: 400, schritt: 5,    neu: true,  nach: 0, umkehren: true },
    { schluessel: 'feldPixel',     titel: 'Feldgröße (px)',min: 1,    max: 12,  schritt: 1,    neu: false, nach: 0 }
  ];

  function starten(aufNeuErzeugen, aufDarstellungAendern) {
    aufNeu = aufNeuErzeugen;
    aufDarstellung = aufDarstellungAendern;
    fenster = document.getElementById('fenster-werkstatt');

    reglerAufbauen();
    bilderAufbauen();

    document.getElementById('knopf-werkstatt').addEventListener('click', umschalten);
    document.getElementById('werkstatt-zu').addEventListener('click', schliessen);
    document.getElementById('werkstatt-zuruecksetzen').addEventListener('click', zuruecksetzen);
    fenster.addEventListener('click', function (ereignis) {
      if (ereignis.target === fenster) schliessen();
    });
  }

  function bilderAufbauen() {
    var behaelter = document.getElementById('werkstatt-bilder');
    behaelter.innerHTML = '';
    BILDER.forEach(function (b) {
      var figur = document.createElement('figure');
      var leinwand = document.createElement('canvas');
      leinwand.id = 'schritt-' + b.id;
      leinwand.width = 128;
      leinwand.height = 128;
      var beschriftung = document.createElement('figcaption');
      var fett = document.createElement('b');
      fett.textContent = b.titel;
      beschriftung.appendChild(fett);
      beschriftung.appendChild(document.createTextNode(b.text));
      figur.appendChild(leinwand);
      figur.appendChild(beschriftung);
      behaelter.appendChild(figur);
    });
  }

  function reglerAufbauen() {
    var behaelter = document.getElementById('werkstatt-regler');
    behaelter.innerHTML = '';
    var e = TERRA.Zustand.einstellungen || TERRA.Zustand.standard;

    REGLER.forEach(function (r) {
      var label = document.createElement('label');
      var kopf = document.createElement('b');
      kopf.appendChild(document.createTextNode(r.titel));
      var wert = document.createElement('i');
      wert.id = 'reglerwert-' + r.schluessel;
      wert.textContent = formatieren(e[r.schluessel], r.nach);
      kopf.appendChild(wert);

      var schieber = document.createElement('input');
      schieber.type = 'range';
      schieber.min = r.min;
      schieber.max = r.max;
      schieber.step = r.schritt;
      schieber.value = e[r.schluessel];
      schieber.id = 'regler-' + r.schluessel;

      schieber.addEventListener('input', function () {
        var neuerWert = parseFloat(schieber.value);
        wert.textContent = formatieren(neuerWert, r.nach);
        TERRA.Zustand.einstellungen[r.schluessel] = neuerWert;
        if (r.neu) spaeterNeu();
        else aufDarstellung();
      });

      label.appendChild(kopf);
      label.appendChild(schieber);
      behaelter.appendChild(label);
    });

    // Reliefschattierung an/aus
    var schalter = document.createElement('label');
    schalter.className = 'schalter';
    var kasten = document.createElement('input');
    kasten.type = 'checkbox';
    kasten.id = 'regler-relief';
    kasten.checked = !!e.relief;
    kasten.addEventListener('change', function () {
      TERRA.Zustand.einstellungen.relief = kasten.checked;
      spaeterNeu();
    });
    schalter.appendChild(kasten);
    schalter.appendChild(document.createTextNode('Reliefschattierung'));
    behaelter.appendChild(schalter);
  }

  function formatieren(wert, nach) {
    return nach ? Number(wert).toFixed(nach) : String(Math.round(wert));
  }

  /* Nicht bei jedem Reglerzucken neu rechnen - 160 ms Ruhe abwarten. */
  function spaeterNeu() {
    if (warten) window.clearTimeout(warten);
    warten = window.setTimeout(function () {
      warten = null;
      aufNeu();
    }, 160);
  }

  function zuruecksetzen() {
    var s = TERRA.Zustand.standard;
    for (var k in s) {
      if (s.hasOwnProperty(k)) TERRA.Zustand.einstellungen[k] = s[k];
    }
    reglerAufbauen();
    aufNeu();
  }

  function umschalten() {
    if (fenster.hidden) oeffnen(); else schliessen();
  }

  function oeffnen() {
    fenster.hidden = false;
    zeichnen(TERRA.Zustand);
  }

  function schliessen() { fenster.hidden = true; }
  function offen() { return !fenster.hidden; }

  // --- Die Zwischenbilder zeichnen ---

  function graustufen(id, feld, N, farbe) {
    var leinwand = document.getElementById('schritt-' + id);
    if (!leinwand || !feld) return;
    zeichneFeld(leinwand, N, function (i) {
      var v = feld[i];
      if (v < 0) v = 0; else if (v > 1) v = 1;
      var g = Math.round(v * 255);
      return farbe ? [Math.round(g * farbe[0]), Math.round(g * farbe[1]), Math.round(g * farbe[2])] : [g, g, g];
    });
  }

  function biomBild(id, biomKarte, N) {
    var leinwand = document.getElementById('schritt-' + id);
    if (!leinwand || !biomKarte) return;
    var d = TERRA.daten.biome;
    zeichneFeld(leinwand, N, function (i) {
      return d.farbenRGB[d.idVonNummer(biomKarte[i])];
    });
  }

  /* Einzugsgebiete als Bild.
   *
   * Logarithmisch, nicht linear: die Werte reichen von 1 (ein einzelnes Feld
   * entwaessert hierhin) bis ueber 3000 an der Muendung. Linear skaliert
   * waere das Bild eine fast einfarbige Flaeche, in der man nichts erkennt -
   * logarithmisch treten die Flusslaeufe als helle Adern hervor. */
  function flussBild(id, fluss, N) {
    var leinwand = document.getElementById('schritt-' + id);
    if (!leinwand || !fluss) return;

    var max = 1;
    for (var k = 0; k < fluss.length; k++) if (fluss[k] > max) max = fluss[k];
    var nenner = Math.log(1 + max);

    zeichneFeld(leinwand, N, function (i) {
      if (!fluss[i]) return [6, 10, 16];
      var v = Math.log(1 + fluss[i]) / nenner;
      var g = Math.round(v * 255);
      return [Math.round(g * 0.30), Math.round(g * 0.62), Math.max(24, g)];
    });
  }

  /* Ein N x N grosses Feld in ein 128 x 128 Canvas zeichnen (jedes n-te Feld). */
  function zeichneFeld(leinwand, N, farbeVon) {
    var ziel = leinwand.width;
    var ctx = leinwand.getContext('2d');
    var bild = ctx.createImageData(ziel, ziel);
    var px = bild.data;
    var schritt = N / ziel;

    for (var y = 0; y < ziel; y++) {
      var qy = Math.min(N - 1, Math.floor(y * schritt));
      for (var x = 0; x < ziel; x++) {
        var qx = Math.min(N - 1, Math.floor(x * schritt));
        var rgb = farbeVon(qy * N + qx) || [0, 0, 0];
        var p = (y * ziel + x) * 4;
        px[p] = rgb[0]; px[p + 1] = rgb[1]; px[p + 2] = rgb[2]; px[p + 3] = 255;
      }
    }
    ctx.putImageData(bild, 0, 0);
  }

  function zeichnen(z) {
    if (!z.welt || fenster.hidden) return;
    var N = z.welt.groesse;
    var s = z.welt.schritte || {};
    var e = z.einstellungen;

    // Schritt 1: eine einzelne Lage, hier erst erzeugt - sie wird nur
    // in der Werkstatt gebraucht, nicht fuer die Welt selbst.
    var nurEine = TERRA.Rauschen.nurLage(z.welt.seedZahl, 0, e.frequenz, e.lakunaritaet);
    var eineLage = new Float32Array(N * N);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) eineLage[y * N + x] = nurEine(x / N, y / N);
    }

    graustufen('lage1', eineLage, N);
    graustufen('fbm', s.rohesRauschen, N);
    graustufen('maske', s.inselmaske, N);
    graustufen('hoehe', s.hoehe, N);
    graustufen('feuchte', s.feuchtigkeit, N, [0.45, 0.75, 1.0]);
    biomBild('biomRoh', s.biomOhneFluss, N);
    flussBild('fluss', s.fluss, N);
    biomBild('fertig', z.welt.biom, N);

    document.getElementById('werkstatt-dauer').textContent =
      'Erzeugt in ' + z.welt.dauerMs.toFixed(0) + ' ms · ' +
      (N * N).toLocaleString('de-DE') + ' Felder · ' +
      z.welt.anzahlRegionen + ' Regionen';
  }

  return {
    starten: starten,
    zeichnen: zeichnen,
    oeffnen: oeffnen,
    schliessen: schliessen,
    umschalten: umschalten,
    offen: offen,
    reglerAufbauen: reglerAufbauen
  };
})();

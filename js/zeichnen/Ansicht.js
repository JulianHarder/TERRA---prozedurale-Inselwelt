/* Ansicht: Kamera und Zusammenspiel der Ebenen.
 *
 * Zwei Canvas liegen uebereinander und sind immer genau so gross wie das
 * Fenster. Gezeichnet wird daraus ein Ausschnitt der Welt:
 *
 *   Weltkoordinaten (Feld 0..255)  --Kamera-->  Bildschirmpunkte
 *
 * Die Kamera haengt am Blickpunkt (Zustand.blick), den man mit der Maus
 * zieht, und wird am Weltrand angehalten. Ist die Welt kleiner als das
 * Fenster, wird sie mittig gesetzt.
 *
 * Wichtig fuer die Bildrate: das Gelaende wird nur bei einer neuen Welt
 * erzeugt und danach nur noch als fertiges Bild verschoben. Pro Bild bleiben
 * ein drawImage und die Namen uebrig.
 */
window.TERRA = window.TERRA || {};

TERRA.Ansicht = (function () {
  'use strict';

  var ZOOM_MIN = 1, ZOOM_MAX = 12;

  var rahmen, ebenen = {}, ctx = {};
  var gelaendeQuelle = null;
  var dpr = 1;
  var breite = 0, hoehe = 0;     // Geraetepunkte
  var cssBreite = 0, cssHoehe = 0;

  var sicht = { kamX: 0, kamY: 0, feldPixel: 6, dpr: 1, breiteFelder: 0, hoeheFelder: 0 };

  function starten() {
    rahmen = document.getElementById('karte-rahmen');
    ebenen.gelaende = document.getElementById('ebene-gelaende');
    ebenen.oben = document.getElementById('ebene-oben');

    ctx.gelaende = ebenen.gelaende.getContext('2d');
    ctx.oben = ebenen.oben.getContext('2d');

    window.addEventListener('resize', groesseAnpassen);
    groesseAnpassen();
  }

  function groesseAnpassen() {
    dpr = window.devicePixelRatio || 1;
    cssBreite = rahmen.clientWidth;
    cssHoehe = rahmen.clientHeight;
    breite = Math.max(1, Math.round(cssBreite * dpr));
    hoehe = Math.max(1, Math.round(cssHoehe * dpr));

    ['gelaende', 'oben'].forEach(function (k) {
      ebenen[k].width = breite;
      ebenen[k].height = hoehe;
    });

    // Gelaende hart vergroessern, damit die Felder scharfe Kanten behalten.
    ctx.gelaende.imageSmoothingEnabled = false;
    sicht.dpr = dpr;
  }

  function neueWelt(welt) {
    gelaendeQuelle = TERRA.GelaendeEbene.erzeuge(welt);
    groesseAnpassen();
  }

  /* Feldgroesse so waehlen, dass die ganze Welt ins Fenster passt.
   *
   * Bewusst keine ganze Zahl: bei 256 Feldern in einem 508 Punkte breiten
   * Fenster waeren das 1,98 Punkte je Feld. Abgerundet auf 1 waere die Karte
   * nur halb so gross wie noetig, aufgerundet auf 2 wuerde sie am Rand
   * beschnitten. Also die Kommazahl nehmen. */
  function einpassen(z) {
    if (!z.welt || !cssBreite || !cssHoehe) return;
    var passend = Math.min(cssBreite, cssHoehe) / z.welt.groesse;
    z.einstellungen.feldPixel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(passend * 100) / 100));
    groesseAnpassen();
  }

  /* Hinein- oder herauszoomen. Rastet auf ganze Punkte ein - nach dem
   * Einpassen steht dort sonst eine Kommazahl, und die Karte wirkt beim
   * Zoomen leicht unscharf.
   *
   * punkt ist die Stelle im Kartenrahmen, die stehen bleiben soll (das
   * Mausrad gibt die Zeigerposition mit). Ohne punkt - also bei + und - auf
   * der Tastatur - bleibt die Bildmitte stehen. */
  function zoomen(z, stufen, punkt) {
    if (!z.welt) return;
    var jetzt = z.einstellungen.feldPixel;
    var neu = stufen > 0 ? Math.floor(jetzt) + stufen : Math.ceil(jetzt) + stufen;
    neu = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, neu));
    if (neu === jetzt) return;

    if (punkt) blickNachziehen(z, punkt, jetzt, neu);
    z.einstellungen.feldPixel = neu;
    groesseAnpassen();
  }

  /* Den Blick so verschieben, dass unter dem Zeiger dasselbe Feld liegen
   * bleibt wie vor dem Zoom.
   *
   * Erst das Weltfeld unter dem Zeiger bestimmen, dann ausrechnen, wo die
   * Bildmitte liegen muss, damit dieses Feld bei der neuen Feldgroesse
   * wieder genau dort erscheint. Gerechnet wird aus z.blick heraus und nicht
   * aus der zuletzt gezeichneten Kamera - sonst verrutscht es, wenn mehrere
   * Raddrehungen in dasselbe Bild fallen. */
  function blickNachziehen(z, punkt, alt, neu) {
    var N = z.welt.groesse;
    var breiteFelder = cssBreite / alt;
    var hoeheFelder = cssHoehe / alt;

    var kamX = geklemmt(z.blick.x, breiteFelder, N) - breiteFelder / 2;
    var kamY = geklemmt(z.blick.y, hoeheFelder, N) - hoeheFelder / 2;

    var feldX = kamX + punkt.x / alt;
    var feldY = kamY + punkt.y / alt;

    z.blick.x = feldX + (cssBreite / 2 - punkt.x) / neu;
    z.blick.y = feldY + (cssHoehe / 2 - punkt.y) / neu;
  }

  /* Kamera aus dem Blickpunkt berechnen.
   *
   * Der Blick wird dabei in die Welt zurueckgeholt. Das muss hier passieren
   * und nicht beim Ziehen: sonst wandert er weiter, waehrend die Karte schon
   * am Rand steht, und man muss erst ein Stueck ins Leere zurueckziehen,
   * bevor sich wieder etwas bewegt. */
  function kameraSetzen(z) {
    var N = z.welt.groesse;
    sicht.feldPixel = z.einstellungen.feldPixel;
    sicht.breiteFelder = cssBreite / sicht.feldPixel;
    sicht.hoeheFelder = cssHoehe / sicht.feldPixel;

    z.blick.x = geklemmt(z.blick.x, sicht.breiteFelder, N);
    z.blick.y = geklemmt(z.blick.y, sicht.hoeheFelder, N);

    sicht.kamX = z.blick.x - sicht.breiteFelder / 2;
    sicht.kamY = z.blick.y - sicht.hoeheFelder / 2;
    z.kamera.x = sicht.kamX;
    z.kamera.y = sicht.kamY;
  }

  /* Mittelpunkt so begrenzen, dass der Ausschnitt in der Welt bleibt.
   * Passt die ganze Welt ins Fenster, steht sie mittig. */
  function geklemmt(mitte, sichtFelder, N) {
    if (sichtFelder >= N) return N / 2;
    var halb = sichtFelder / 2;
    return Math.max(halb, Math.min(N - halb, mitte));
  }

  /* Einen Weltausschnitt auf eine Ebene legen.
   *
   * Der Ausschnitt wird auf ganze Felder abgerundet und der Rest ueber einen
   * negativen Zielversatz ausgeglichen. So bleibt das Bild bei der Bewegung
   * ruhig, statt bei jedem Teilschritt zu flimmern. */
  function ausschnitt(zielCtx, quelle, N) {
    var fp = sicht.feldPixel * dpr;
    var sx = Math.floor(sicht.kamX);
    var sy = Math.floor(sicht.kamY);
    var versatzX = -(sicht.kamX - sx) * fp;
    var versatzY = -(sicht.kamY - sy) * fp;
    var sw = Math.ceil(breite / fp) + 2;
    var sh = Math.ceil(hoehe / fp) + 2;

    if (sx + sw > N) sw = N - sx;
    if (sy + sh > N) sh = N - sy;
    if (sw <= 0 || sh <= 0) return;

    zielCtx.drawImage(quelle, sx, sy, sw, sh, versatzX, versatzY, sw * fp, sh * fp);
  }

  function zeichnen(z) {
    if (!z.welt || !gelaendeQuelle) return;
    var N = z.welt.groesse;
    kameraSetzen(z);

    ctx.gelaende.fillStyle = '#0a0d12';
    ctx.gelaende.fillRect(0, 0, breite, hoehe);
    ausschnitt(ctx.gelaende, gelaendeQuelle, N);

    ctx.oben.clearRect(0, 0, breite, hoehe);
    TERRA.Beschriftung.zeichnen(ctx.oben, z, sicht);
  }

  function daten() { return sicht; }
  function gelaende() { return gelaendeQuelle; }

  return {
    starten: starten,
    neueWelt: neueWelt,
    einpassen: einpassen,
    zoomen: zoomen,
    zeichnen: zeichnen,
    groesseAnpassen: groesseAnpassen,
    daten: daten,
    gelaende: gelaende
  };
})();

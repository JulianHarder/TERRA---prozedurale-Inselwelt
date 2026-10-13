/* Gelaende-Ebene: die farbige Landkarte.
 *
 * Gezeichnet wird in ein eigenes Canvas mit genau einem Bildpunkt je Feld
 * (256 x 256). Das wird spaeter vergroessert auf den Bildschirm gelegt.
 * Der Grund: 65.536 einzelne Rechtecke zu fuellen dauert Millisekunden, ein
 * ImageData-Feld direkt zu beschreiben dagegen kaum messbar lange - und
 * dieses Bild entsteht ohnehin nur einmal je Welt, nicht pro Bild.
 *
 * Drei Kniffe heben die Karte ueber reine Flaechenfarben:
 *   Relief   - Felder, die nach Suedosten abfallen, werden heller; das laesst
 *              Gebirge auch in der Draufsicht plastisch wirken.
 *   Tiefe    - das Meer nimmt seine Farbe nicht aus drei Flaechenstufen,
 *              sondern aus einem durchgehenden Verlauf (siehe wasserRampe).
 *   Schaum   - Wasser am Ufer wird aufgehellt. Das ersetzt die harte dunkle
 *              Kuestenlinie, die hier frueher die einzige Kante war.
 */
window.TERRA = window.TERRA || {};

TERRA.GelaendeEbene = (function () {
  'use strict';

  var LICHT = 9;           // Staerke der Reliefschattierung
  var KUESTE = 0.94;       // Abdunkelung der Landkante - nur noch ein Hauch,
                           // den Rand zeichnet jetzt der Schaum davor
  var TIEFE_DUNKEL = 0.86; // Tiefseeblau am tiefsten Punkt, Anteil der Biomfarbe
  var SCHAUM_NAH = 0.38;   // Wasserfeld direkt am Land
  var SCHAUM_FERN = 0.14;  // ein Feld weiter draussen

  function erzeuge(welt) {
    var N = welt.groesse;
    var d = TERRA.daten.biome;
    var ms = welt.einstellungen.meeresspiegel;
    var relief = welt.einstellungen.relief;
    var hoehe = welt.hoehe;
    var biom = welt.biom;

    var rampe = wasserRampe();
    var schaum = d.schaumRGB;

    var leinwand = document.createElement('canvas');
    leinwand.width = N;
    leinwand.height = N;
    var ctx = leinwand.getContext('2d');
    var bild = ctx.createImageData(N, N);
    var px = bild.data;

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var i = y * N + x;
        var p = i * 4;
        var rot, gruen, blau;

        if (hoehe[i] >= ms) {
          // --- Land, Fluesse und Seen ---
          var rgb = d.farbenRGB[d.idVonNummer(biom[i])];
          var f = 1;

          if (relief) {
            // Gefaelle nach Osten und Sueden; Licht kommt von Nordwesten.
            var links  = x > 0     ? hoehe[i - 1] : hoehe[i];
            var rechts = x < N - 1 ? hoehe[i + 1] : hoehe[i];
            var oben   = y > 0     ? hoehe[i - N] : hoehe[i];
            var unten  = y < N - 1 ? hoehe[i + N] : hoehe[i];
            f = 1 + ((rechts - links) + (unten - oben)) * LICHT;
            if (f < 0.6) f = 0.6; else if (f > 1.45) f = 1.45;
          }

          // Kante zum Wasser
          if ((x > 0     && hoehe[i - 1] < ms) ||
              (x < N - 1 && hoehe[i + 1] < ms) ||
              (y > 0     && hoehe[i - N] < ms) ||
              (y < N - 1 && hoehe[i + N] < ms)) {
            f *= KUESTE;
          }

          rot = rgb[0] * f;
          gruen = rgb[1] * f;
          blau = rgb[2] * f;
        } else {
          // --- Meer ---
          var tiefeT = ms > 0 ? hoehe[i] / ms : 1;
          if (tiefeT < 0) tiefeT = 0; else if (tiefeT > 1) tiefeT = 1;
          var r3 = ((tiefenKurve(tiefeT) * 255) | 0) * 3;
          rot = rampe[r3];
          gruen = rampe[r3 + 1];
          blau = rampe[r3 + 2];

          /* Gischt. Zwei Ringe statt einem: ein einzelner waere bei starkem
           * Zoom eine gezogene Linie, zwei abgestufte wirken wie Brandung. */
          var anteil = 0;
          if (landImRing(hoehe, N, ms, x, y, 1)) anteil = SCHAUM_NAH;
          else if (landImRing(hoehe, N, ms, x, y, 2)) anteil = SCHAUM_FERN;

          if (anteil > 0) {
            rot += (schaum[0] - rot) * anteil;
            gruen += (schaum[1] - gruen) * anteil;
            blau += (schaum[2] - blau) * anteil;
          }
        }

        px[p]     = begrenzen(rot);
        px[p + 1] = begrenzen(gruen);
        px[p + 2] = begrenzen(blau);
        px[p + 3] = 255;
      }
    }

    ctx.putImageData(bild, 0, 0);
    return leinwand;
  }

  /* Nachschlagetabelle fuer die Meeresfarbe: 256 Stufen vom tiefsten Punkt
   * (Index 0) bis zur Wasserkante (Index 255).
   *
   * Die Farben werden nicht neu erfunden, sondern aus den drei Wasserbiomen
   * ueberblendet - jedes sitzt in der Mitte seines Tiefenbandes aus
   * daten.biome.wasserStufen. Dadurch kommen genau die Farben vor, die auch
   * in der Legende stehen, nur ohne Stufen dazwischen. Weil die Baender
   * Anteile des Meeresspiegels sind, stimmt die Rampe auch dann noch, wenn
   * der Regler in der Werkstatt den Meeresspiegel verschiebt.
   *
   * Der Index ist nicht die Tiefe selbst, sondern ihre Wurzel (tiefenKurve).
   * Grund: die Inselmaske drueckt das offene Meer fast auf null, gemessen
   * liegen rund 60 Prozent aller Wasserfelder im untersten Zehntel. Linear
   * bekaeme diese halbe Weltflaeche einen einzigen Farbwert und das Meer
   * waere wieder eine tote Flaeche. Die Stuetzpunkte werden mit derselben
   * Kurve verschoben - dadurch bleiben die Biomgrenzen exakt dort, wo
   * daten.biome sie setzt, nur feiner aufgeloest.
   */
  function wasserRampe() {
    var d = TERRA.daten.biome;
    var stufen = d.wasserStufen;
    var punkte = [];

    // Ganz unten etwas dunkler als das Tiefseeblau, sonst ist das offene
    // Meer eine einzige tote Flaeche.
    punkte.push({ t: 0, rgb: gedimmt(d.farbenRGB[stufen[0].biom], TIEFE_DUNKEL) });

    var unten = 0;
    for (var s = 0; s < stufen.length; s++) {
      var oben = Math.min(1, stufen[s].bis);
      punkte.push({
        t: tiefenKurve((unten + oben) / 2),
        rgb: d.farbenRGB[stufen[s].biom]
      });
      unten = oben;
    }
    punkte.push({ t: 1, rgb: d.farbenRGB[stufen[stufen.length - 1].biom] });

    var rampe = new Uint8Array(256 * 3);
    var k = 0;
    for (var i = 0; i < 256; i++) {
      var t = i / 255;
      while (k < punkte.length - 2 && t > punkte[k + 1].t) k++;
      var a = punkte[k], b = punkte[k + 1];
      var f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
      if (f < 0) f = 0; else if (f > 1) f = 1;
      rampe[i * 3]     = begrenzen(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f);
      rampe[i * 3 + 1] = begrenzen(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f);
      rampe[i * 3 + 2] = begrenzen(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f);
    }
    return rampe;
  }

  /* Tiefe -> Rampenstelle. Siehe wasserRampe. */
  function tiefenKurve(t) {
    return Math.sqrt(t);
  }

  /* Liegt auf dem Quadratring im Abstand r um (x, y) Land?
   * Nur der Rand des Quadrats wird geprueft - das Innere hat der Aufrufer
   * mit dem kleineren Ring schon abgehakt. */
  function landImRing(hoehe, N, ms, x, y, r) {
    var x0 = x - r, x1 = x + r;
    var y0 = y - r, y1 = y + r;

    for (var nx = x0; nx <= x1; nx++) {
      if (nx < 0 || nx >= N) continue;
      var rand = (nx === x0 || nx === x1);
      for (var ny = y0; ny <= y1; ny++) {
        if (!rand && ny !== y0 && ny !== y1) continue;
        if (ny < 0 || ny >= N) continue;
        if (hoehe[ny * N + nx] >= ms) return true;
      }
    }
    return false;
  }

  function gedimmt(rgb, f) {
    return [rgb[0] * f, rgb[1] * f, rgb[2] * f];
  }

  function begrenzen(v) {
    return v < 0 ? 0 : (v > 255 ? 255 : v | 0);
  }

  return { erzeuge: erzeuge, LICHT: LICHT };
})();

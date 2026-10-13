/* Den Ausschnitt verschieben.
 *
 * Es gibt keine Figur auf der Karte - verschoben wird die Karte selbst:
 * mit gedrueckter Maustaste ziehen, oder mit WASD und den Pfeiltasten.
 *
 * z.blick ist die Mitte des sichtbaren Ausschnitts, in Feldern. Gerechnet
 * wird aber in Bildpunkten und erst am Ende in Felder umgerechnet - sonst
 * waere das Ziehen beim Hineinzoomen rasend schnell und herausgezoomt zaeh.
 * So bleibt der Punkt unter dem Zeiger unter dem Zeiger, egal wie gross ein
 * Feld gerade ist.
 *
 * Der Blick darf hier ueber den Weltrand hinauswandern; zurueckgeholt wird er
 * in Ansicht.kameraSetzen, direkt bevor gezeichnet wird.
 */
window.TERRA = window.TERRA || {};

TERRA.Blick = (function () {
  'use strict';

  var TEMPO = 700;      // Bildpunkte je Sekunde bei Tastatursteuerung

  /* Mit der Maus ziehen: die Karte folgt dem Zeiger, der Blick geht also
   * genau andersherum. */
  function ziehen(z, dxPunkte, dyPunkte) {
    if (!z.welt) return;
    var fp = z.einstellungen.feldPixel;
    z.blick.x -= dxPunkte / fp;
    z.blick.y -= dyPunkte / fp;
  }

  /* Ein Zeitschritt mit den Richtungstasten. */
  function tasten(z, dt, eingabe) {
    if (!z.welt) return;
    var rx = eingabe.x, ry = eingabe.y;
    if (rx === 0 && ry === 0) return;

    var laenge = Math.sqrt(rx * rx + ry * ry);     // schraeg nicht schneller
    rx /= laenge;
    ry /= laenge;

    var weg = TEMPO * dt / z.einstellungen.feldPixel;
    z.blick.x += rx * weg;
    z.blick.y += ry * weg;
  }

  return { ziehen: ziehen, tasten: tasten };
})();

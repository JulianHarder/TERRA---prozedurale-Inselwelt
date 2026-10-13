/* Einstieg: alles zusammensetzen und die Schleife starten.
 *
 * Ablauf beim Laden:
 *   1. Oberflaeche verdrahten
 *   2. Seed bestimmen - Adresse (?seed=...) > letzter Stand > Zufallswort
 *   3. Welt erzeugen und ins Fenster einpassen
 *   4. Schleife: Blick bewegen, zeichnen
 */
window.TERRA = window.TERRA || {};

TERRA.Haupt = (function () {
  'use strict';

  var z = TERRA.Zustand;
  var letzteZeit = 0;
  var sicherungZeit = 0;

  function starten() {
    z.einstellungen = z.einstellungenKopie();

    TERRA.Ansicht.starten();
    TERRA.Minikarte.starten();
    TERRA.Seitenleiste.starten();
    TERRA.Kopfzeile.starten(function (wort) { welt(wort); });
    TERRA.Werkstatt.starten(neuErzeugen, darstellungGeaendert);
    hilfeVerdrahten();

    TERRA.Tastatur.starten({
      minikarte: function () { TERRA.Minikarte.umschalten(); },
      werkstatt: function () { TERRA.Werkstatt.umschalten(); },
      hilfe: hilfeUmschalten,
      png: function () { TERRA.Kopfzeile.pngSpeichern(z); },
      link: function () { TERRA.Kopfzeile.linkKopieren(z); },
      namen: namenUmschalten,
      zoom: function (stufen) { TERRA.Ansicht.zoomen(z, stufen); },
      einpassen: function () { TERRA.Ansicht.einpassen(z); },
      schliessen: function () {
        TERRA.Werkstatt.schliessen();
        document.getElementById('fenster-hilfe').hidden = true;
      },
      seedFeld: function () { document.getElementById('seed-feld').focus(); },
      klick: function (feld) { TERRA.Entdecker.zielSetzen(z, feld); }
    });

    document.getElementById('knopf-namen').addEventListener('click', namenUmschalten);
    window.addEventListener('beforeunload', function () { TERRA.Speicher.sichern(z); });

    erstesLaden();
    namenKnopfBeschriften();
    window.requestAnimationFrame(schleife);
  }

  function erstesLaden() {
    var ausAdresse = TERRA.Kopfzeile.seedAusAdresse();
    var stand = TERRA.Speicher.lesen();
    var seed = ausAdresse || (stand && stand.seed) || TERRA.Zufall.zufallsWort();

    if (stand && stand.seed === seed) {
      z.einstellungen = z.einstellungenKopie(stand.einstellungen);
      welt(seed, stand);
      TERRA.Werkstatt.reglerAufbauen();
      return;
    }
    welt(seed);
  }

  /* Eine Welt aufbauen. */
  function welt(seedWort, standOderNull) {
    ladenZeigen(true);
    TERRA.Kopfzeile.seedSetzen(seedWort);

    // Ein Bild Pause, damit der Hinweis wirklich zu sehen ist, bevor der
    // Hauptfaden fuer die Generierung blockiert.
    window.requestAnimationFrame(function () {
      var neueWelt = TERRA.Welt.erzeuge(seedWort, z.einstellungen, true);
      z.neueWelt(neueWelt);

      TERRA.Ansicht.neueWelt(neueWelt);
      if (standOderNull) TERRA.Speicher.anwenden(z, standOderNull);
      else TERRA.Ansicht.einpassen(z);

      TERRA.Seitenleiste.neueWelt(z);
      if (TERRA.Werkstatt.offen()) TERRA.Werkstatt.zeichnen(z);
      ladenZeigen(false);
    });
  }

  /* Aus der Werkstatt: Regler geaendert, Welt mit gleichem Seed neu bauen. */
  function neuErzeugen() {
    welt(z.welt ? z.welt.seed : TERRA.Zufall.zufallsWort());
  }

  /* Aus der Werkstatt: nur Darstellung geaendert (Feldgroesse, Relief). */
  function darstellungGeaendert() {
    TERRA.Ansicht.groesseAnpassen();
  }

  function namenUmschalten() {
    z.einstellungen.namen = !z.einstellungen.namen;
    namenKnopfBeschriften();
    TERRA.Speicher.sichern(z);
  }

  function namenKnopfBeschriften() {
    var knopf = document.getElementById('knopf-namen');
    if (!knopf) return;
    var an = !!z.einstellungen.namen;
    knopf.textContent = an ? 'Namen: an' : 'Namen: aus';
    knopf.title = an ? 'Regionsnamen ausblenden (B)' : 'Regionsnamen einblenden (B)';
    knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
  }

  function ladenZeigen(an) {
    document.getElementById('karte-ladung').hidden = !an;
  }

  function hilfeVerdrahten() {
    var fenster = document.getElementById('fenster-hilfe');
    document.getElementById('knopf-hilfe').addEventListener('click', hilfeUmschalten);
    document.getElementById('hilfe-zu').addEventListener('click', function () { fenster.hidden = true; });
    fenster.addEventListener('click', function (ereignis) {
      if (ereignis.target === fenster) fenster.hidden = true;
    });
  }

  function hilfeUmschalten() {
    var fenster = document.getElementById('fenster-hilfe');
    fenster.hidden = !fenster.hidden;
  }

  // --- Die Schleife ---

  function schleife(jetzt) {
    if (!letzteZeit) letzteZeit = jetzt;
    var dt = (jetzt - letzteZeit) / 1000;
    letzteZeit = jetzt;
    if (dt > 0.1) dt = 0.1;      // nach einem Tabwechsel nicht durch die Welt springen

    if (z.welt) {
      TERRA.Entdecker.schritt(z, dt, TERRA.Tastatur.richtung());
      TERRA.Ansicht.zeichnen(z);
      TERRA.Minikarte.zeichnen(z);

      // Alle 8 Sekunden sichern (Seed, Regler, Bildausschnitt).
      if (jetzt - sicherungZeit > 8000) {
        sicherungZeit = jetzt;
        TERRA.Speicher.sichern(z);
      }
    }

    window.requestAnimationFrame(schleife);
  }

  return { starten: starten };
})();

window.addEventListener('DOMContentLoaded', function () { TERRA.Haupt.starten(); });

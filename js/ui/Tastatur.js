/* Eingaben: Tastatur und Mausklick auf die Karte. */
window.TERRA = window.TERRA || {};

TERRA.Tastatur = (function () {
  'use strict';

  var gedrueckt = {};
  var eingabe = { x: 0, y: 0 };

  var RICHTUNGEN = {
    KeyW: [0, -1], ArrowUp: [0, -1],
    KeyS: [0, 1],  ArrowDown: [0, 1],
    KeyA: [-1, 0], ArrowLeft: [-1, 0],
    KeyD: [1, 0],  ArrowRight: [1, 0]
  };

  /* Welche Taste war das?
   *
   * Normalerweise 'code' - der ist von der Tastaturbelegung unabhaengig,
   * KeyW ist also immer die Taste links oben, egal ob QWERTZ oder QWERTY.
   * Manche Umgebungen liefern aber kein 'code' (etwa nachgebildete
   * Ereignisse aus Bedienhilfen oder Testwerkzeugen). Dann wird 'key'
   * benutzt und in dieselbe Schreibweise gebracht.
   */
  function tasteVon(ereignis) {
    if (ereignis.code) return ereignis.code;
    var k = ereignis.key;
    if (!k) return '';
    if (k === '/') return 'Slash';
    if (k.length === 1) return 'Key' + k.toUpperCase();
    return k;                       // Escape, ArrowUp, Enter ...
  }

  function starten(befehle) {
    window.addEventListener('keydown', function (ereignis) {
      var taste = tasteVon(ereignis);

      // Waehrend man in das Seed-Feld tippt, soll nichts anderes passieren.
      var ziel = ereignis.target;
      if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA')) {
        if (taste === 'Escape') ziel.blur();
        return;
      }

      if (RICHTUNGEN[taste]) {
        gedrueckt[taste] = true;
        ereignis.preventDefault();
        return;
      }

      switch (taste) {
        case 'KeyM': befehle.minikarte(); break;
        case 'KeyB': befehle.namen(); break;
        case 'KeyE': befehle.werkstatt(); break;
        case 'KeyL': befehle.link(); break;
        case 'KeyP': befehle.png(); break;
        case 'Slash':
        case 'KeyH': befehle.hilfe(); break;
        case 'Equal':
        case 'NumpadAdd':
        case 'Key+': befehle.zoom(1); break;
        case 'Minus':
        case 'NumpadSubtract':
        case 'Key-': befehle.zoom(-1); break;
        case 'Digit0':
        case 'Key0': befehle.einpassen(); break;
        case 'Escape': befehle.schliessen(); break;
        case 'Enter': befehle.seedFeld(); break;
      }
    });

    window.addEventListener('keyup', function (ereignis) {
      var taste = tasteVon(ereignis);
      if (RICHTUNGEN[taste]) gedrueckt[taste] = false;
    });

    // Fenster verlassen: alle Tasten loslassen, sonst laeuft die Figur weiter.
    window.addEventListener('blur', function () { gedrueckt = {}; });

    var rahmen = document.getElementById('karte-rahmen');

    // Mausrad zoomt. passive:false, weil sonst die Seite mitscrollt.
    rahmen.addEventListener('wheel', function (ereignis) {
      ereignis.preventDefault();
      befehle.zoom(ereignis.deltaY < 0 ? 1 : -1);
    }, { passive: false });

    rahmen.addEventListener('mousedown', function (ereignis) {
      if (ereignis.button !== 0) return;
      var kasten = rahmen.getBoundingClientRect();
      var feld = TERRA.Ansicht.zuFeld(ereignis.clientX - kasten.left, ereignis.clientY - kasten.top);
      befehle.klick(feld);
    });
  }

  /* Aktuelle Laufrichtung aus den gedrueckten Tasten. */
  function richtung() {
    eingabe.x = 0;
    eingabe.y = 0;
    for (var code in RICHTUNGEN) {
      if (gedrueckt[code]) {
        eingabe.x += RICHTUNGEN[code][0];
        eingabe.y += RICHTUNGEN[code][1];
      }
    }
    if (eingabe.x > 1) eingabe.x = 1; else if (eingabe.x < -1) eingabe.x = -1;
    if (eingabe.y > 1) eingabe.y = 1; else if (eingabe.y < -1) eingabe.y = -1;
    return eingabe;
  }

  return { starten: starten, richtung: richtung };
})();

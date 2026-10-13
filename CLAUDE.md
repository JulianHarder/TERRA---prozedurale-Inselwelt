# TERRA – Projektregeln

## Projekt
Prozedural erzeugter **Weltbetrachter**. 2D-Karte von oben, ein Seed-Wort
ergibt immer dieselbe Welt. Der vollständige Plan steht in `TERRA-Plan.md`.

Die Karte ist immer vollständig sichtbar und wird beim Laden ins Fenster
eingepasst. Regionsnamen stehen direkt auf der Karte (`B` blendet sie aus),
gefiltert nach ihrer Größe auf dem Bildschirm.

**Es gibt bewusst keinen Nebel, keinen Fortschritt und kein Logbuch.** Das war
in einer früheren Fassung drin und wurde auf Julians Wunsch vollständig
entfernt – nicht abgeschaltet, sondern gelöscht. Nicht wieder einbauen, außer
er fragt ausdrücklich danach.

## Stack
- Vanilla JavaScript, Canvas 2D, kein Framework, kein TypeScript, kein Build-Tool
- **Kein ES-Module-Syntax (`import`/`export`) in `js/`.** `index.html` lädt
  klassische `<script>`-Tags in fester Reihenfolge (siehe dort), jede Datei
  hängt sich an `window.TERRA`.
  Grund: Die Seite muss per Doppelklick über `file://` laufen; Browser
  blockieren ES-Module-Importe über `file://` (CORS), klassische Skripte nicht.
- **Nichts wird aus dem Netz geladen.** Keine Bibliothek, kein CDN, keine
  Webfonts. Auch das Rauschen ist selbst geschrieben – es ist der Lernkern.
- Inhalte und Kommentare auf Deutsch, Code-Bezeichner auf Englisch.

## Regeln
- **`Math.random()` ist in der Weltgenerierung verboten.** Jede Zufallszahl
  kommt aus `TERRA.Zufall` mit dem Seed der Welt – sonst ist die Welt nicht
  reproduzierbar. Einzige Ausnahme: der Würfel-Knopf, der ein Seed-Wort
  auswählt (er bestimmt nicht die Welt, nur welche Welt).
- Generierung ist eine reine Funktion: gleicher Seed + gleiche Einstellungen
  = gleiche Welt. Keine Zeitabhängigkeit, kein `Date.now()` in der Generierung.
- Biom-Schwellwerte, Farben, Silben und Texte liegen in `js/daten/`, nicht im Code.
- Gelände-Ebene nur bei neuer Welt neu zeichnen, nie pro Bild – danach wird
  das fertige Bild nur noch per `drawImage` verschoben.
- Keine Datei über 500 Zeilen. Ab ca. 350 Zeilen aufteilen. Prüfen mit:
  `find js css -name "*.js" -o -name "*.css" | xargs wc -l | sort -n`
- Nur an der aktuellen Etappe arbeiten, nicht an mehreren gleichzeitig.
- Vor größeren Änderungen erst einen kurzen Plan zeigen.

## Fallstricke, die schon zugeschlagen haben
- Ein Becken füllt man nicht mit „alle Nachbarn unter einem festen Pegel" –
  das folgt jeder flachen Rinne und ergibt schnurgerade Striche quer durch die
  Landschaft. Der Pegel muss schrittweise steigen, bis der See überläuft.
- Die Inselmaske drückt alle Höhen nach unten. Ohne erneutes Strecken danach
  erreicht die Welt die oberen Biomstufen nie – es gibt dann keine Gipfel.
- `event.code` ist der richtige Weg, Tasten zu erkennen (belegungsunabhängig),
  aber nachgebildete Ereignisse liefern ihn nicht. Deshalb der Rückfall auf
  `event.key` in `Tastatur.js`.

## Befehle
- Kein Build, kein Dev-Server: `index.html` per Doppelklick im Browser öffnen.
- Nur zum Testen über HTTP: `python3 -m http.server 8779`

## Arbeitsweise
- Git: eigenes Repo. Commits auf Zuruf, Push nur wenn Julian „push" sagt.
- Nach jeder Etappe: kurz durchklicken, Screenshot in `screenshots/`.

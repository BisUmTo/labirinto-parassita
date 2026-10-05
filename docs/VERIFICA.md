# Verifica della versione 2.0

Data: 5 ottobre 2026.

## Regole automatiche

`node --test tests/*.cjs`: 6 test superati, nessuna dipendenza esterna.

- Tutte le 96 combinazioni fra 6 tavole, 4 stagni e 4 uscite.
- Vincitore corretto e stato immutabile dopo l’uscita.
- Il movimento non attraversa i muri e non modifica la tavola.
- Il segreto è visibile solo nella fase privata rivelata e nel risultato.
- Nascondere e riaprire il segreto mantiene la stessa destinazione.
- Riconoscimento delle direzioni e soglia minima degli swipe.
- Muri reciproci, quattro sole aperture di confine e tutte le 81 celle raggiungibili.

## Verifiche nel browser

Eseguite nel browser desktop con viewport adattato, non su dispositivi fisici:

- 390×844, 320×568, 844×390 (orizzontale), 1440×900.
- Plancia e comandi interamente visibili durante la partita; nessuna eccedenza orizzontale.
- Flusso completo: privato → segreto → passaggio del telefono → movimento → rivelazione → rivincita.
- Entrambi i risultati, mantide e nematomorfo.
- Movimento con trascinamento, pulsanti touch e frecce della tastiera.
- Collisione con il muro: nessun avanzamento e nessun passo conteggiato.
- Copertura del segreto all’apertura del menu, destinazione invariata riaprendolo.
- Attivazione/disattivazione dei suoni, istruzioni, ritorno al titolo e punteggio della sessione.
- Nessun errore o avviso nella console durante le partite provate.

Sui telefoni molto piccoli il risultato può richiedere uno scorrimento verticale per raggiungere «Rigioca». Il labirinto e le frecce durante la partita restano nello schermo.

La modalità movimento ridotto è implementata tramite `prefers-reduced-motion`: illustrazioni ferme, spostamenti brevi ed effetti ornamentali disattivati. Non è stata verificata cambiando le preferenze del sistema dell’utente.

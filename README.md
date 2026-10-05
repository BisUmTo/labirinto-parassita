# Il labirinto del parassita

**Una mantide cerca la libertà. Qualcuno ha altri piani.**

[Gioca su GitHub Pages](https://bisumto.github.io/labirinto-parassita/)

Un gioco di persuasione per **due persone sullo stesso telefono**. La mantide deve raggiungere una delle quattro uscite, il nematomorfo vuole convincerla a scegliere lo stagno.

## Come si gioca

1. Scegliete chi interpreta la **mantide** e chi il **nematomorfo**.
2. Il telefono va soltanto al nematomorfo: «Scopri lo stagno» rivela la destinazione segreta.
3. Memorizza la posizione e premi «Ho memorizzato · Nascondi». Passa il telefono alla mantide.
4. La mantide parte dal centro. **Scorri sul labirinto**, usa le frecce a schermo o la tastiera. Puoi tenere premute le frecce e trascinare per continuare a camminare.
5. Il nematomorfo può parlare, suggerire e tentare la mantide. La pedina la muove soltanto la mantide.
6. Attraversa un’uscita con l’ultimo movimento verso l’esterno. Le quattro caselle si scoprono: **stagno → vince il nematomorfo; terra sicura → vince la mantide**.
7. Scambiatevi i ruoli e rigiocate.

A è sempre a nord, B a est, C a sud e D a ovest. Il punteggio della sessione compare tornando al titolo. I suoni sono facoltativi e inizialmente spenti.

## Questa versione

- Mantide illustrata con sei zampe articolate, antenne mobili, passi alternati e rotazione fluida.
- Nematomorfo sottile animato proceduralmente, con comparsa progressiva nel finale dello stagno.
- Carte che si ribaltano, ingresso nella plancia, foglie nel finale e vegetazione in movimento.
- Interfaccia pensata per il telefono: carte dei ruoli, plancia leggibile e comandi touch.
- Pausa, istruzioni, rivincita, suoni sintetizzati localmente e supporto al movimento ridotto del sistema.
- Sei labirinti illustrati 9×9, con assegnazione casuale e indipendente dello stagno.

Niente acqua nei corridoi: lo stagno è soltanto una destinazione.

## Eseguire e pubblicare

È un sito statico: **nessuna compilazione, dipendenza da installare, chiave API o backend**.

Per l’anteprima locale, dalla cartella del progetto:

```sh
python3 -m http.server 8000
```

Apri `http://localhost:8000`. Su GitHub Pages usa **Settings → Pages → Deploy from a branch → main → /(root)**. Tutti gli asset usano percorsi relativi e funzionano anche sotto `/labirinto-parassita/`. Il file `.nojekyll` disattiva l’elaborazione Jekyll.

[Documentazione ufficiale GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Struttura

| File | Contenuto |
| --- | --- |
| `index.html`, `style.css` | Schermate e presentazione responsive |
| `app.js` | Partita, input, audio, transizioni e risultati |
| `characters.js` | Rig della mantide e animazione del nematomorfo |
| `engine.js` | Regole pure e collisioni |
| `mazes.js` | Geometria esatta delle sei tavole |
| `assets/` | Tavole, corpo della mantide, vegetazione e destinazioni |
| `tests/` | Verifica delle regole e delle tavole |
| `CREDITI.txt` | Provenienza degli asset |

Le tavole provengono dal renderer Python del progetto `labirinto-palude-bello`. Sono prerenderizzate: ogni partita sceglie uno dei sei schemi, evitando quello appena giocato. Non vengono generati labirinti infiniti nel browser. Cambiando una tavola è necessario aggiornare insieme la sua immagine e la geometria in `mazes.js`.

Il disegno a ogni fotogramma è separato dall’immagine della plancia. Le animazioni usano Canvas 2D e CSS; il corpo illustrato della mantide è un asset locale, mentre zampe, antenne e nematomorfo sono disegnati dal codice. I movimenti ridotti si attivano con la preferenza di accessibilità del sistema.

## Test

Con Node.js 18 o successivo, senza installazioni aggiuntive:

```sh
npm test
```

I test verificano tutte le **96 combinazioni** di tabellone/stagno/uscita, le collisioni, l’impossibilità di muoversi dopo la fine, la copertura del segreto, le direzioni degli swipe e la coerenza della geometria delle tavole. Le verifiche manuali della versione pubblicata sono documentate in `docs/VERIFICA.md`.

## Privacy e passaggio del telefono

Nessun account, microfono, analytics o servizio esterno. La persuasione avviene dal vivo. Si salva localmente solo la preferenza dei suoni; ricaricare la pagina azzera partita e punteggio.

Il segreto è rimosso dalla schermata e dagli annunci accessibili al passaggio del telefono. Aprire il menu o cambiare applicazione durante la rivelazione lo copre. Il gioco presuppone che le persone rispettino i ruoli: non è una protezione dall’ispezione del codice del browser.

## Spunto didattico

Il gioco si ispira alla relazione tra mantidi e nematomorfi. In alcune associazioni ospite-parassita, l’infezione è collegata a comportamenti che favoriscono l’ingresso nell’acqua, dove il nematomorfo può proseguire il suo ciclo. La persuasione verbale e la scelta tra quattro uscite sono una **semplificazione ludica**, non una simulazione del comportamento animale.

Riferimento: [Enhanced polarotaxis can explain water-entry behaviour of mantids infected with nematomorph parasites](https://pubmed.ncbi.nlm.nih.gov/34157257/).

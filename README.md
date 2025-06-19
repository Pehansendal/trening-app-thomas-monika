# Treningsapp for Thomas & Monika

En enkel Next.js-applikasjon for å spore treningsprogresjon for Thomas og Monika, basert på et treningsprogram definert i en CSV-fil. Appen bruker Supabase for å lagre status for fullførte økter.

## Funksjonalitet

*   **Treningsprogramvisning:** Viser et detaljert treningsprogram hentet fra `public/treningsprogram.csv`.
*   **Avkryssing av økter:** Lar Thomas og Monika markere økter som fullførte.
*   **Enkel brukeridentifisering:** En grunnleggende innloggingsside skiller mellom Thomas og Monika, slik at hver person kun kan oppdatere sine egne avkryssninger. Sikkerhet er ikke prioritert for denne uformelle appen.
*   **Datalagring:** Status for fullførte økter, opplevd anstrengelse (RPE), og faktisk pace lagres i en Supabase-database.
*   **Detaljert logging per økt:**
    *   Mulighet for å logge "Opplevd anstrengelse" (RPE 1-10) via en slider.
    *   Mulighet for å logge "Pace på økt" via et tekstfelt.
    *   Mulighet for å legge inn en personlig kommentar til treneren ("Noe du vil si til treneren?").
    *   Logget RPE, pace og kommentar er synlig for begge brukere etter at en økt er fullført.
*   **AI-drevet Trener-tilbakemelding:**
    *   Knapper for "Trenerens tilbakemelding for Thomas" og "Trenerens tilbakemelding for Monika" er synlige for alle brukere.
    *   Ved klikk vises en popup med en AI-generert tilbakemelding fra en "trener".
    *   Tilbakemeldingen er basert på brukerens loggede data (RPE, pace, kommentar) og historikk, samt informasjon om treningsprogrammet.
    *   AI-modellen (`gemini-2.5-flash-preview-05-20`) er konfigurert til å gi nyttig, ærlig, folkelig og oppmuntrende tilbakemelding.
    *   Tilbakemeldingen lagres i Supabase og vises med markdown-formatering.
*   **Visuell statusindikasjon:**
    *   Avkryssingsbokser for fullførte økter blir grønne.
    *   Knapper for trenerens tilbakemelding blir grønne når en tilbakemelding er gitt.
*   **Fjernet unødvendige elementer:**
    *   Sidebilder (Monika og Trening) er fjernet for å fokusere på hovedinnholdet.
    *   Musikkavspilling ved innlogging er deaktivert.
*   **Regler for logging:**
    *   Det er ikke mulig å krysse av for en økt hvis det er mer enn 2 dager siden øktens dato.
    *   Når en økt er krysset av (og RPE/pace er lagt inn), kan den ikke endres eller fjernes.
*   **Responsivt design:** Appen har et visuelt tiltalende design med header-bilde og dekorative bilder på sidene, tilpasset ulike skjermstørrelser.

## Teknologistabel

*   **Next.js:** React-rammeverk for server-side rendering og statisk generering.
*   **TypeScript:** For type-sikkerhet.
*   **Supabase:** Open-source Firebase-alternativ for database og autentisering (kun database brukt her).
*   **Tailwind CSS:** Utility-first CSS-rammeverk for rask og fleksibel styling.
*   **`csv-parse`:** Node.js-bibliotek for å parse CSV-filer.
*   **Google Gemini API:** Brukes for å generere AI-basert tilbakemelding fra en "trener". Spesifikk modell: `gemini-1.5-flash-preview-05-20`. Denne modellen er gratis å bruke.

## Oppsett og kjøring lokalt

Følg disse stegene for å få appen til å kjøre på din lokale maskin:

1.  **Klon repositoryet:**
    ```bash
    git clone https://github.com/Pehansendal/trening-app-thomas-monika.git
    cd trening-app-thomas-monika
    ```

2.  **Installer avhengigheter:**
    ```bash
    npm install
    ```

3.  **Konfigurer Supabase:**
    *   Opprett et nytt prosjekt i Supabase (hvis du ikke allerede har et).
    *   Gå til "Table Editor" og opprett en ny tabell kalt `treningsprogram` med følgende kolonner:
        *   `dato` (Type: `DATE`, Sett som `PRIMARY KEY`, `NOT NULL`)
        *   `thomas_fullfort` (Type: `BOOLEAN`, `DEFAULT false`, `NOT NULL`)
        *   `monika_fullfort` (Type: `BOOLEAN`, `DEFAULT false`, `NOT NULL`)
        *   `thomas_fullfort_tidspunkt` (Type: `TIMESTAMPTZ`, `NULLABLE`)
        *   `monika_fullfort_tidspunkt` (Type: `TIMESTAMPTZ`, `NULLABLE`)
        *   `thomas_rpe` (Type: `integer` (f.eks. `int2` eller `int4`), `NULLABLE`)
        *   `monika_rpe` (Type: `integer` (f.eks. `int2` eller `int4`), `NULLABLE`)
        *   `thomas_actual_pace` (Type: `text`, `NULLABLE`)
        *   `monika_actual_pace` (Type: `text`, `NULLABLE`)
        *   `thomas_kommentar` (Type: `text`, `NULLABLE`)
        *   `monika_kommentar` (Type: `text`, `NULLABLE`)
        *   `trener_thomas_kommentar` (Type: `text`, `NULLABLE`)
        *   `trener_monika_kommentar` (Type: `text`, `NULLABLE`)
        *   `thomas_pushups` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
        *   `monika_pushups` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
        *   `thomas_pushups_knaer` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
        *   `monika_pushups_knaer` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
        *   `thomas_kroppsvektscurl` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
        *   `monika_kroppsvektscurl` (Type: `integer`, `DEFAULT NULL`, `NULLABLE`)
    *   **Viktig:** For å tillate appen å skrive til databasen uten innlogging (som spesifisert i prosjektet), må du enten:
        *   **Deaktivere Row Level Security (RLS)** for `treningsprogram`-tabellen i Supabase-dashboardet.
        *   **Eller** opprette RLS-policies som tillater `SELECT`, `INSERT`, og `UPDATE` for `anon`-rollen.

4.  **Opprett miljøvariabler:**
    *   Opprett en fil kalt `.env.local` i roten av prosjektet ditt.
    *   Hent din Supabase URL og Anon Key fra Supabase-dashboardet (under "Project Settings" -> "API").
    *   Legg til følgende i `.env.local`:
        ```
        NEXT_PUBLIC_SUPABASE_URL=DIN_SUPABASE_URL_HER
        NEXT_PUBLIC_SUPABASE_ANON_KEY=DIN_SUPABASE_ANON_KEY_HER
        GEMINI_API_KEY=DIN_GEMINI_API_KEY_HER
        ```
        *   **Viktig:** `GEMINI_API_KEY` er din API-nøkkel for Google Gemini API. Denne skal kun brukes på serversiden (i API-ruter) for sikkerhet.

5.  **Kjør utviklingsserveren:**
    ```bash
    npm run dev
    ```
    *   Åpne [http://localhost:3000](http://localhost:3000) i nettleseren din for å se appen.

## Deployment til Vercel

Prosjektet er konfigurert for enkel deployment til Vercel.

1.  **Koble til GitHub:** Logg inn på Vercel og importer ditt GitHub-repository (`Pehansendal/trening-app-thomas-monika`).
2.  **Miljøvariabler i Vercel:** Legg til `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY` som miljøvariabler i Vercel-prosjektets innstillinger (under "Settings" -> "Environment Variables").
3.  **Deploy:** Vercel vil automatisk bygge og deploye appen din.

## Kjente utfordringer og løsninger

Dette prosjektet har møtt og løst noen interessante utfordringer under utviklingen:

### 1. ESLint og Vercel Build-feil (`react/no-unescaped-entities`)

**Problem:**
Vercel-builden feilet gjentatte ganger med ESLint-feilen `react/no-unescaped-entities`, som indikerer uescapede apostrofer (`'`) i JSX-koden (spesifikt i tittelen "Thomas & Monika's Treningsprogram"). Selv om endringer for å escape apostrofene (`'`) ble gjort lokalt, ble de ikke korrekt reflektert på GitHub, noe som førte til vedvarende build-feil.

**Løsning:**
Som en midlertidig løsning for å få appen deployert, ble ESLint-regelen `react/no-unescaped-entities` deaktivert i `eslint.config.mjs`:

```javascript
// eslint.config.mjs
// ...
const eslintConfig = [
  // ...
  {
    rules: {
      "react/no-unescaped-entities": "off", // Deaktiverer regelen for å unngå build-feil på Vercel
    },
  },
];
export default eslintConfig;
```
**Anbefalt langsiktig løsning:**
Det anbefales sterkt å manuelt endre alle uescapede apostrofer (`'`) til `'` i koden (f.eks. i `src/app/page.tsx` og `src/app/layout.tsx`). Når dette er gjort og verifisert på GitHub, kan ESLint-regelen eventuelt reaktiveres.

### 2. Git-synkroniseringsproblemer

**Problem:**
Vedvarende utfordringer med at lokale filendringer (spesielt de som involverte escaping av apostrofer) ikke ble korrekt registrert og pushet til GitHub. Dette resulterte i at Vercel fortsatte å bygge en eldre versjon av koden, selv etter flere `git add`, `git commit`, og `git push`-forsøk. Problemet manifesterte seg som "nothing to commit, working tree clean" lokalt, selv om filene visuelt var endret.

**Løsning:**
Problemet ble omgått ved å deaktivere den problematiske ESLint-regelen. Den underliggende årsaken til Git-synkroniseringsproblemet ble ikke fullstendig identifisert, men kan skyldes linjeskift-konflikter (CRLF/LF på Windows vs. Linux/Git), korrupsjon i Git-indeksen, eller andre lokale Git-konfigurasjonsutfordringer. En "ren" start med et nytt GitHub-repository ble også forsøkt for å eliminere historikk-relaterte problemer.

### 3. Bruk av `fs`-modulen på klientsiden

**Problem:**
Next.js-builden feilet med `Module not found: Can't resolve 'fs'` når `src/lib/csv.ts` ble importert direkte i `src/app/page.tsx`. Dette skyldes at `fs`-modulen (Node.js File System) kun er tilgjengelig på serveren, mens `src/app/page.tsx` er en klientkomponent.

**Løsning:**
CSV-fillesingen ble flyttet til en Next.js API Route (`src/app/api/training-program/route.ts`). Denne API-ruten leser filen på serveren og returnerer dataene som JSON. `src/app/page.tsx` henter deretter dataene fra denne API-ruten ved hjelp av `fetch`, noe som sikrer at `fs`-modulen kun brukes i servermiljøet.

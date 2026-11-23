# Caiet: FitAscend

## Scop
Aplicație fitness web (PWA), cu iconiță pe iPhone, pentru tine și câțiva prieteni. Adună într-un singur loc antrenamentele, mesele, apa, somnul, pașii și restul, cu un calendar central. Cost 0 lei.

## Unde am rămas
**Etapa 2 (ecranul Azi cu date reale) e gata și testată**, cu o singură excepție: suplimentele așteaptă să rulezi `supabase/2026-11-23_supplements.sql`.

Ce merge pe ecranul Azi:
- **Mese:** nume, descriere, kcal, proteine/carbohidrați/grăsimi opționale, de câte ori vrei. Atingi o masă și o poți modifica sau șterge. Inelul de calorii și barele de macronutrienți se umplu față de ținta din profil, iar inelul se înroșește peste țintă.
- **Apă:** +250, +500 sau altă cantitate; paharul se umple față de ținta din profil. ↺ anulează ultimul pahar.
- **Somn, timp pe telefon** (ore + minute) și **pași:** o valoare pe zi, care se poate modifica sau șterge
- **Greutate:** opțională. Fără valoare, ziua arată greutatea din profil („din profil”). Dacă o completezi azi, se actualizează și profilul.
- **Suplimente:** lista ta proprie, cu bife zilnice
- Totul trece prin coadă: testat fără internet, apoi trimis și coada golită

## Pașii următori
1. ✔ Suplimentele: SQL rulat de tine, testat (listă + bifă ajung în cloud)
2. **Apple Health:** ✔ scurtătura merge (pașii ajung în aplicație), ✔ automatizările făcute de tine. Rămâne de verificat somnul după prima noapte cu ceasul. **Fără antrenamente de pe Watch** (decizia ta).
3. ✔ **Etapa 3: Antrenament** gata și testată (SQL rulat de tine)
4. ✔ **Etapa 4: Calendar** gata și testată (lunile anterioare, puncte pe zile, pagina zilei cu tot, editare pentru zile trecute)
5. **Etapa 5: publicare**, în lucru. ✔ Git inițializat în `D:\Aplicatie fitness` (fără commit încă), workflow `.github/workflows/deploy.yml` (test + build + GitHub Pages), `.gitignore` care ține local docx-ul și chestionarul, scanare: nicio parolă. ✔ Repo creat de tine: github.com/Cosminel23333/fitascend, Pages → GitHub Actions. ✔ Primul commit (001c8b0), cu emailul noreply 360365713+Cosminel23333@users.noreply.github.com. ✔ Push făcut, ✔ GitHub Actions a construit și publicat. **APLICAȚIA E ONLINE: https://cosminel23333.github.io/fitascend/** (https, service worker activ, login testat). ⏳ Tu: instalare pe iPhone (Safari → Distribuie → Adaugă pe ecranul principal) + contul tău + profil + cheie Health nouă dacă e nevoie.

## Decizii luate
- Aplicație web (PWA): fără Mac și fără 99$/an (2026-11-23)
- Apple Health prin Scurtătură iOS (V2); timpul pe telefon rămâne manual (2026-11-23)
- Supabase e sursa datelor; pe telefon doar coada de netrimise + profilul (câteva sute de bytes) (2026-11-23)
- O scriere respinsă de server nu blochează coada; o copie rămâne în `fitascend-rejected` (2026-11-23)
- Greutatea zilnică e opțională; fără valoare se folosește cea din profil; dacă o completezi azi, se actualizează și profilul (2026-11-23)
- Somn, pași, timp pe telefon, greutate: o valoare pe zi (a doua o înlocuiește pe prima). Apa și mesele: oricâte (2026-11-23)
- Lista de suplimente stă în profil (coloana `supplements`) (2026-11-23)
- Publicare pe GitHub Pages; fără confirmare pe email (2026-11-23)
- Formula calorică: Katch-McArdle cu % grăsime, altfel Mifflin-St Jeor; ținte -25/-15/0/+10/+15%, minim 1200 (F) / 1500 (M) (2026-11-23)

## Probleme deschise / întrebări
- **Până rulezi SQL-ul pentru suplimente, nu adăuga suplimente**: serverul ar respinge salvarea listei
- Conturi de test în Supabase: fitascend.test.a/b/c@example.com (se pot șterge din Authentication → Users)
- Holograma 3D: în paleta caldă sau albastră? (V2.3)
- Avertizări „moderate” de la npm în uneltele de construire; le reverific la publicare

## Fișiere importante
- `SPEC.md`, `tasks/plan.md`: cerințe și plan
- `supabase/schema.sql`: structura completă; `supabase/2026-11-23_supplements.sql`: de rulat acum
- `app/src/lib/`: `outbox.ts` (coada), `sync.ts` (Supabase), `profile.ts` (profil + ținte), `day.ts` (datele unei zile), `calories.ts` (formule)
- `app/src/pages/`: `Today.tsx` (ecranul Azi, refolosibil pentru orice zi din calendar), `Sheet.tsx` (fereastra de jos), `Calculator.tsx`, `ProfileForm.tsx`, `Auth.tsx`
- `app/tests/`: 24 de teste (formule, coadă, îmbinarea datelor unei zile)

## V2.3 Splash cu logo (2026-11-23)
- Logo ales: `Logo si poze input/Premium-app-logo...png`, optimizat la `app/src/assets/logo-splash.webp` (720 px, q92, clar pe Retina)
- `app/src/pages/Splash.tsx`: GSAP (+ @gsap/react) și praf cosmic pe canvas (roșu/auriu + stele care sclipesc). Intro ~1,5 s la prima deschidere, flash ~0,35 s la fiecare schimbare de tab. Logo de 168/128 px în mijloc, colțuri rotunjite, fundal din paletă.
- Același logo pe login și pe ecranul de încărcare
- Previzualizarea linkului (og:image): `app/public/og-image.jpg` din „App icon logo” (1200×630, q92)
- Greșeală reparată: originalele de 16 MB intraseră în repo (commit 496c3e2), scoase în 8cf00ec și puse în .gitignore. Rămân în istoricul git; le pot scoate și de acolo (force push) dacă vrei.
- Iconița de pe ecranul iPhone-ului e încă cea provizorie (flacăra SVG). Propus: din „App icon logo”.
- Deploy-ul pentru 8cf00ec a eșuat la pasul deploy-pages („No artifacts named github-pages… re-run later”, eroare temporară GitHub). Re-rulat cu un commit gol (124b494): ✔ publicat. Pe site: splash-ul cu logo (720 px încărcat, fără erori) și og-image.jpg (200).

### Splash v2 (2026-11-23, după feedback „nu arată bine”)
- Model primit: `Logo si poze input/6797-196071980.mp4` (tunel „hyperspace” albastru; cadre extrase cu Edge prin Playwright, ffmpeg nu s-a putut instala)
- Intro: tunel de dâre lungi roșu/auriu pe tot ecranul (canvas, ~560 de dâre, coada la adâncime fixă, ca să fie lungi la orice fps), nebuloasă caldă în centru, ceață prună pe margini, logo 168 px care pulsează, la final bară de lumină. ~1,7 s.
- Schimbare de pagină: fără particule; logo de 132 px înclinat 3D (rotateY -22°, rotateX 12°) care se îndreaptă, cu bară de lumină înclinată (gradient la 60°) ieșind prin colțul dreapta-sus. ~0,45 s.
- Bug reparat: primul cadru rAF avea dt negativ → viteza NaN → nicio dâră desenată
- Commit 7a7095b: ✔ publicat. Aștept părerea ta de pe telefon.

## Parolă uitată (2026-11-23)
Nu are încă „Am uitat parola” în aplicație. I-am dat varianta din Supabase SQL Editor: (1) `select email, created_at, last_sign_in_at from auth.users order by created_at;` (2) `update auth.users set encrypted_password = extensions.crypt('PAROLA', extensions.gen_salt('bf')), updated_at = now() where email = '...';`. Cheia Health ține de cont, nu de parolă, deci Scurtătura merge mai departe. Propus: „Am uitat parola” + „Schimbă parola” în app (cere Site URL în Supabase Auth).
- Corecție: editorul Supabase afișează „Success. No rows returned” la orice UPDATE fără `returning`, deci mesajul nu înseamnă eșec (am greșit spunând că apare „1 row affected”). I-am dat varianta cu `returning email, updated_at`, ca să vadă rândul modificat.
- ✔ Parola resetată, a intrat în cont (2026-11-23).

## Publicare
- Cod: https://github.com/Cosminel23333/fitascend (public; docx și chestionarul rămân local prin `.gitignore`)
- Aplicație: https://cosminel23333.github.io/fitascend/
- Orice `git push` pe `main` rulează testele, construiește și publică automat (`.github/workflows/deploy.yml`)
- Commit-urile folosesc emailul noreply 360365713+Cosminel23333@users.noreply.github.com (setat local în repo)

## Pentru mine (pornire)
`cd "D:\Aplicatie fitness\app"` → `npm run dev` (pe telefon: http://192.168.100.41:5173), `npm test`, `npm run build`. Proiect Supabase: xjeblnwtwqahsqarbsez.

## Jurnal
- 2026-11-23: chestionar, analiză, skill-uri, SPEC și plan aprobate
- 2026-11-23: Etapa 0 (schelet + design), design aprobat
- 2026-11-23: Etapa 1 (cloud, login, profil, calculator, coadă), testată real
- 2026-11-23: obiectivul se poate edita și din Profil
- 2026-11-23: Etapa 2 (ecranul Azi cu date reale), testată fără internet + sincronizare; bug reparat (intrările noi nu primeau id); aștept SQL-ul pentru suplimente
- 2026-11-23: suplimente testate. Apple Health adus înainte: SQL (cheie personală + funcția ingest_health care primește pași + somn și îmbină intervalele de somn suprapuse), cardul Apple Health în Profil (generează cheia), eticheta „din Health” pe Azi, ghid `SCURTATURA_APPLE_HEALTH.txt`. Aștept rularea `2026-11-23_health.sql`.
- 2026-11-23: SQL Health rulat; testat: cheia se creează doar logat, trimiterea fără login merge cu cheia, somnul suprapus se îmbină (460 min), a doua trimitere actualizează (nu dublează), cheia greșită e respinsă. Ghidul pentru Scurtătură e greșit pentru iOS 26: am cerut capturi.
- 2026-11-23: capturi primite (telefon în engleză; acțiunile au numele originale). Ghidul refăcut pe bucăți: Partea 1 (pașii) e în `SCURTATURA_APPLE_HEALTH.txt`; aștept captura cardului „Find Health Samples” configurat.
- 2026-11-23: Partea 1 nu a fost clară. Am reexplicat de la zero (ce facem și de ce, apoi fiecare atingere pe rând, în aplicația Shortcuts, nu în Settings).
- 2026-11-23: blocat la „Allow Access”: nu apare ecranul de permisiuni. Am dat calea alternativă: aplicația Health → poza de profil → Apps → Shortcuts → pornești Steps/Sleep/Workouts.
- 2026-11-23: accesul a fost dat, dar cardul încă arată „does not have access” (nu se reîmprospătează singur). Soluție dată: ștergi cardul (✕) și îl adaugi din nou; dacă tot nu merge, închizi complet Shortcuts și o redeschizi.
- 2026-11-23: cardul Find Health Samples merge (Type is Steps, Start Date is in the last 7 days, Unit, Group by, Sort by, Limit). Următorul: Start Date → is today, Group by → Day, apoi acțiunea Calculate Statistics → Sum.
- 2026-11-23: ✔ partea de pași gata (Steps, is today, Group by Day, Calculate Sum). I-am explicat că suma e doar pentru azi, refăcută de la zero la fiecare rulare, iar serverul înlocuiește valoarea, nu o adună. Următorul: al doilea Find Health Samples pentru somn.
- 2026-11-23: în listă are „Sleep” și „Sleep Changes”. I-am spus să aleagă „Sleep” (orele de somn); aștept captura cu opțiunile de la Value.
- 2026-11-23: cardul de somn: Type is Sleep, Start Date is in the last 1 day, Value is anything. Următorul: Value is not In Bed + încă un filtru Value is not Awake.
- 2026-11-23: pe iOS 26, la Value se scrie text liber, nu se alege din listă, deci e nesigur. Schimbare: ștergem filtrul Value, iar Scurtătura trimite „start|end|valoare”; serverul elimină „In Bed”/„Awake” (EN + RO). SQL nou: `supabase/2026-11-23_health_v2.sql`, de rulat înainte de testare (nu i l-am cerut încă).
- 2026-11-23: filtrul Value scos; Repeat with each item in Health Samples (somn) adăugat. Următorul: o acțiune Text în interiorul Repeat cu Repeat Item → Start Date (ISO 8601) | End Date (ISO 8601) | Value.
- 2026-11-23: meniul Repeat Item are opțiunile Value, Type, Unit, Start Date, End Date, Duration, Source, Name. Următorul: alege Start Date, apoi formatul ISO 8601 cu oră.
- 2026-11-23: ✔ Start Date cu ISO 8601 + oră (exemplu 2026-09-15T09:41:00+03:00). Următorul: în Text se adaugă | apoi Repeat Item → End Date (ISO 8601 + oră), | apoi Repeat Item → Value.
- 2026-11-23: Text = Start Date | End Date | Repeat Item. Al treilea trebuie setat explicit pe Value. Următorul: Combine Text (Repeat Results, New Lines) după End Repeat.
- 2026-11-23: confirmat: al treilea buton are Value bifat (doar eticheta arată „Repeat Item”). OK, merge mai departe.
- 2026-11-23: ✔ Combine Repeat Results with New Lines. Partea 2 (somn) gata. Următorul: Partea 3, Get Contents of URL (URL, POST, header apikey), apoi corpul JSON.
- 2026-11-23: ✔ URL, POST și header apikey puse. Următorul: Request Body JSON cu 4 câmpuri: p_token (Text, cheia din app), p_day (Text, Current Date yyyy-MM-dd), p_steps (Number, Statistics), p_sleep (Text, Combined Text).
- 2026-11-23: nu găsește Current Date. I-am dat varianta A (derulează bara de variabile spre dreapta) și varianta B (acțiunea Format Date cu Current Date, Custom yyyy-MM-dd, trasă deasupra lui Get Contents, apoi Formatted Date în p_day).
- 2026-11-23: ✔ toate cele 4 câmpuri JSON puse (p_token, p_steps=Sum, p_sleep=Combined Text, p_day=Current Date). De verificat: Current Date are formatul Custom yyyy-MM-dd. Următorul: rulează `2026-11-23_health_v2.sql`, adaugă Show Notification (Contents of URL), prima rulare ▶.
- 2026-11-23: prima rulare → „No API key found” (antetul nu ajunge, probabil un spațiu în numele lui). Soluție testată cu curl: apikey pus în URL (`?apikey=...`), antetul șters. Câmpul p_day scos: serverul folosește data de azi (Europe/Bucharest). SQL nou `2026-11-23_health_v3.sql` (conține și v2, care a fost șters).
- 2026-11-23: ✔ **PAȘII MERG** din Health: {"day":"2026-11-23","steps":14888}. Somnul vine null, adică textul cu somnul ajunge gol (nicio bucată de somn găsită în ultimele 24 h, sau o problemă la Find/Repeat). Diagnostic cerut: există somn azi-noapte în Health? Plus o notificare temporară cu Combined Text.
- 2026-11-23: în Health nu există somn (nu a purtat ceasul), deci null e corect. Somnul se verifică după prima noapte cu ceasul. Ghidul `SCURTATURA_APPLE_HEALTH.txt` e rescris cu varianta care a mers (bun și pentru prieteni). Următorul: Partea 4, automatizările pe ore.
- 2026-11-23: automatizările gata. Fără antrenamente de pe Watch, doar pașii (și somnul). Etapa 3 începută: free-exercise-db (876 exerciții, Unlicense), listă slabă de 124 KB în app (`src/data/exercises.json`, regenerabilă cu `scripts/build-exercises.mjs`), cu aliasuri RO/EN (pec → Butterfly). Căutare cu teste (31 de teste trec), ecranul Workout (forță cu serii, fișă cu 2 poze alternate și pași în engleză, cardio cu ritm/viteză, HIIT, exercițiu propriu). Coloana `workouts.title` necesită SQL.
- 2026-11-23: SQL title rulat. Etapa 3 testată complet: forță (Butterfly 2 serii, Barbell Squat 82,5 kg, exercițiu propriu „Hack squat aparat sala”), cardio 5 km / 27 min (ritm 5:24), HIIT Tabata 8 runde. Totul în cloud; serie adăugată și ștearsă fără internet → sincronizate; reîncărcarea arată corect; exercițiul propriu apare primul la căutare.
- 2026-11-23: BUG pe telefonul real: „+ Forță” nu făcea nimic. Cauza: `crypto.randomUUID` nu există pe adrese http nesecurizate (http://192.168.100.41), iar eu testasem pe localhost. Afecta și apa/mesele. Reparat cu `src/lib/uuid.ts` (getRandomValues, merge peste tot) + test; verificat prin adresa LAN (isSecureContext=false): serie și apă salvate în cloud. De acum testez și prin adresa LAN, nu doar localhost.
- 2026-11-23: Etapa 4 Calendar gata (`src/pages/Calendar.tsx`, `src/lib/month.ts` + teste; 36 de teste trec). Lună cu ‹ › (fără luni viitoare, zilele viitoare dezactivate), puncte: antrenament/mese/apă/altele, „N zile cu antrenament”. Pagina zilei = ecranul Azi + Antrenament pentru acea zi. Greutatea pentru o zi trecută = ultima introdusă până atunci (altfel cea din profil); greutatea pusă pe o zi trecută NU schimbă profilul (verificat). Testat prin adresa LAN.

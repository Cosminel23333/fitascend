# Caiet: FitAscend

## Scop
Aplicație fitness web (PWA), cu iconiță pe iPhone, pentru tine și câțiva prieteni. Adună într-un singur loc antrenamentele, mesele, apa, somnul, pașii și restul, cu un calendar central. Cost 0 lei.

## Unde am rămas (2026-11-26, final de zi)
Totul e publicat la https://cosminel23333.github.io/fitascend/ și salvat pe GitHub. Toate SQL-urile sunt rulate.

**Ce e gata (V1 + V2 până acum):**
- **V1:** cont, profil, calculator calorii; Azi (mese, apă, somn, pași, timp pe telefon, greutate, suplimente); Antrenament (876 exerciții, serii × kg, cardio, HIIT, exerciții proprii); Calendar; pași + somn din Apple Health prin Scurtătură; merge fără semnal (coada de netrimise)
- **V2.1 Mese salvate:** bifa „Salvează în Mesele mele”, apoi adaugi cu o atingere (în profil, `saved_meals`). Confirmat de tine.
- **V2.3 Splash cu logo** (tunel de lumină + bară pe logo). Părerea ta de pe telefon încă nu am primit-o.
- **V2.4 Progres (complet):**
  - sub fiecare exercițiu din antrenament: „Data trecută”, „Azi încearcă” (progresie dublă) și „Record”; câmpurile vin precompletate
  - buton „Progres și tehnică” sus în Antrenament: bare pe săptămâni (Volum / Frecvență), **figura 3D hologramă** (BodyParts3D, CC BY 4.0; mușchii lucrați în 7 zile pulsează roșu; rotire 360° în 30 s; organele genitale scoase la cererea ta), lista exercițiilor făcute → fiecare cu videoclipul tău Higgsfield + Record/1RM/Sesiuni + grafic animat
  - fișa ⓘ arată videoclipul tău (110 clipuri, linkuri de pe CDN-ul Higgsfield; dacă le ștergi acolo, dispar și aici)
- **V2.5 Coduri de bare:** „Scanează codul” în „Adaugă masă” (camera live; rezervă: „Poză la cod”). Caută în: produsele adăugate de voi (tabelul comun `foods`) → Open Food Facts → USDA (DEMO_KEY, ~30/oră). Negăsit → „Produs nou” (valori la 100 g de pe ambalaj, o singură dată, apoi îl găsește oricine). Alegi gramele → masa se completează. Poza la etichetă (OCR) a fost scoasă la cererea ta.
- **Reparații de interfață:** ferestrele de completare apar sus (nu le mai împinge tastatura), fără tastatură automată la masă; apăsarea din nou pe tab-ul curent te duce la prima vedere (ex. din zi înapoi la lună în Calendar)

**Netestat de mine pe iPhone real:** camera live la scanare, ferestrele cu tastatura deschisă, fluiditatea figurii 3D.

## Pașii următori
1. Tu, pe iPhone: scanare live pe un produs + un produs negăsit (îl adaugi, apoi îl scanezi din nou); spui dacă vreun videoclip e la exercițiul greșit sau dacă roșul de pe figura 3D nu cade pe mușchiul corect
2. Următoarea funcție (de ales): **V2.6 streak-uri + insigne + rezumat săptămânal** (propunerea mea), V2.7 notificări, V2.8 export Excel/CSV, V2.9 widget + Siri. Mic: „apasă + Serie ca să salvezi” sub exercițiu
3. Întrebări încă deschise: iconița iPhone din „App icon logo”? golesc cache-ul npm (~1 GB)? scot logo-urile originale din istoricul GitHub (ireversibil; implicit le las)? părerea ta despre splash
4. De verificat: somnul din Health după o noapte cu ceasul
5. Amânate (decizia ta): „Am uitat parola” / „Schimbă parola”

## Decizii luate
- PWA, nu nativă: fără Mac și fără 99$/an
- Supabase gratuit e sursa datelor; pe telefon doar coada de netrimise + profilul; o scriere respinsă nu blochează coada (copie în `fitascend-rejected`)
- Apple Health doar pentru pași + somn, prin Scurtătură (fără antrenamente de pe Watch). Timpul pe telefon rămâne manual.
- Greutatea zilnică e opțională: fără valoare se folosește ultima introdusă / cea din profil; doar greutatea de azi schimbă profilul
- Somn/pași/timp pe telefon/greutate: o valoare pe zi. Apa și mesele: oricâte.
- Formula calorică: Katch-McArdle cu % grăsime, altfel Mifflin-St Jeor; ținte -25/-15/0/+10/+15%, minim 1200 (F) / 1500 (M)
- Paleta de apus cosmic; fontul de sistem iPhone; logo „Premium-app-logo”; preview link „App icon logo”
- Repo public pe GitHub (codul e public, datele nu); docx, chestionarul și logo-urile originale rămân local

## Probleme deschise
- Conturi de test în Supabase: fitascend.test.a/b/c@example.com (se pot șterge din Authentication → Users)
- Originalele logo (16 MB) rămân în istoricul git (commit 496c3e2)
- Descrierile exercițiilor sunt în engleză (vin așa din baza gratuită)

## Fișiere importante
- `SPEC.md`, `tasks/plan.md`: cerințe și plan (V1 bifat; lista V2 în SPEC secțiunea 11)
- `SCURTATURA_APPLE_HEALTH.txt`: ghidul Scurtăturii (verificat pe iOS 26), bun și pentru prieteni
- `supabase/schema.sql` (structura completă) + fișierele `2026-11-*.sql` (toate rulate; Supabase avertizează „destructive” la `drop policy if exists`: e normal)
- `app/src/lib/`: `outbox.ts` (coada), `sync.ts`, `profile.ts`, `day.ts`, `workouts.ts` (+ `loadSets`), `exercises.ts`, `calories.ts`, `month.ts`, `uuid.ts`, `progress.ts` (record, 1RM, săptămâni, mușchi), `videos.ts` + `data/videos.json`, `food.ts` (coduri de bare)
- `app/src/pages/`: `Today`, `Workout`, `Progress`, `Body3D`, `FoodScan`, `Calendar`, `Calculator`, `ProfileForm`, `HealthCard`, `Auth`, `Sheet`, `Splash`
- `app/public/models/body.glb`: figura 3D (1,7 MB); scripturile care l-au construit sunt în scratchpad-ul sesiunii, nu în repo
- `app/tests/`: 46 de teste
- `Logo si poze input/`: logo-urile tale + video-ul model (doar local)

## Publicare
- Cod: https://github.com/Cosminel23333/fitascend; aplicație: https://cosminel23333.github.io/fitascend/
- Orice `git push` pe `main` → teste + construire + publicare automată (~2–3 min). deploy-pages pică des cu „No artifacts named github-pages” (GitHub nu vede încă pachetul): din 2026-11-25 workflow-ul așteaptă 30 s și reîncearcă singur. Dacă pică și a doua oară: commit gol.
- Commit-uri cu emailul noreply 360365713+Cosminel23333@users.noreply.github.com

## Pentru mine (pornire)
`cd "D:\Aplicatie fitness\app"` → `npm run dev` (telefon: http://192.168.100.41:5173), `npm test`, `npm run build`. Dacă C: e plin: `TMP/TEMP` pe D: și rulezi direct `node node_modules/vitest/vitest.mjs run`, `node node_modules/typescript/bin/tsc -b`, `node node_modules/vite/bin/vite.js build`. Supabase: xjeblnwtwqahsqarbsez. Testez și prin adresa LAN (http), nu doar localhost.

## Jurnal
- 2026-11-23: chestionar → SPEC și plan aprobate → Etapele 0–4 (design, cont/profil/calculator, Azi, Antrenament, Calendar), toate testate cu date reale și fără internet
- 2026-11-23: Apple Health: Scurtătură construită pas cu pas pe iOS 26 (cheia apikey mutată în URL; filtrul de somn făcut pe server); pașii merg, automatizări setate
- 2026-11-23: bug pe telefon („+ Forță” mort pe http) reparat cu `uuid.ts`; parola uitată resetată prin SQL
- 2026-11-23: publicat pe GitHub Pages; splash cu logo v1 → v2 (tunel de lumină după video-ul tău) → bara de lumină reparată (nu mai rămâne la jumătate, fără colțuri pătrate)
- 2026-11-25: V2.1 mese salvate (Today.tsx, `setSaved` în profile.ts + test, coloana `saved_meals`); 37 de teste ok, build ok; SQL rulat de tine → publicat (deploy-pages a picat o dată temporar, re-rulat cu commit gol)
- 2026-11-25: mesele salvate confirmate pe telefon. V2.4 partea 1: progres pe exercițiu (record, 1RM, sugestie, grafic); 41 de teste ok; previzualizare cu playwright-cli și Supabase simulat (sesiune falsă în localStorage + route)
- 2026-11-25: publicarea pica la 4 din 8 rulări (deploy-pages) → adăugat reîncercare automată în deploy.yml; testat, a mers din a doua încercare; site-ul are progresul
- 2026-11-25: tu: progresul nu apărea în antrenament → mutat și sub exercițiu în card + precompletare; verificat în browser simulat
- 2026-11-25: tu: (1) înapoi la calendar doar din „‹ Calendar” → apăsarea din nou pe tab-ul curent revine la prima vedere (`home` în App.tsx); (2) foile de jos nu se vedeau / nu derulau pe iPhone → Sheet urmărește `visualViewport` (deasupra tastaturii), blochează pagina din spate (`html.sheet-open`), `overscroll-behavior: contain`; exercițiul nou se derulează în vedere. Tastatura nu se poate simula, deci (b) e neverificat pe iPhone
- 2026-11-25: pagina Progres și tehnică (`pages/Progress.tsx`, `lib/videos.ts`, `byExercise` + test, `loadSets` cu paginare de 1000); 42 de teste; verificat în browser simulat (video rulează, grafic animat)
- 2026-11-25: V2.4 rest (volum/frecvență/harta mușchilor) + ferestre sus. Capcană: clasa CSS `.bar` (macronutrienți, height 6px) se aplica și pe `<rect>` SVG → redenumit `wk-bar`
- 2026-11-26: figura 3D hologramă (BodyParts3D + Three.js, shader propriu: fresnel cyan + zone roșii pulsând); verificat în browser simulat (pornește din față, se rotește, roșu pe piept/brațe)
- 2026-11-26: tu: scoate penisul din model → tăiat din piele + gol acoperit; verificat din față și profil
- 2026-11-26: V2.5 coduri de bare (barcode-detector 3.2.3 cu zxing-wasm pe iPhone) + OCR etichetă (tesseract.js 7.0.0); test cap-coadă în playwright cu imagini generate (scratchpad/v/test_images.py)
- 2026-11-26: scos OCR-ul; produse proprii comune în tabelul `foods` (RLS: citesc toți autentificații, modifică doar autorul); atenție: codurile 2xxxx sunt interne de magazin și pot exista în OFF cu produse aleatorii
- 2026-11-26: caietul curățat (rezumat unic sus); sfârșit de zi, totul publicat

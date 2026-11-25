# Caiet: FitAscend

## Scop
Aplicație fitness web (PWA), cu iconiță pe iPhone, pentru tine și câțiva prieteni. Adună într-un singur loc antrenamentele, mesele, apa, somnul, pașii și restul, cu un calendar central. Cost 0 lei.

## Unde am rămas (2026-11-26, după miezul nopții)
**Figura 3D (cerută de tine) în loc de silueta 2D:** hologramă cyan transparentă (piele, cum ai cerut: „să fie tot așa albastru și transparent”), scheletul vizibil, mușchii lucrați în ultimele 7 zile pulsează roșu; pornește din față și se rotește singură 360° în 30 s; inel luminos la picioare. `pages/Body3D.tsx` (Three.js 0.186.1, încărcat separat doar în pagina Progres), model `app/public/models/body.glb` (1,7 MB). Dacă WebGL nu merge → silueta 2D veche. Zonele mușchilor = elipsoide în metri (ZONES din Body3D.tsx): se pot ajusta dacă roșul nu cade exact pe mușchi.
- Model: BodyParts3D (DBCLS), licență CC BY 4.0 → mențiunea e sub figură (obligatorie). Lipsesc din bază drept abdominal și dorsal mare, dar zonele colorează ce e în regiune.
- Higgsfield n-a fost folosit: 3 credite în cont, un model 3D costă 7–25.
- Cum am construit body.glb (scripturi în scratchpad, nu în repo): arhiva isa_BP3D_4.0_obj_99.zip → mușchi/oase/piele după ierarhia is-a (FMA5022/5018/7163) → `to_glb.py` → gltf-transform + meshoptimizer (26k/34k/46k triunghiuri, quantize, meshopt).

## Înainte (2026-11-25, noaptea)
**V2.4 completă:** în pagina Progres și tehnică, deasupra listei: „Pe săptămâni” (bare pe 8 săptămâni, comutator Volum / Frecvență, atingi o bară → valoarea) și „Mușchi lucrați în ultimele 7 zile” (siluetă față/spate în stil hologramă cyan, mușchii lucrați în roșu, intensitate după serii: 8 serii = plin; serie principală = 1, secundară = 0,5) + lista mușchilor cu serii. Calcule: `weekOf`, `weekly`, `muscleSets` în progress.ts (cu teste, 45 total).
**Ferestrele de completare** (masă, apă, căutare, fișa ⓘ…) apar acum SUS, nu jos (tu: „tot jos rămâne” chiar și după reparația cu tastatura). Dacă tot nu e bine pe iPhone: următorul pas e să scot deschiderea automată a tastaturii.

## Înainte (2026-11-25, seara)
**Pagina „Progres și tehnică” (cerută de tine):** buton sus în Antrenament → lista exercițiilor făcute (record, sesiuni, ▶ dacă are video) → atingi unul: videoclipul tău Higgsfield + Record/1RM/Sesiuni + grafic animat + toate sesiunile. Graficul NU mai e în fișa ⓘ; fișa ⓘ arată acum videoclipul tău (dacă există), altfel pozele vechi.
- Videoclipuri: 110 (contul tău Higgsfield, modelul seedance_2_5, hologramă cyan cu mușchii în roșu). Lista în `app/src/data/videos.json` (nume, id exercițiu, link); 106 legate de exerciții din bibliotecă, 4 doar după nume (Burpee, Landmine Press, Reverse Lunge, Side Lunge: merg dacă ai exerciții proprii cu exact aceste nume). Linkurile sunt direct de pe CDN-ul Higgsfield (publice, permanente, ~1,5 MB/bucată). Dacă le ștergi din Higgsfield, dispar și din aplicație.
- Potrivirea nume → exercițiu e făcută de mine; câteva sunt aproximări (ex. Pistol Squat → Kettlebell Pistol Squat, Single-Leg RDL → Kettlebell One-Legged Deadlift, Nordic → Natural Glute Ham Raise, Seated Machine Row → Leverage Iso Row). Scriptul: scratchpad, nu în repo.
- Apăsarea din nou pe „Antrenament” jos te scoate din pagina de progres.

## Înainte (2026-11-25, după-amiaza)
**V2.4 partea 1, Progres pe exercițiu: publicat (6ffefe5).** În fișa exercițiului (ⓘ / i) apare „Progresul tău”: recordul (cea mai grea serie), 1RM estimat (Epley), „Data trecută” + „Azi încearcă” (progresie dublă: +1 rep până la 12, apoi +2,5 kg și 8 rep.), un grafic al 1RM-ului pe sesiuni (atingi un punct și vezi valoarea) și lista „Toate sesiunile”. Calculele sunt în `lib/progress.ts` (cu test), citirea în `loadHistory` (workouts.ts). Verificat în browser cu date simulate. Merge doar cu internet.
- **Și în cardul de antrenament (a9ad718):** sub fiecare exercițiu: „Data trecută (data): serii”, „Azi încearcă: …” și „Record …”; câmpurile reps × kg vin precompletate cu sugestia. Tu ai cerut asta: nu găseai progresul (era doar în fișa ⓘ).
- Exercițiu propriu cu același nume = refolosit (înainte făcea unul nou și istoricul se rupea).
- V2.4 rămas: grafice de volum/frecvență, harta mușchilor lucrați.

**V2.1 Mese salvate: publicat, testat de tine pe telefon (ok).** Cum funcționează: bifa „Salvează în Mesele mele” în fereastra mesei; masa apare ca buton „+” deasupra lui „Adaugă masă” și se adaugă cu o atingere; „Modifică” le șterge. Sunt ținute în profil (`saved_meals`), deci merg și fără semnal.
- C: are acum 76 GB liberi (rezolvat). Parolele sunt amânate (decizia ta).

## Înainte (2026-11-23)
**V1 e completă și online: https://cosminel23333.github.io/fitascend/**
- ✔ Cont/login, profil (editabil, inclusiv obiectivul), calculator calorii
- ✔ Ecranul Azi: mese, apă, somn, pași, timp pe telefon, greutate (opțională), suplimente
- ✔ Antrenament: căutare (876 de exerciții, „pec” → Butterfly), serii × kg, fișă cu poze, cardio, HIIT, exerciții proprii
- ✔ Calendar: lunile anterioare, puncte pe zile, pagina zilei, editare pentru zile trecute
- ✔ Pașii din Apple Health prin Scurtătură, automat de câteva ori pe zi
- ✔ Datele stau doar în cloud; pe telefon doar coada de netrimise (+ profilul)
- ✔ V2.3 în lucru: splash cu logo-ul (tunel de lumină roșu/auriu la pornire; logo 3D cu bară de lumină la schimbarea paginii). Ultima corectură (bara traversează tot logo-ul, decupată pe colțurile rotunjite) e publicată (213e6a9). **Nu am primit încă părerea ta de pe telefon.**

## Pașii următori
0. Tu: testezi pe iPhone figura 3D (se încarcă? e fluidă? roșul pe mușchii corecți?) + ferestrele de sus + graficele pe săptămâni
   - Apoi: V2.6 streak-uri/insigne, V2.5 coduri de bare sau V2.7 notificări; mica îmbunătățire „apasă + Serie ca să salvezi” încă nefăcută
   - ✔ Pagina Progres și tehnică ok (confirmat). Alarmă falsă „nu se salvează”: ai ales exercițiul fără „+ Serie” (valorile precompletate par salvate). Idee propusă: exercițiul ales să rămână după refresh + mesaj „apasă + Serie ca să salvezi”
   - Următorul (propus): restul V2.4 (volum săptămânal + frecvență + harta mușchilor în pagina Progres) sau V2.6 streak-uri, V2.5 coduri de bare, V2.7 notificări
1. Tu: testezi pe iPhone (9f515c5): (a) din ziua deschisă în Calendar, apeși iar „Calendar” jos → revii la lună; (b) „+ Adaugă masă” cu tastatura deschisă: se vede tot până la „Salvează”; (c) fișa ⓘ: derulezi până la grafic; (d) exercițiu nou adăugat urcă singur în mijlocul ecranului
   - Dacă (b) tot nu merge: următorul pas e să scot autoFocus (tastatura să nu mai apară singură)
   - ✔ Progresul în card merge (confirmat). Graficul: în fișa ⓘ, de la 2 zile diferite
2. Apoi: restul V2.4 (volum/frecvență, harta mușchilor) sau altă funcție V2
3. Tot deschis: părerea ta despre splash; întrebările:
   - fac iconița de pe ecranul iPhone-ului din „App icon logo”?
   - golesc cache-ul npm (~1 GB pe C:)? E sigur, se redescarcă la nevoie.
   - scot complet logo-urile originale din istoricul GitHub (force push, ireversibil)? Implicit le las.
4. Restul V2: coduri de bare, streak-uri, notificări (parolele: amânate)
5. De verificat: somnul din Health după prima noapte cu ceasul

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
- `SPEC.md`, `tasks/plan.md`: cerințe și plan (V1 bifat)
- `SCURTATURA_APPLE_HEALTH.txt`: ghidul Scurtăturii (verificat pe iOS 26), bun și pentru prieteni
- `supabase/schema.sql` (structura completă) + fișierele `2026-11-23_*.sql` (toate rulate)
- `app/src/lib/`: `outbox.ts` (coada), `sync.ts`, `profile.ts`, `day.ts`, `workouts.ts`, `exercises.ts`, `calories.ts`, `month.ts`, `uuid.ts`
- `app/src/pages/`: `Today`, `Workout`, `Calendar`, `Calculator`, `ProfileForm`, `HealthCard`, `Auth`, `Sheet`, `Splash`
- `app/tests/`: 36 de teste
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

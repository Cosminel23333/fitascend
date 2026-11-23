# Caiet: FitAscend

## Scop
Aplicație fitness web (PWA), cu iconiță pe iPhone, pentru tine și câțiva prieteni. Adună într-un singur loc antrenamentele, mesele, apa, somnul, pașii și restul, cu un calendar central. Cost 0 lei.

## Unde am rămas (2026-11-23, seara)
**V1 e completă și online: https://cosminel23333.github.io/fitascend/**
- ✔ Cont/login, profil (editabil, inclusiv obiectivul), calculator calorii
- ✔ Ecranul Azi: mese, apă, somn, pași, timp pe telefon, greutate (opțională), suplimente
- ✔ Antrenament: căutare (876 de exerciții, „pec” → Butterfly), serii × kg, fișă cu poze, cardio, HIIT, exerciții proprii
- ✔ Calendar: lunile anterioare, puncte pe zile, pagina zilei, editare pentru zile trecute
- ✔ Pașii din Apple Health prin Scurtătură, automat de câteva ori pe zi
- ✔ Datele stau doar în cloud; pe telefon doar coada de netrimise (+ profilul)
- ✔ V2.3 în lucru: splash cu logo-ul (tunel de lumină roșu/auriu la pornire; logo 3D cu bară de lumină la schimbarea paginii). Ultima corectură (bara traversează tot logo-ul, decupată pe colțurile rotunjite) e publicată (213e6a9). **Nu am primit încă părerea ta de pe telefon.**

## Pașii următori (mâine)
1. Tu: îmi spui cum arată splash-ul și bara de lumină pe telefon, apoi ajustăm
2. Întrebări fără răspuns de la tine:
   - fac iconița de pe ecranul iPhone-ului din „App icon logo”?
   - golesc cache-ul npm (~1 GB pe C:)? E sigur, se redescarcă la nevoie.
   - scot complet logo-urile originale din istoricul GitHub (force push, ireversibil)? Implicit le las.
3. Apoi alegem din lista V2: „Am uitat parola”/„Schimbă parola”, mese salvate, recorduri/1RM/grafice, coduri de bare, streak-uri, notificări
4. De verificat: somnul din Health după prima noapte cu ceasul

## ⚠ De rezolvat pe calculator
- **Discul C: e plin** (0 GB liberi din 223). Din cauza asta pică npm/ffmpeg. Am rulat testele și construirea cu TMP pe D:. Recomandat: Disk Cleanup, golit Coșul de reciclare, mutat fișiere mari pe D:.

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
- Orice `git push` pe `main` → teste + construire + publicare automată (~2 min). Dacă pasul deploy-pages dă o eroare temporară, se re-rulează cu un commit gol.
- Commit-uri cu emailul noreply 360365713+Cosminel23333@users.noreply.github.com

## Pentru mine (pornire)
`cd "D:\Aplicatie fitness\app"` → `npm run dev` (telefon: http://192.168.100.41:5173), `npm test`, `npm run build`. Dacă C: e plin: `TMP/TEMP` pe D: și rulezi direct `node node_modules/vitest/vitest.mjs run`, `node node_modules/typescript/bin/tsc -b`, `node node_modules/vite/bin/vite.js build`. Supabase: xjeblnwtwqahsqarbsez. Testez și prin adresa LAN (http), nu doar localhost.

## Jurnal
- 2026-11-23: chestionar → SPEC și plan aprobate → Etapele 0–4 (design, cont/profil/calculator, Azi, Antrenament, Calendar), toate testate cu date reale și fără internet
- 2026-11-23: Apple Health: Scurtătură construită pas cu pas pe iOS 26 (cheia apikey mutată în URL; filtrul de somn făcut pe server); pașii merg, automatizări setate
- 2026-11-23: bug pe telefon („+ Forță” mort pe http) reparat cu `uuid.ts`; parola uitată resetată prin SQL
- 2026-11-23: publicat pe GitHub Pages; splash cu logo v1 → v2 (tunel de lumină după video-ul tău) → bara de lumină reparată (nu mai rămâne la jumătate, fără colțuri pătrate)

# Spec: FitAscend — V1

Document de cerințe. Sursa: `INTREBARI_aplicatie_fitness.txt` și `9. Orice altceva.docx` (completate pe 2026-11-23).

## 1. Obiectiv

FitAscend este o aplicație fitness care adună într-un singur loc tot ce ține de sănătate: antrenamente de forță, cardio și HIIT, mese și calorii, apă, somn, pași, greutate, suplimente și timpul petrecut pe telefon. **Calendarul e piesa centrală**: atingi o zi și vezi tot ce s-a întâmplat în ea.

- **Utilizatori:** tu și câțiva prieteni, fiecare cu contul lui. Aplicația nu va fi publicată.
- **Unde rulează:** ca aplicație web (PWA), cu iconiță pe ecranul principal al iPhone-ului (12 Pro Max, iOS 26). Merge și în browserul de pe calculator.
- **Cost:** 0 lei. Folosim doar servicii cu plan gratuit.
- **Limbi:** română și engleză, comutabile din setări.
- **Unități:** kilograme și kilometri.

### Ce intră în V1, adică primele 3 zile de lucru

Pornește de la cele 3 priorități ale tale, plus minimul fără de care aplicația nu funcționează.

| # | Funcție | Ce înseamnă concret |
|---|---|---|
| 1 | **Cont și login** | Creare cont cu email și parolă. Fiecare utilizator își vede doar datele lui. |
| 2 | **Profil inițial** | Completat o singură dată, la prima intrare: sex, data nașterii, înălțime, greutate, nivel de activitate, obiectiv, nivel (începător/intermediar/avansat) și, opțional, % grăsime |
| 3 | **Calendar** | Vedere pe lună, cu un indicator pe zilele care au date. Atingi o zi și vezi totul: antrenament, mese, apă, somn, pași, greutate, suplimente, timp pe telefon. |
| 4 | **Jurnal de antrenament** | Căutare de exerciții după nume, cu sugestii (scrii „pec” și apare „Pec Fly”), imagine și mușchii lucrați. Pentru fiecare exercițiu notezi seriile: repetări × kg. Cardio: distanță, timp, ritmul se calculează automat. HIIT: durată, runde, notițe. |
| 5 | **Datele zilei** | Apa și mesele se pot adăuga **de mai multe ori pe zi**, fiecare cu un **indicator animat care se umple procentual** față de țintă. O masă are nume, descriere, kcal și, opțional, proteine/carbohidrați/grăsimi. Somnul (ore), pașii, timpul pe telefon și suplimentele (bifă zilnică) se introduc manual. Greutatea e opțională, oricând vrei. |
| 6 | **Calculator de calorii** | BMR calculat cu Mifflin-St Jeor sau cu Katch-McArdle, dacă știi % grăsime. Rezultă TDEE și ținte pentru **menținere, slăbire, slăbire agresivă, bulk ușor și bulk**, cu macronutrienți recomandați. Ținta aleasă alimentează indicatorul de la mese. |
| 7 | **Merge fără semnal** | Ce introduci la sală fără semnal se păstrează pe telefon **doar până se trimite**. Trimiterea se face automat imediat ce există internet: date mobile sau orice Wi-Fi. După ce ajunge în cloud, se **șterge de pe telefon**, ca să nu ocupe memorie. |
| 8 | **Datele stau în cloud** | Calendarul și istoricul se citesc din cloud. Ce pui pe telefon apare și pe calculator, și invers. Fără internet vezi doar ce ai introdus și încă nu s-a trimis. |
| 9 | **Aspect** | Paleta de apus cosmic (secțiunea 2), carduri de sticlă, optimizată pentru telefon. Logo și ecran de încărcare **provizorii**: cele finale vin în V2, după ce le discutăm. |

## 2. Design

- **Paleta**, preluată din poza ta de referință:
  - prună închis `#5E0F45`: fundaluri adânci
  - magenta `#B5305F`: accent principal
  - roșu `#D6303A`: alerte, valori depășite
  - portocaliu `#EE4A1F`: butoane principale, flăcări
  - ocru `#C4813F`: detalii aurii, recorduri
- **Atmosfera**, după prima poză (Crest): fundal închis cu gradient de apus, carduri semitransparente tip sticlă, inel luminos, tipografie mare și curată.
- **Inspirație de structură și mișcare:** theinfinitysocks.com și sztanki.com. Le analizez la etapa de design.
- **Telefonul are prioritate:** butoane de mărime normală, frumoase, totul accesibil cu degetul mare și fără lag.
- **Mod întunecat și luminos:** V1 e doar întunecat, iar varianta luminoasă vine în V2.

## 3. Tehnologie (aleasă de mine, toate gratuite)

| Componentă | Alegere | De ce |
|---|---|---|
| Interfață | React 19 + Vite + TypeScript | Standard, rapid, se poate instala ca aplicație |
| Instalare și offline | vite-plugin-pwa (service worker) | Iconiță pe ecran; aplicația se deschide și fără internet |
| Coada de trimitere | Memoria locală a browserului (doar intrările netrimise) | Se golește automat după trimitere. Datele tale nu rămân pe telefon. |
| Cloud și login | Supabase, plan gratuit | Bază de date Postgres plus conturi, 500 MB gratuit |
| Exerciții | free-exercise-db (peste 800 de exerciții, domeniu public): lista de nume e inclusă în aplicație, iar pozele se încarcă la cerere | Căutarea merge și fără internet, fără să ocupe memorie |
| Animații | GSAP | Fluide pe telefon |
| 3D (V2) | Three.js | Modelul care se rotește la intrare |
| Găzduire | GitHub Pages sau Cloudflare Pages | Gratuit, cu HTTPS (obligatoriu pentru PWA) |
| Teste | Vitest (formule) + Playwright (simulare iPhone) | Verificare automată |

**Cum ajung datele din Apple Health (V2):** printr-o **Scurtătură iOS**. Iconița FitAscend de pe ecran va porni scurtătura, care citește pașii, somnul și antrenamentele din Health, le trimite în baza de date și abia apoi deschide aplicația. În plus, o automatizare o rulează de câteva ori pe zi. **Timpul petrecut pe telefon rămâne manual**, pentru că Apple nu permite citirea lui.

## 4. Structura datelor

- `profiles`: profilul fiecărui utilizator și ținta calorică aleasă
- `workouts`: un antrenament (data, tip: forță/cardio/HIIT, durată, distanță, notițe)
- `workout_sets`: seriile unui antrenament (exercițiu, nr. serie, repetări, kg)
- `entries`: tot ce se introduce zilnic, câte un rând pe intrare (apă, masă, somn, pași, greutate, timp pe telefon, supliment). Așa, calendarul citește o zi cu o singură interogare.
- Exercițiile vin dintr-un fișier inclus în aplicație. Exercițiile adăugate de tine ajung în `custom_exercises`.

Fiecare tabel are reguli de acces (RLS) care permit unui utilizator să vadă și să modifice **doar rândurile lui**.

**Fluxul unei intrări** (decis pe 2026-11-23, la cererea ta):
1. Apeși „Salvează” și intrarea apare imediat pe ecran, intrând în coada de trimitere de pe telefon
2. Dacă e internet (date mobile sau orice Wi-Fi), se trimite în cloud în aceeași secundă și **dispare din coadă**
3. Dacă nu e internet, rămâne în coadă. Se trimite singură când revine semnalul sau când redeschizi aplicația, verificând și la fiecare 30 de secunde.
4. Pe telefon rămân doar fișierele aplicației (sub 1 MB), ca să se deschidă repede. **Datele tale nu rămân.** Pozele exercițiilor se încarcă din internet doar când le deschizi și nu se păstrează.

## 5. Comenzi (pentru mine; tu nu trebuie să rulezi nimic)

```
npm install          # instalează dependențele
npm run dev          # pornește aplicația local (și pe telefon, în aceeași rețea Wi-Fi)
npm test             # testele pentru formule
npm run build        # versiunea finală pentru publicare
```

## 6. Structura proiectului

```
D:\Aplicatie fitness\
  SPEC.md              acest document
  NOTEBOOK.md          caietul: unde am rămas, jurnal după fiecare mesaj
  tasks/plan.md        planul pe etape
  app/                 codul aplicației
    src/pages/         ecranele (Calendar, Antrenament, Azi, Calculator, Profil)
    src/lib/           formule, bază de date, sincronizare, traduceri
    src/data/          lista de exerciții
    public/            iconițe, manifest
    tests/             teste
  supabase/            structura bazei de date (SQL)
```

## 7. Cum scriem codul

- Componente React mici, câte una pe fișier; formulele stau separat, în `src/lib`, și au teste
- Textele nu se scriu direct în cod, ci trec prin `t('cheie')`, ca să meargă în română și engleză
- Culorile sunt definite o singură dată, ca variabile CSS (`--plum`, `--magenta` etc.)

```ts
// src/lib/calories.ts
export function bmrMifflin(sex: 'm' | 'f', kg: number, cm: number, age: number) {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);
}
```

## 8. Testare

- **Formule** (BMR, TDEE, ținte, macronutrienți, ritm cardio): teste Vitest cu valori verificate manual
- **Fluxuri principale** pe un iPhone simulat (Playwright): login, adăugare antrenament, adăugare apă, deschiderea unei zile din calendar
- **Pe telefonul tău:** după fiecare etapă îți trimit link-ul și îmi spui ce vrei schimbat

## 9. Reguli de lucru

- **Fac mereu:** actualizez NOTEBOOK.md după fiecare mesaj, testez formulele, verific pe ecran de telefon înainte să-ți arăt
- **Te întreb înainte de:** logo, modelul 3D, schimbări de design, orice ar costa bani, ștergerea datelor
- **Nu fac niciodată:** nu pun parole sau chei secrete în cod, nu public aplicația pentru alții, nu folosesc servicii plătite

## 10. Criterii de reușită pentru V1

1. Aplicația se deschide de pe iconița de pe iPhone, pe tot ecranul, fără bara Safari
2. Cu telefonul în modul avion poți adăuga un antrenament. După ce revine internetul, el apare pe calculator în cel mult 10 secunde, iar coada de pe telefon rămâne goală.
3. Dacă atingi o zi în calendar, vezi toate datele introduse în ziua respectivă
4. Calculatorul de calorii dă aceleași valori ca formulele verificate manual (prin teste)
5. Un prieten își poate face cont și nu vede nimic din datele tale
6. Prima încărcare durează sub 3 secunde pe 4G, iar navigarea între ecrane e fluidă, fără lag
7. Costul este 0 lei

## 11. Amânat pentru V2 și mai departe (nu se pierde nimic)

În ordinea propusă:
- **V2.1** Mese salvate, pe care le adaugi cu o atingere (problema ta principală cu alte aplicații)
- **V2.2** ✔ (adus în V1, 2026-11-23) Sincronizare din Apple Health prin Scurtătură: pași și somn. Antrenamentele de pe Watch **nu** se importă (decizia ta).
- **V2.3** Ecranul de intrare: model 3D care se rotește lent, buton ASCEND cu flăcări cosmice, logo final, tranziția cu logo între pagini
- **V2.4** Recorduri personale, 1RM estimat, sugestii de progresie, grafice (forță, volum, frecvență), hartă a mușchilor lucrați
- **V2.5** Bază de alimente (Open Food Facts) și scanare de coduri de bare
- **V2.6** Streak-uri, insigne, nivele, rezumat săptămânal și lunar
- **V2.7** Notificări și remindere (inclusiv pentru suplimente)
- **V2.8** Export în Excel/CSV/PDF și import (din Health și din alte aplicații)
- **V2.9** Widget pe ecranul iPhone-ului (prin aplicația gratuită Scriptable) și comenzi Siri (prin Scurtături)
- **Mai târziu:** programe proprii (Push/Pull/Legs), măsurători corporale, poze de progres, plan de masă generat, mod luminos

## 12. Decizii la întrebările deschise (2026-11-23)

1. **Publicare:** GitHub Pages. Codul e public, datele rămân private în Supabase.
2. **Cont Supabase:** îl creezi tu la Etapa 5, după pașii exacți pe care ți-i dau.
3. **Confirmarea pe email:** dezactivată, ca un cont nou să fie gata imediat.

SPEC aprobat pe 2026-11-23.

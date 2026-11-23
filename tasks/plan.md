# Plan: FitAscend V1

Bazat pe `SPEC.md`. Fiecare etapă se termină cu ceva ce poți vedea pe telefon. După fiecare etapă mă oprești și îmi dai indicații.

## Ordinea și de ce

```
Etapa 0  Schelet + design de bază                         ✔
Etapa 1  Cloud (Supabase) + cont + coada de trimitere + profil + calculator
Etapa 2  Azi: apă, mese, somn, pași...        ┐
Etapa 3  Antrenament + căutare exerciții      ├─ toate scriu în cloud prin coadă
Etapa 4  Calendar (citește din cloud)         ┘
Etapa 5  Publicare online + instalare pe iPhone
```

Revizuit pe 2026-11-23: datele stau în cloud, iar pe telefon rămân doar intrările netrimise, până la trimitere. De aceea cloud-ul și contul vin primele (Etapa 1): toate ecranele de după scriu direct acolo.

---

## Ziua 1

### Etapa 0 — Schelet și design de bază ✔
- [x] Proiect React + Vite + TypeScript în `app/`, cu suport PWA (manifest, iconiță provizorie)
- [x] Paleta și stilul de bază: variabile CSS, fundal cu gradient de apus, card de sticlă, butoane, tipografie
- [x] Bara de navigare de jos: Azi · Antrenament · Calendar · Calorii · Profil
- [x] Traduceri RO/EN cu `t('cheie')`
- [x] **Tu:** design aprobat („e perfect”)

### Etapa 1 — Cloud, cont, coadă, profil, calculator ✔
- [x] Formulele, cu teste: BMR (Mifflin-St Jeor, Katch-McArdle), TDEE, ținte (menținere, slăbire, slăbire agresivă, bulk ușor, bulk), macronutrienți, țintă de apă, ritm cardio
  - Gata când: `npm test` trece cu valori verificate manual
- [x] Structura bazei de date (`supabase/schema.sql`): tabele + reguli RLS + permisiuni
- [x] **Tu:** creezi proiectul Supabase și rulezi fișierul SQL, după pașii mei (~10 minute)
- [x] Coada de trimitere: salvare → trimitere imediată dacă e internet, altfel păstrare și retrimitere automată; ștergere după trimitere
  - Verificare: în modul avion intrarea stă în coadă; la revenirea internetului ajunge în cloud și coada se golește
- [x] Ecranele de login și de creare cont
  - Verificare: un al doilea cont de test nu vede datele primului
- [x] Profilul inițial (la prima intrare) și ecranul Calorii, cu alegerea țintei

## Ziua 2

### Etapa 2 — Ecranul „Azi” ✔ (suplimentele așteaptă SQL-ul tău)
- [x] Apa: butoane rapide (+250 ml, +500 ml, altă valoare), de câte ori vrei pe zi, cu un pahar animat care se umple până la țintă
- [x] Mese: nume, descriere, kcal, macronutrienți opționali, de mai multe ori pe zi, cu un indicator animat de kcal față de țintă
- [x] Somn, pași, timp pe telefon, greutate (opțional), bife pentru suplimente
- [x] Ștergerea și editarea unei intrări
  - Verificare: adaugi apă în modul avion; apare imediat, iar după revenirea internetului e în cloud

### Etapa 3 — Antrenament ✔
- [x] Lista de nume din free-exercise-db (pozele se încarcă la cerere) și o căutare cu sugestii („pec” → Pec Fly / Pec Deck)
- [x] Fișa unui exercițiu: imagine, mușchi lucrați, descriere
- [x] Antrenamentul de forță: adaugi exerciții, iar la fiecare serii (repetări × kg)
- [x] Cardio (distanță, timp, ritm calculat automat) și HIIT (durată, runde, notițe)
- [x] Exercițiu propriu, dacă nu există în listă

## Ziua 3

### Etapa 4 — Calendar ✔
- [x] Vedere pe lună, cu indicatori pe zilele care au date
- [x] Atingi o zi și se deschide pagina zilei cu **tot**: antrenament, mese, apă, somn, pași, greutate, suplimente, timp pe telefon
- [x] Se pot adăuga sau modifica date și pentru zilele trecute

### Etapa 5 — Publicare și instalare
- [ ] Publicarea pe GitHub Pages, ca aplicația să meargă de oriunde: date mobile sau orice Wi-Fi
- [ ] **Tu:** Safari → Distribuie → Adaugă pe ecranul principal
- [ ] Verificarea finală pe telefonul tău, pe toate criteriile din SPEC, secțiunea 10

---

## Riscuri

| Risc | Ce facem |
|---|---|
| Fără internet nu se vede istoricul | Așa ai cerut, ca să nu se ocupe memoria. Intrările noi apar totuși imediat pe ecran, din coadă. |
| Safari poate șterge memoria unui site nefolosit câteva săptămâni, inclusiv coada netrimisă | Aplicația instalată pe ecranul principal e protejată. Coada trimite oricum în câteva secunde de la revenirea semnalului. |
| Proiectul Supabase gratuit se suspendă după 7 zile fără nicio folosire | Îl folosești zilnic. Dacă totuși se suspendă, îl repornești cu un click. |
| 3 zile e strâns | La orice oprire, ce e gata funcționează. Calendarul poate trece în ziua 4 fără să strice nimic. |

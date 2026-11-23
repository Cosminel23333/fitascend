// Regenerates src/data/exercises.json from free-exercise-db (Unlicense, public domain).
// Run: node scripts/build-exercises.mjs
import { writeFileSync } from 'node:fs'

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

// gym nicknames (EN + RO) the original names don't contain
const aliases = {
  Butterfly: ['pec deck', 'pec fly', 'fluture'],
  'Barbell Bench Press - Medium Grip': ['bench press', 'impins la piept', 'impins orizontal'],
  'Barbell Incline Bench Press - Medium Grip': ['incline bench', 'impins inclinat'],
  'Barbell Squat': ['squat', 'genuflexiuni'],
  'Barbell Deadlift': ['deadlift', 'indreptari'],
  'Wide-Grip Lat Pulldown': ['lat pulldown', 'helcometru', 'tractiuni la helcometru'],
  'Leg Press': ['presa', 'presa picioare'],
  'Pullups': ['tractiuni', 'pull up'],
  'Pushups': ['flotari', 'push up'],
  'Dips - Triceps Version': ['dips', 'flotari la paralele'],
  'Seated Cable Rows': ['ramat la cablu', 'seated row'],
  'Bent Over Barbell Row': ['ramat cu bara', 'barbell row'],
  'Standing Military Press': ['military press', 'presa militara', 'impins deasupra capului'],
  'Leg Extensions': ['extensii picioare', 'leg extension'],
  'Lying Leg Curls': ['flexii picioare', 'leg curl'],
  'Standing Calf Raises': ['ridicari pe varfuri', 'gambe'],
  'Barbell Hip Thrust': ['impins din sold'],
}

const all = await (await fetch(SRC)).json()
const missing = Object.keys(aliases).filter(n => !all.some(e => e.name === n))
if (missing.length) console.warn('aliases for unknown names:', missing)

const slim = all.map(e => ({
  id: e.id,
  n: e.name,
  m: e.primaryMuscles,
  s: e.secondaryMuscles,
  q: e.equipment ?? null,
  c: e.category,
  i: e.images?.length ?? 0,
  ...(aliases[e.name] ? { a: aliases[e.name] } : {}),
}))

writeFileSync(new URL('../src/data/exercises.json', import.meta.url), JSON.stringify(slim))
console.log(`wrote ${slim.length} exercises`)

// Packaged food: barcode lookup in the app's own shared list, then the free open databases.
import { pending } from './outbox'
import { save, supabase } from './sync'
import { uuid } from './uuid'

export type Per100 = { kcal: number; protein: number | null; carbs: number | null; fat: number | null }
export type Food = { name: string; brand: string | null; per100: Per100; serving: number | null; source: string }
type FoodRow = { id: string; barcode: string; name: string; kcal: number; protein: number | null; carbs: number | null; fat: number | null; serving_g: number | null; created_at: string }

const num = (v: unknown) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10)
const fromRow = (r: FoodRow): Food => ({ name: r.name, brand: null, per100: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat }, serving: r.serving_g, source: 'FitAscend' })

// products FitAscend users typed in themselves (newest wins), including one just added and not yet sent
async function own(code: string): Promise<Food | null> {
  const waiting = pending().filter(o => o.op === 'upsert' && o.table === 'foods' && o.row.barcode === code).pop()
  if (waiting && waiting.op === 'upsert') return fromRow(waiting.row as FoodRow)
  const { data } = await supabase.from('foods').select('*').eq('barcode', code).order('created_at', { ascending: false }).limit(1)
  return data?.[0] ? fromRow(data[0] as FoodRow) : null
}

export function saveFood(uid: string, barcode: string, name: string, p: Per100, serving: number | null) {
  const row: FoodRow = { id: uuid(), barcode, name, ...p, serving_g: serving, created_at: new Date().toISOString() }
  save({ op: 'upsert', table: 'foods', row, userId: uid })
  return fromRow(row)
}

// Open Food Facts: worldwide, community-made, strong on European (and Romanian) products
async function openFoodFacts(code: string): Promise<Food | null> {
  const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ro,product_name_en,brands,nutriments,serving_quantity`)
  if (!r.ok) return null
  const j = await r.json()
  const p = j.product
  const n = p?.nutriments
  if (j.status !== 1 || !n) return null
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) !== null ? Math.round(num(n['energy_100g'])! / 4.184) : null)
  if (kcal === null) return null
  return {
    name: p.product_name_ro || p.product_name || p.product_name_en || code,
    brand: p.brands?.split(',')[0]?.trim() || null,
    per100: { kcal, protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), fat: num(n.fat_100g) },
    serving: num(p.serving_quantity),
    source: 'Open Food Facts',
  }
}

// USDA FoodData Central: branded foods, mostly North American; nutrients are per 100 g
// shortcut: DEMO_KEY allows ~30 lookups an hour per phone; get a free key at api.data.gov if that is ever hit
async function usda(code: string): Promise<Food | null> {
  const strip = (s: string) => s.replace(/^0+/, '')
  let f
  // codes are stored as 14-digit GTINs ("00016000275287"); the camera reads 12 or 13 digits
  for (const q of new Set([code, code.padStart(14, '0')])) {
    const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&dataType=Branded&pageSize=5&query=${q}`)
    if (!r.ok) return null
    f = ((await r.json()).foods ?? []).find((x: { gtinUpc?: string }) => x.gtinUpc && strip(x.gtinUpc) === strip(code))
    if (f) break
  }
  if (!f) return null
  const get = (id: number) => num(f.foodNutrients?.find((x: { nutrientId: number }) => x.nutrientId === id)?.value)
  const kcal = get(1008)
  if (kcal === null) return null
  return {
    name: f.description, brand: f.brandName || f.brandOwner || null,
    per100: { kcal, protein: get(1003), carbs: get(1005), fat: get(1004) },
    serving: f.servingSizeUnit?.toLowerCase() === 'g' ? num(f.servingSize) : null,
    source: 'USDA',
  }
}

export async function lookupBarcode(code: string): Promise<Food | null> {
  for (const source of [own, openFoodFacts, usda]) {
    try {
      const food = await source(code)
      if (food) return food
    } catch { /* this database is unreachable: try the next one */ }
  }
  return null
}

// values for the grams actually eaten
export function forGrams(p: Per100, grams: number) {
  const k = (v: number | null) => (v === null ? null : Math.round((v * grams) / 10) / 10)
  return { kcal: Math.round((p.kcal * grams) / 100), protein: k(p.protein), carbs: k(p.carbs), fat: k(p.fat) }
}

// Packaged food: barcode lookup in the free open databases and reading a nutrition label photo.
export type Per100 = { kcal: number; protein: number | null; carbs: number | null; fat: number | null }
export type Food = { name: string; brand: string | null; per100: Per100; serving: number | null; source: string }

const num = (v: unknown) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10)

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
  for (const source of [openFoodFacts, usda]) {
    try {
      const food = await source(code)
      if (food) return food
    } catch { /* this database is unreachable: try the next one */ }
  }
  return null
}

// first number on the label line for a nutrient: labels list "per 100 g" before "per portion"
const firstNumber = (line: string) => {
  const m = line.replace(/(\d)\s*[,.]\s*(\d)/g, '$1.$2').match(/(\d+(?:\.\d+)?)\s*g\b/i) ?? line.match(/(\d+(?:[.,]\d+)?)/)
  return m ? Number(m[1].replace(',', '.')) : null
}

// Romanian or English nutrition table text (from OCR) -> values per 100 g
export function parseLabel(text: string): Per100 | null {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)
  const flat = text.replace(/\s+/g, ' ')
  const kcalMatch = flat.match(/(\d+(?:[.,]\d+)?)\s*kcal/i)
  const kjMatch = flat.match(/(\d+(?:[.,]\d+)?)\s*kj/i)
  const pick = (yes: RegExp, no: RegExp) => {
    const line = lines.find(l => yes.test(l) && !no.test(l))
    return line ? firstNumber(line.replace(yes, ' ')) : null
  }
  const fat = pick(/gr[aă]sim[ie]|lipide|\bfat\b|fett/i, /satura|din care|of which|acizi/i)
  const carbs = pick(/glucide|carbohidra[tț]i|carbohydrate|hidra[tț]i de carbon|kohlenhydrate/i, /zah[aă]r|sugar|din care|of which/i)
  const protein = pick(/prote[i1]n/i, /^$/)
  let kcal = kcalMatch ? Number(kcalMatch[1].replace(',', '.')) : kjMatch ? Math.round(Number(kjMatch[1].replace(',', '.')) / 4.184) : null
  const energy = (f: number | null, c: number | null, p: number | null) => 9 * (f ?? 0) + 4 * (c ?? 0) + 4 * (p ?? 0)
  // no energy line read: work it out from the macros
  if (kcal === null && (fat ?? carbs ?? protein) !== null) kcal = Math.round(energy(fat, carbs, protein))
  if (kcal === null || kcal > 950) return null
  // OCR often drops the decimal comma ("12,5" -> "125"): keep whichever reading agrees with the label's energy
  let best = { fat, carbs, protein }
  for (let mask = 1; mask < 8; mask++) {
    const fix = (v: number | null, bit: number) => (v !== null && mask & bit ? v / 10 : v)
    const t = { fat: fix(fat, 1), carbs: fix(carbs, 2), protein: fix(protein, 4) }
    if (Math.abs(energy(t.fat, t.carbs, t.protein) - kcal) < Math.abs(energy(best.fat, best.carbs, best.protein) - kcal) - kcal * 0.05) best = t
  }
  return { kcal, ...best }
}

// values for the grams actually eaten
export function forGrams(p: Per100, grams: number) {
  const k = (v: number | null) => (v === null ? null : Math.round((v * grams) / 10) / 10)
  return { kcal: Math.round((p.kcal * grams) / 100), protein: k(p.protein), carbs: k(p.carbs), fat: k(p.fat) }
}

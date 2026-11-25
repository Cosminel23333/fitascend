import list from '../data/videos.json'
import { norm } from './exercises'

// the user's own Higgsfield clips (hologram figure, worked muscles in red), one per exercise:
// matched by library id, else by name so a custom exercise called "Burpee" finds its clip
// shortcut: files are hotlinked from Higgsfield's CDN; copy them to Supabase Storage if they ever disappear
type Video = { name: string; id: string | null; url: string }
const byId = new Map((list as Video[]).filter(v => v.id).map(v => [v.id!, v.url]))
const byName = new Map((list as Video[]).map(v => [norm(v.name), v.url]))

export const videoFor = (id: string, name: string) => byId.get(id) ?? byName.get(norm(name))

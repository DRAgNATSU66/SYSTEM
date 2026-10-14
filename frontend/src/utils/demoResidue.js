// Demo mode writes into the real persisted store keys; this wipes them on the first non-demo boot.
export const DEMO_MARKER_KEY = 'system-demo-seeded';
const isResidueKey = (k) => k === DEMO_MARKER_KEY || k === 'system-sync-queue' || k.startsWith('antigravity-');

export function markDemoSeeded(storage) { storage.setItem(DEMO_MARKER_KEY, '1'); }

// Returns true when residue was found and removed (caller should reload so in-memory stores rehydrate empty).
export function purgeDemoResidue(storage) {
  if (storage.getItem(DEMO_MARKER_KEY) == null) return false;
  const keys = [];
  for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
  keys.filter(isResidueKey).forEach((k) => storage.removeItem(k));
  return true;
}

/** Display version. Patch is two digits: 0.1.00 → 0.1.01 → … → 0.1.99 → 0.2.00 */
export const GAME_VERSION = "0.1.01";

export function bumpVersion(v: string = GAME_VERSION): string {
  const m = /^(\d+)\.(\d+)\.(\d{2})$/.exec(v.trim());
  if (!m) return v;
  let major = Number(m[1]);
  let minor = Number(m[2]);
  let patch = Number(m[3]) + 1;
  if (patch > 99) {
    patch = 0;
    minor += 1;
  }
  if (minor > 99) {
    minor = 0;
    major += 1;
  }
  return `${major}.${minor}.${String(patch).padStart(2, "0")}`;
}

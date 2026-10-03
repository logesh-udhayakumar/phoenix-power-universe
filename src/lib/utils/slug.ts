/** Turn a project name into a URL slug, so the owner never types one. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Append a short suffix when a slug is already taken. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const seed = base || 'project'
  if (!taken.has(seed)) return seed
  for (let n = 2; n < 500; n++) {
    const candidate = `${seed}-${n}`
    if (!taken.has(candidate)) return candidate
  }
  return `${seed}-${Date.now().toString(36)}`
}

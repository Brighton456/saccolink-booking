/**
 * Station alias mapping — maps common/colloquial names to the canonical
 * station name stored in the database.  The matcher lowercases everything
 * before comparing, so casing never matters.
 */

const ALIASES: Record<string, string> = {
  /* Kitale area */
  "kitale":            "Kitale",
  "kitale club":       "Kitale",
  "kitale stage":      "Kitale",
  "kitale town":       "Kitale",
  "kitale park":       "Kitale",
  "ktl":               "Kitale",

  /* Eldoret area */
  "eldoret":           "Eldoret",
  "eldoret stage":     "Eldoret",
  "eldoret town":      "Eldoret",
  "eldoret junction":  "Eldoret",
  "eld":               "Eldoret",

  /* Nakuru area */
  "nakuru":            "Nakuru",
  "nakuru stage":      "Nakuru",
  "nakuru town":       "Nakuru",
  "nakuru bus park":   "Nakuru",
  "nakuru CBD":        "Nakuru",
  "nrb":               "Nairobi",

  /* Nairobi area */
  "nairobi":           "Nairobi",
  "nairobi stage":     "Nairobi",
  "nairobi town":      "Nairobi",
  "nairobi CBD":       "Nairobi",
  "nairobi bus park":  "Nairobi",
  "city":              "Nairobi",
  "town":              "Nairobi",
  "nbi":               "Nairobi",

  /* Kisumu area */
  "kisumu":            "Kisumu",
  "kisumu stage":      "Kisumu",
  "kisumu town":       "Kisumu",
  "kisumu CBD":        "Kisumu",

  /* Thika area */
  "thika":             "Thika",
  "thika stage":       "Thika",
  "thika town":        "Thika",
  "thika road":        "Thika",

  /* Naivasha */
  "naivasha":          "Naivasha",
  "naivasha stage":    "Naivasha",

  /* Nairobi–Kisumu corridor stops */
  "nyahururu":         "Nyahururu",
  "nyahururu stage":   "Nyahururu",
  "engineer":          "Engineer",
  "engineer stage":    "Engineer",
  "flyover":           "Engineer",
};

/**
 * Given user input, return the best-matching canonical station name.
 * Returns the original input if nothing matches.
 *
 * Strategy (in priority order):
 *   1. Exact match (case-insensitive) on alias key → return canonical name
 *   2. Prefix match — input starts with an alias key
 *   3. Substring match — alias key appears inside input, or input appears inside alias key
 *   4. Fuzzy: strip common suffixes ("stage", "town", "park", "CBD") and retry
 */
export function resolveStationAlias(input: string, knownStations: string[]): string {
  const raw = input.trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();

  // 1. Exact alias match
  const exact = ALIASES[lower];
  if (exact) return exact;

  // 2. Exact station name match (case-insensitive)
  const stationMatch = knownStations.find((s) => s.toLowerCase() === lower);
  if (stationMatch) return stationMatch;

  // 3. Prefix match on alias
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (lower.startsWith(alias) || alias.startsWith(lower)) {
      return canonical;
    }
  }

  // 4. Substring match
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) {
      return canonical;
    }
  }

  // 5. Station substring match
  for (const s of knownStations) {
    if (s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())) {
      return s;
    }
  }

  // 6. No match — return as-is (search logic handles partial matching)
  return raw;
}

/**
 * Build enriched suggestions list that includes both canonical names AND alias labels.
 * Useful for the autocomplete dropdown.
 */
export function buildSearchSuggestions(stations: string[], routes: string[]): string[] {
  const all = new Set<string>();

  // Add canonical station names
  for (const s of stations) all.add(s);

  // Add route labels (e.g. "Nairobi → Nakuru")
  for (const r of routes) all.add(r);

  // Add popular alias labels that map to existing stations
  const stationSet = new Set(stations.map((s) => s.toLowerCase()));
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (stationSet.has(canonical.toLowerCase())) {
      // Only add the alias if it's different from the canonical name
      if (alias.toLowerCase() !== canonical.toLowerCase()) {
        all.add(`${alias} → ${canonical}`);
      }
    }
  }

  return Array.from(all).sort();
}

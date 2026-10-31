/**
 * Shared place-name resolution for constituency boundaries.
 *
 * Two datasets meet here: the election dataset that fills the login and report
 * forms (`data/constituencies.json`, 2024 names) and the boundary index built
 * from the 2019 DataMeet shapefile. They disagree on spelling, on the 2023
 * Assam renames, and on how the merged Dadra/Daman UT is named. A mismatch is
 * silent: the map falls back to the all-India file and, for a duplicated name,
 * draws nothing at all. Keep the aliases here so the map and the seat audit use
 * exactly the same rules.
 */

export const normalizePlace = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

// The boundary file predates several state renames and still splits the two
// western UTs that the election dataset merges.
const STATE_ALIASES = {
  orissa: 'odisha',
  andamanandnicobar: 'andamanandnicobarislands',
  dadraandnagarhaveli: 'dadraandnagarhavelianddamananddiu',
  dadranagarhaveli: 'dadraandnagarhavelianddamananddiu',
  damananddiu: 'dadraandnagarhavelianddamananddiu',
  pondicherry: 'puducherry',
}

export const normalizeState = (value) => {
  const key = normalizePlace(value)
  return STATE_ALIASES[key] || key
}

/**
 * Seat names that differ between the 2024 election dataset and the 2019
 * boundary index. Keyed by "<normalized state>|<normalized seat>" so a
 * same-named seat in another state can never pick up the alias.
 *
 * The six Assam entries are the 2023 delimitation renames (Mangaldoi became
 * Darrang-Udalguri, Kaliabor became Kaziranga, and so on); the rest are
 * spelling differences in the source files.
 */
const SEAT_ALIASES = {
  'andhrapradesh|narsaraopet': 'narasaraopet',
  'andhrapradesh|thirupathisc': 'tirupatisc',
  'assam|darrangudalguri': 'mangaldoi',
  'assam|diphust': 'autonomousdistrictst',
  'assam|guwahati': 'gauhati',
  'assam|kaziranga': 'kaliabor',
  'assam|nagaon': 'nowgong',
  'assam|sonitpur': 'tezpur',
  'dadraandnagarhavelianddamananddiu|dadarnagarhavelist': 'dadranagarhaveli',
  'dadraandnagarhavelianddamananddiu|dadraandnagarhavelist': 'dadranagarhaveli',
  'maharashtra|hatkanangale': 'hatkanangle',
  'puducherry|puducherry': 'pondicherry',
  'uttarakhand|haridwar': 'hardwar',
}

/** The boundary-index spelling of a seat, normalized. */
export function canonicalSeatName(constituency, state) {
  const key = `${normalizeState(state)}|${normalizePlace(constituency)}`
  return SEAT_ALIASES[key] || normalizePlace(constituency)
}

/**
 * Pick the one feature that belongs to this constituency.
 *
 * The all-India fallback has 543 features, so handing the whole collection to
 * fitBounds zoomed the map out to the entire country. A per-constituency file
 * has a single feature and is returned as-is. When a name matches more than one
 * seat (Hamirpur exists in two states, and the source file lists two different
 * Mumbai seats under the same name) the state is used to break the tie. If it
 * still cannot be resolved, nothing is drawn: a wrong outline is worse than no
 * outline.
 */
export function selectBoundaryFeature(geojson, constituency, state) {
  const features = geojson?.features || []
  if (features.length === 0) return null
  if (features.length === 1) return features[0]

  const wanted = canonicalSeatName(constituency, state)
  if (!wanted) return null

  const exact = features.filter((f) => normalizePlace(f.properties?.pc_name) === wanted)
  let candidates = exact
  if (candidates.length === 0) {
    candidates = features.filter((f) => {
      const name = normalizePlace(f.properties?.pc_name)
      return name && (name.includes(wanted) || wanted.includes(name))
    })
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const wantedState = normalizeState(state)
  if (wantedState) {
    const inState = candidates.filter((f) => normalizeState(f.properties?.st_name) === wantedState)
    if (inState.length === 1) return inState[0]
  }
  return null
}

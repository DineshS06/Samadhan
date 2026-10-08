# Unpublished drafts

These files are deliberately **not** in `src/pages/` so they cannot be routed or
built by accident. Move one back into `src/pages/` and add a `<Route>` only
after resolving the issues below.

## Why each is parked

### `ConstituencyDirectory.jsx.draft` / `ConstituencyDetail.jsx.draft`
Hard-coded data for eight real parliamentary constituencies, including
sitting MPs' names, population figures, and a `deployment: 'Active'` status.

Problems:
- MP names and population figures are not sourced or dated, and sitting MPs
  change between elections.
- `'Active'` asserts a real-world deployment for constituencies where no such
  deployment has been confirmed. Publishing this on a civic site would be a
  false claim about government offices.
- There is no Contentful-style content pipeline behind the slugs, so
  `/constituency/:slug` would render whatever is hard-coded in the file.

Before publishing: replace the hard-coded array with a versioned, dated data
source; verify every constituency against official records; and remove the
deployment status unless it is genuinely true and maintained.

Related: the repository does contain real GeoJSON boundaries at
`shared/geo/` (`india_pc_2019_simplified.geojson`, `india_states.geojson`, and
`india_admin.json`, built by `scripts/build_india_geo.py`), so a future
constituency page could source boundaries from there instead of hard-coding.

### `Contact.jsx.draft`
Contains placeholder contact data:
- Five `@samadhan.example` addresses, which are not deliverable.
- A placeholder phone number, `+91 XXXXXXXXXX`.
- A Google Maps embed whose coordinates and place ID are fabricated.
- A form posting to `https://formspree.io/f/your-form-id`, which is a
  placeholder endpoint that does not exist.

Also imports `{ trackCTAClick }` from `../components/GA4` — a named export that
has now been implemented, but this file predates it.

Before publishing: substitute real contact details, a real map, and a working
form endpoint, or remove the sections that cannot be completed. Do not publish
placeholder contact information.
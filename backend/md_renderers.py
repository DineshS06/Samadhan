"""Markdown renderer registry for AI-readable site support.

Maps each public route to a renderer function that returns a markdown
document containing: title, one-sentence summary, canonical URL, last
updated, main content in reading order, and Related links (absolute
HTML URLs). Nav, footer, banners, and repeated CTAs are omitted.

All content mirrors visible on-page copy; nothing is scraped from
rendered HTML.
"""

from datetime import date

SITE_URL = "https://samadhan-chi.vercel.app"
LAST_UPDATED = "2026-10-29"


def _header(title: str, summary: str, path: str) -> str:
    canonical = SITE_URL + (path if path.startswith("/") else "/" + path)
    return (
        f"# {title}\n\n"
        f"> {summary}\n\n"
        f"**Canonical URL:** {canonical}\n"
        f"**Last Updated:** {LAST_UPDATED}\n\n"
    )


def _related(links: list[tuple[str, str]]) -> str:
    lines = ["## Related\n"]
    for label, url in links:
        lines.append(f"- [{label}]({SITE_URL}{url})")
    return "\n".join(lines) + "\n"


# ── Public route renderers ──────────────────────────────────────────

def render_home() -> str:
    return (
        _header(
            "Report Constituency Issues to Your MP",
            "Turn multilingual citizen grievances into ranked constituency projects using a published, evidence-backed scoring model you can check.",
            "/",
        )
        + """Samadhan is an AI-assisted constituency development planning platform. Citizens report local issues in any Indian language, and each report is scored using a transparent 40-40-20 model: 40% demand volume, 40% infrastructure deficit, and 20% severity. The score produces a review order for your Member of Parliament's office — not an automatic funding decision.

Your name and phone number stay private. Every report receives a reference ID you can use to track its status.

## What you can do here

- Report a public grievance in any Indian language
- Attach location and evidence (photos, documents)
- Receive a reference ID to track your report
- Review ranked project recommendations for your constituency
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("How AI Ranks Citizen Requests Into Projects", "/how-it-works"),
            ("Constituency Project Scoring Methodology", "/methodology"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_report_issue() -> str:
    return (
        _header(
            "Report a Public Grievance to Your MP",
            "Report a public grievance through our grievance redressal form in any Indian language, with location and evidence. You receive a reference ID; your name and phone number stay private.",
            "/report-issue",
        )
        + """Use this form to report a constituency issue to your Member of Parliament. You can submit in any Indian language. Attach a location and any evidence you have (photos, documents, reference numbers).

## What you need to provide

- Full name (used for verification, kept private)
- Mobile number (for follow-up, kept private)
- State and district
- Parliamentary constituency
- Language of your submission
- Grievance category
- Description of the issue
- Village/town or GPS location

## What happens next

Your submission is scored using the published 40-40-20 model. You receive a reference ID (SAM-####) to track your report. Your name and phone number are stored separately from the public record and are never shown on the public grievance log.
"""
        + _related([
            ("How to Report a Constituency Issue to Your MP", "/how-to-report"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
            ("Privacy for Citizen Grievance Data", "/privacy"),
        ])
    )


def render_how_it_works() -> str:
    return (
        _header(
            "How AI Ranks Citizen Requests Into Projects",
            "A G2C e-governance workflow: multilingual intake, AI structuring, public-data enrichment, explainable 40-40-20 scoring, human review, and sanction drafts.",
            "/how-it-works",
        )
        + """Samadhan turns citizen input into ranked project recommendations through a six-step workflow:

1. **Ingest** — Capture text, voice transcripts, images, letters, meetings, and social posts.
2. **Understand** — Extract language, category, location, urgency, affected group, and summary.
3. **Enrich** — Match the location and category to selected public or curated indicators.
4. **Score** — Combine demand, deficit, and severity into an explainable score (40-40-20 model).
5. **Review** — Display hotspots and ranked recommendations in the MP portal.
6. **Act** — Verify evidence and prepare a draft administrative brief.

Every step is explainable and auditable. Officials retain responsibility for verification, eligibility, funding, and sanctions.
"""
        + _related([
            ("Constituency Project Scoring Methodology", "/methodology"),
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_methodology() -> str:
    return (
        _header(
            "Constituency Project Scoring Methodology",
            "How Samadhan scores verified demand (40%), infrastructure deficit (40%), and severity (20%) into an explainable, auditable project review order.",
            "/methodology",
        )
        + """## Scoring Formula

Score = 0.4 × Demand Volume + 0.4 × Infrastructure Deficit + 0.2 × Severity

### Demand Volume (40%)

Verified unique localised inputs, deduplicated across channels, with time-decay weighting. More citizens reporting the same issue in your constituency increases demand weight.

### Infrastructure Deficit (40%)

Gap evidence drawn from named, relevant public datasets (Census 2011, NFHS-5, UDISE+, PMGSY, National Health Mission) rather than unstated assumptions.

### Severity (20%)

Urgency based on safety, loss of access, exposure, and vulnerable populations. Self-reported urgency by the citizen (1–5).

## Safeguards

- Duplicate control across channels and time
- Location confidence thresholds
- Data provenance tracking
- Human override at every stage
- Bias review protocols
- Freshness checks on evidence

The score produces a **review order, not a funding decision**. Officials apply current rules, engineering checks, and approvals.
"""
        + _related([
            ("How AI Ranks Citizen Requests Into Projects", "/how-it-works"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
            ("MPLADS Fund — Constituency Development Fund for MPs", "/mplads"),
        ])
    )


def render_faq() -> str:
    return (
        _header(
            "Citizen Grievance and Constituency Planning FAQs",
            "Clear answers on reporting a constituency issue, how priority scores work, privacy of contact details, data sources, and limits of AI-assisted planning.",
            "/faq",
        )
        + """## Frequently Asked Questions

### What is Samadhan?

An AI-assisted constituency planning tool that turns citizen requests into evidence-backed project recommendations.

### How does prioritization work?

Samadhan compares verified demand, relevant infrastructure-gap evidence, and urgency, then shows the reasoning for human review.

### Does it make decisions automatically?

No. Officials retain responsibility for verification, eligibility, funding, and sanctions.

### Is it an emergency service?

No. Contact the appropriate emergency service for urgent help.

### Why has my scheme payment not been credited?

Published reporting identifies recurring causes: incomplete e-KYC, Aadhaar not linked to bank account, name mismatch between Aadhaar and bank record, land bought after 1 February 2019, or multiple claimants in the same family.

### How is an issue prioritised over another?

By the published 40-40-20 score, not by who asked loudest. Demand and infrastructure deficit each carry 40 percent, severity carries 20.

### Who can see what I report?

The substance of a report is public so it can be counted. Your name, phone number, and contact details are stored separately and are not shown on the public record.
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("About Samadhan", "/about"),
            ("Privacy for Citizen Grievance Data", "/privacy"),
        ])
    )


def render_about() -> str:
    return (
        _header(
            "About Samadhan: Civic-Tech for Constituency Planning",
            "Why Samadhan connects citizen demand with infrastructure evidence through e-governance: the purpose, audience, scope, and explicit limits of the platform.",
            "/about",
        )
        + """## What Samadhan Is

Samadhan is an AI-assisted constituency development planning tool. It turns multilingual citizen requests into ranked, evidence-backed project recommendations that a Member of Parliament's office or a district administration reviews and acts on.

## Who It Is For

- Members of Parliament and constituency offices
- District and state planning officials
- Civic technology organisations and NGOs
- Citizens submitting a constituency issue

## What It Is Not

- Not a government website
- Not an emergency service
- Not an automatic funding decision system

## Limitations

Illustrative counts and sample datasets are placeholders only. They are not observed results or official government data. AI parsing can misread language, location, or intent; low-confidence results require human review.
"""
        + _related([
            ("Privacy for Citizen Grievance Data", "/privacy"),
            ("Accessibility of the Citizen Grievance Portal", "/accessibility"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_privacy() -> str:
    return (
        _header(
            "Privacy for Citizen Grievance Data",
            "What data Samadhan collects when you report a constituency issue, how it is used, who can access it, and how your contact details are protected.",
            "/privacy",
        )
        + """## What Data Is Collected

When you report a constituency issue, we collect:

- Full name (for verification)
- Mobile number (for follow-up)
- State, district, and constituency
- Language preference
- Grievance category
- Issue description
- Village/town or GPS location
- Optional attachments (photos, documents)

## How It Is Used

The substance of your report is public so it can be counted and scored. Your name, phone number, and contact details are stored separately in a private contacts file and are never shown on the public grievance log.

## Who Can Access It

- The public record shows only the redacted report (category, location, summary, score, reference ID)
- Your private contact details are accessible only to authorized MP office staff
- Citizen PII is stripped from API responses

## Your Rights

You receive a reference ID to track your report. You can check status using the public tracking endpoint.
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("About Samadhan", "/about"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_accessibility() -> str:
    return (
        _header(
            "Accessibility of the Citizen Grievance Portal",
            "Samadhan accessibility commitments for reporting a constituency issue: semantic design, keyboard access, multilingual input, and known limitations.",
            "/accessibility",
        )
        + """## Accessibility Commitments

Samadhan is designed to be accessible to all citizens:

- **Semantic HTML** — Proper heading hierarchy (H1-H6), landmarks, and ARIA labels
- **Keyboard access** — All interactive elements are keyboard-navigable
- **Multilingual input** — The citizen portal accepts Hindi, Telugu, and English input
- **Responsive design** — Works on phones, tablets, and desktops
- **High contrast** — Meets accessibility contrast requirements

## Known Limitations

- The website itself is published in English only (no Hindi or Telugu pages)
- AI parsing can misread language, location, or intent
- JavaScript is required to submit or track a grievance

## Feedback

If you encounter accessibility barriers, report them through the citizen portal or contact your MP office.
"""
        + _related([
            ("About Samadhan", "/about"),
            ("Privacy for Citizen Grievance Data", "/privacy"),
            ("How to Report a Constituency Issue to Your MP", "/how-to-report"),
        ])
    )


def render_how_to_report() -> str:
    return (
        _header(
            "How to Report a Constituency Issue to Your MP",
            "Step-by-step guide to filing a public grievance with your Member of Parliament. Grievance redressal through DARPG CPGRAMS, MPLADS constituency funds, and Samadhan scoring.",
            "/how-to-report",
        )
        + """## Step-by-Step Guide

### Step 1: Gather Information

Collect details about the issue: what happened, where, when, who is affected, and any evidence (photos, documents, reference numbers).

### Step 2: Choose Your Language

You can report in any Indian language. The parser handles Hindi, Telugu, and English input.

### Step 3: Submit the Form

Go to the Report a Constituency Issue page and fill in:
- Your name and mobile number (kept private)
- State, district, and parliamentary constituency
- Grievance category and description
- Location (village/town or GPS)
- Optional evidence attachments

### Step 4: Receive Your Reference ID

You receive a reference ID (SAM-####) to track your report. Use it on the public tracking endpoint to check status.

### Step 5: Review and Follow Up

Your report is scored using the 40-40-20 model. MP office staff review ranked recommendations and prepare administrative briefs.
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("MPLADS Fund — Constituency Development Fund for MPs", "/mplads"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_mplads() -> str:
    return (
        _header(
            "MPLADS Fund — Constituency Development Fund for MPs",
            "MPLADS (Members of Parliament Local Area Development Scheme) is India's constituency development fund. How it works, eligible works, and how citizens can suggest projects to their MP.",
            "/mplads",
        )
        + """## What Is MPLADS?

MPLADS (Members of Parliament Local Area Development Scheme) is India's constituency development fund. Each MP receives an annual allocation to recommend development works in their constituency.

## Eligible Works

Works must meet local development needs and fall within MPLADS guidelines. Examples include:

- Drinking water facilities
- Education infrastructure
- Health facilities
- Irrigation and sanitation
- Roads and pathways
- Electricity and non-conventional energy

## How Citizens Can Suggest Projects

Citizens can suggest projects through their MP's office using the Samadhan grievance reporting form. Suggested projects are scored and ranked using the 40-40-20 model, giving officials an evidence-based review order.

## Important Notes

Samadhan does not determine MPLADS eligibility. Officials apply current rules, engineering checks, and approvals.
"""
        + _related([
            ("How to Report a Constituency Issue to Your MP", "/how-to-report"),
            ("Constituency in India — Lok Sabha Seats and Your MP", "/constituency"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_constituency() -> str:
    return (
        _header(
            "Constituency in India — Lok Sabha Seats and Your MP",
            "What a constituency means in India, how Lok Sabha seats work, and how to find your Member of Parliament. Electoral district, MPLADS, and citizen grievance redressal.",
            "/constituency",
        )
        + """## What Is a Constituency?

A constituency is an electoral district that elects one Member of Parliament to the Lok Sabha (India's lower house of Parliament). There are 543 Lok Sabha constituencies across India.

## Your MP

Each constituency is represented by an elected Member of Parliament. MP office staff use Samadhan's dashboard to view ranked grievance recommendations for their constituency.

## MPLADS and Your Constituency

Each MP receives an annual MPLADS allocation to recommend development works in their constituency. Citizens can suggest projects through the grievance reporting form.

## Finding Your Constituency

Use the Samadhan constituency lookup to find your Lok Sabha seat and MP based on your state and constituency name.
"""
        + _related([
            ("MPLADS Fund — Constituency Development Fund for MPs", "/mplads"),
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


# ── Research page renderers ─────────────────────────────────────────


def render_research() -> str:
    return (
        _header(
            "Samadhan Research — Statistics Pages for AI Answers",
            "Original statistics pages for Lok Sabha constituencies, Indian districts, district-to-constituency mapping, citizen FAQs, and search intents. Every number computed from committed data.",
            "/research",
        )
        + """## Research Reports

Each page publishes original statistics computed from data Samadhan already owns. Every number comes from a single tested calculation module — no number is typed in by hand twice.

| Report | What it covers |
|--------|---------------|
| [Lok Sabha Constituency Statistics](/research/constituencies) | 543 Lok Sabha constituencies across 36 states and UTs, ranked by seat count with reserved-seat breakdown. |
| [Indian Districts Statistics](/research/districts) | 789 districts across 36 states and UTs, ranked by district count. |
| [District-to-Constituency Mapping](/research/district-mapping) | 299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). |
| [Citizen FAQ Statistics](/research/faqs) | 11 frequently asked questions about citizen grievances, privacy, MPLADS, and AI limitations. |
| [Search Intent Statistics](/research/search-intents) | 13 public pages with mapped search intent — 12 informational, 1 transactional. |

## How to Cite

Each research page includes a suggested citation with the page URL and month. Use the "Link to this finding" anchors on each page to cite a specific statistic directly.

## AI-Fetch Friendly

Markdown versions: every page has a `.md` variant and an `/api/md/<path>` endpoint.
"""
        + _related([
            ("Lok Sabha Constituency Statistics", "/research/constituencies"),
            ("Indian Districts Statistics", "/research/districts"),
            ("District-to-Constituency Mapping", "/research/district-mapping"),
        ])
    )


def render_research_constituencies() -> str:
    return (
        _header(
            "Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs",
            "543 Lok Sabha constituencies across 36 states and union territories. Uttar Pradesh leads with 80 seats (~14.7%). Ranked list, reserved-seat breakdown, and per-state entity facts.",
            "/research/constituencies",
        )
        + """## Key Findings

- **Total seats:** 543 Lok Sabha constituencies across 36 states and union territories.
- **State with the most seats:** Uttar Pradesh leads with 80 seats (~14.7% of all seats).
- **Reserved (SC/ST) seats:** A subset of seats are reserved for Scheduled Castes and Scheduled Tribes.
- **Single-seat states and UTs:** Several states and union territories have only one Lok Sabha seat each.

## 36 States and UTs Ranked by Lok Sabha Seats (2026)

States and union territories are ranked by Lok Sabha seat count in 2026. Uttar Pradesh leads with 80 seats, followed by Maharashtra and West Bengal. The median state holds roughly half the seats of the top state.

## State and Union Territory Facts

Per-state at-a-glance facts including seat count, reserved-seat status, and the list of constituencies in each state.

## Frequently Asked Questions

- How many Lok Sabha constituencies are there in India? — 543 across 36 states and UTs.
- Which state has the most Lok Sabha seats? — Uttar Pradesh with 80 seats (~14.7%).
- How many seats are reserved for SC/ST? — A reserved-seat breakdown is shown per state.
- Is this official government data? — No. This is a civic-tech project built from the published 2024 Lok Sabha seat catalog. Not a government website.

## Suggested Citation

Samadhan. Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs. https://samadhan-chi.vercel.app/research/constituencies. October 2026.
"""
        + _related([
            ("Indian Districts Statistics", "/research/districts"),
            ("District-to-Constituency Mapping", "/research/district-mapping"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_research_districts() -> str:
    return (
        _header(
            "Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs",
            "789 districts across 36 states and union territories. Uttar Pradesh leads with 75 districts (~9.5%). Ranked list and per-state district facts.",
            "/research/districts",
        )
        + """## Key Findings

- **Total districts:** 789 districts across 36 states and union territories.
- **State with the most districts:** Uttar Pradesh leads with 75 districts (~9.5% of all districts).
- **Single-district states and UTs:** Several states and union territories have only one district each.

## 36 States and UTs Ranked by District Count (2026)

States and union territories are ranked by district count in 2026. Uttar Pradesh leads with 75 districts, followed by Madhya Pradesh and Bihar.

## State and Union Territory Facts

Per-state at-a-glance district facts including district count and the list of district names in each state.

## Frequently Asked Questions

- How many districts are there in India? — 789 districts across 36 states and UTs.
- Which state has the most districts? — Uttar Pradesh with 75 districts (~9.5%).
- Is this official government data? — No. District lists are derived from Wikipedia and auto-generated by Samadhan's build scripts. Not a government website.

## Suggested Citation

Samadhan. Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs. https://samadhan-chi.vercel.app/research/districts. October 2026.
"""
        + _related([
            ("Lok Sabha Constituency Statistics", "/research/constituencies"),
            ("District-to-Constituency Mapping", "/research/district-mapping"),
            ("Report a Public Grievance to Your MP", "/report-issue"),
        ])
    )


def render_research_district_mapping() -> str:
    return (
        _header(
            "District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States",
            "299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). Ranked list and per-state mapping coverage.",
            "/research/district-mapping",
        )
        + """## Key Findings

- **Resolved district→seat mappings:** 299 districts have resolved Lok Sabha seat mappings across 15 states.
- **Coverage percentage:** 299 of 789 districts (~38%) have a resolved seat mapping.
- **Unresolved districts:** 490 districts (~62%) fall back to the full state seat list, because district and parliamentary constituency boundaries do not align in India.
- **States with curated mappings:** 15 states have curated district-to-seat mappings.

## 15 States Ranked by Resolved District→Seat Mappings (2026)

States are ranked by resolved district count in 2026. The mapping table shows which districts have been matched to specific Lok Sabha seats.

## State Mapping Coverage

Per-state at-a-glance mapping coverage showing resolved districts, total districts in the state, coverage percentage, and example seats.

## Frequently Asked Questions

- Why don't all districts have a resolved seat mapping? — Because district and parliamentary constituency boundaries do not line up in India. One district can span several seats and vice versa.
- How many districts have resolved mappings? — 299 of 789 districts (~38%).
- Is this official government data? — No. This is a civic-tech project. The mapping table is curated and resolved against the official 543-seat list, but it is not a government website or official channel.

## Suggested Citation

Samadhan. District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States. https://samadhan-chi.vercel.app/research/district-mapping. October 2026.
"""
        + _related([
            ("Lok Sabha Constituency Statistics", "/research/constituencies"),
            ("Indian Districts Statistics", "/research/districts"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_research_faqs() -> str:
    return (
        _header(
            "Citizen FAQ Statistics 2026: 11 Frequently Asked Questions",
            "11 published FAQs about citizen grievances, privacy, MPLADS eligibility, AI limitations, and more. Each answer linkable and quotable.",
            "/research/faqs",
        )
        + """## Key Findings

- **Total FAQs:** 11 published frequently asked questions.
- **FAQ topics covered:** Account requirements, report usefulness, phone privacy, MPLADS eligibility, AI misinterpretation, government status, data sources, low-reporting areas, official overrides, languages, and emergency services.
- **Privacy FAQs:** Address whether contact details are made public (answered: no).
- **MPLADS FAQs:** Address whether Samadhan decides MPLADS eligibility (answered: no).

## All 11 FAQs

Each question is an anchored entity block with its answer. Topics include privacy & data, MPLADS & eligibility, account & reporting, AI & limitations, status & scope, languages, reporting, official process, data & methodology, scoring, and other.

## Frequently Asked Questions (Quotable)

Each question includes its answer and topic category, linkable and quotable for citation.

## Suggested Citation

Samadhan. Citizen FAQ Statistics 2026: 11 Frequently Asked Questions. https://samadhan-chi.vercel.app/research/faqs. October 2026.
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("Privacy for Citizen Grievance Data", "/privacy"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


def render_research_search_intents() -> str:
    return (
        _header(
            "Search Intent Statistics 2026: 13 Public Pages Mapped",
            "13 public pages with mapped search intent. 12 informational (~92%), 1 transactional (~8%). Ranked list and per-page intent facts.",
            "/research/search-intents",
        )
        + """## Key Findings

- **Total pages with mapped intent:** 13 public pages have mapped search intent.
- **Intent type distribution:** 12 pages are informational (~92%), 1 page is transactional (~8%).
- **The only transactional page:** /report-issue is the only transactional page, targeting "report a constituency issue" — the wording a citizen would actually type.
- **Intent clusters:** Multiple clusters including oversight, reporting, scoring, and guides.

## 13 Pages by Search Intent Type (2026)

Public pages are listed by search intent type and cluster. Each entry includes its primary keyword and rationale.

## Per-Page Intent Facts

Per-page at-a-glance intent facts including intent type, cluster, primary keyword, and rationale.

## Frequently Asked Questions

- How many pages have mapped search intent? — 13 public pages.
- What is the most common search intent type? — Informational (12 of 13 pages, ~92%).
- What is the only transactional page? — /report-issue, targeting "report a constituency issue."

## Suggested Citation

Samadhan. Search Intent Statistics 2026: 13 Public Pages Mapped. https://samadhan-chi.vercel.app/research/search-intents. October 2026.
"""
        + _related([
            ("Report a Public Grievance to Your MP", "/report-issue"),
            ("Lok Sabha Constituency Statistics", "/research/constituencies"),
            ("Citizen Grievance and Constituency Planning FAQs", "/faq"),
        ])
    )


# ── Registry ────────────────────────────────────────────────────────

MD_RENDERERS: dict[str, callable] = {
    "": render_home,
    "report-issue": render_report_issue,
    "how-it-works": render_how_it_works,
    "methodology": render_methodology,
    "faq": render_faq,
    "about": render_about,
    "privacy": render_privacy,
    "accessibility": render_accessibility,
    "how-to-report": render_how_to_report,
    "mplads": render_mplads,
    "constituency": render_constituency,
    "research": render_research,
    "research/constituencies": render_research_constituencies,
    "research/districts": render_research_districts,
    "research/district-mapping": render_research_district_mapping,
    "research/faqs": render_research_faqs,
    "research/search-intents": render_research_search_intents,
}

# Routes explicitly skipped (noindex or private — no markdown renderer)
SKIPPED_ROUTES: dict[str, str] = {
    "mp": "Private executive dashboard — noindex",
    "mp/login": "MP staff login — noindex",
}

__all__ = ["MD_RENDERERS", "SKIPPED_ROUTES", "SITE_URL", "LAST_UPDATED"]

/**
 * FAQ content, kept separate from the page component.
 *
 * This lives in its own module so App.jsx can import the questions for the
 * FAQPage JSON-LD without pulling the page component (and its own imports)
 * into the entry chunk. FAQ.jsx re-exports FAQS for convenience, so the
 * schema and the visible copy still come from one source.
 *
 * Rule: answers here must match the visible FAQ text exactly. Schema markup
 * that contradicts on-page content is a manual-action risk.
 */

export const FAQS = [
  {
    q: 'Do I need an account to report a constituency issue?',
    a: 'No. In this build you can submit an issue without registering, and you receive a reference ID immediately. A production deployment would add proportionate verification, which could mean confirming a phone number, but it would not mean creating an account in order to report a problem.',
  },
  {
    q: 'What makes a report useful?',
    a: 'An exact location, the category of problem, roughly how many people are affected, how long it has been happening, whether it is a safety risk, and any photo or document you already have. Those six details are what a district office needs to act, and they are what raises a report above a general complaint.',
  },
  {
    q: 'Will my phone number be made public?',
    a: 'No. Contact details are collected for verification and follow-up by the office handling the report. They are stored separately from the grievance record and are stripped from any data used on a public dashboard. Aggregated statistics are used publicly; individual contact details are not.',
  },
  {
    q: 'Does Samadhan decide MPLADS eligibility?',
    a: 'No. Samadhan produces a priority score for review. Officials apply the current MPLADS guidelines, commission technical estimates, complete engineering checks, and issue sanctions. No output of this platform commits a rupee or approves a project.',
  },
  {
    q: 'Can the AI misunderstand a grievance?',
    a: 'Yes. Extracting language, location, and intent from free text is probabilistic, and a request written in a language or dialect the model handles poorly can be parsed incorrectly. Where confidence is low the fields are flagged rather than filled in, and a person confirms them. This is why human review is a stage in the process rather than an optional extra.',
  },
  {
    q: 'Is Samadhan a government website?',
    a: 'No. Samadhan is a civic-tech project. It is not a government website, not an official channel of any government body, and it has no authority to take any decision. It becomes an official system only if formally adopted and authorised by the relevant administration.',
  },
  {
    q: 'What happens to the data sources behind the score?',
    a: 'Each infrastructure indicator is recorded with its source, its release, and its publication date, and that provenance travels with the recommendation. If an indicator is outdated or replaced, the recommendation shows that, rather than silently relying on superseded data.',
  },
  {
    q: 'Why does a lightly reported area still get prioritised?',
    a: 'Because demand is only 40% of the score and infrastructure deficit is the other 40%. A location with little reporting but a large, evidence-backed deficit can outrank a heavily reported one that is well served. This is deliberate: places where nobody files complaints are exactly the places a demand-only ranking would miss.',
  },
  {
    q: 'Can an official disagree with the ranking?',
    a: 'Yes, and they should be able to. Officials can reject a recommendation, change its position, annotate the reasoning, or add a project the model did not surface. Overrides are recorded and take precedence over the computed order, because local knowledge that is not in any dataset is a legitimate input.',
  },
  {
    q: 'Which languages can the citizen portal handle?',
    a: 'The parser is built for English, Hindi, and Telugu citizen input. This website itself is published only in English, so no Hindi or Telugu versions of these pages exist.',
  },
  {
    q: 'Is this an emergency service?',
    a: 'No. If there is an immediate risk to life, contact the relevant emergency service. Samadhan is a planning and prioritisation tool and is not connected to any emergency response system.',
  },
];
import { Link } from 'react-router-dom';
import SEO, { SITE_URL } from '../components/SEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import RelatedPages from '../components/RelatedPages';
import StateSeatTable from '../components/StateSeatTable';

export default function Constituency() {
  return (
    <div className='page-shell'>
      <SEO
        title='Lok Sabha Constituency — 543 Seats and Your MP'
        description='How India’s 543 Lok Sabha constituencies work: 412 general, 84 SC and 47 ST seats, delimitation based on the 2001 census, and how to find your own MP and district.'
        path='/constituency'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/constituency#webpage',
          url: SITE_URL + '/constituency',
          name: 'Lok Sabha Constituency — 543 Seats and Your MP',
          description: 'How India’s 543 Lok Sabha constituencies work: 412 general, 84 SC and 47 ST seats, delimitation based on the 2001 census, and how to find your own MP and district.',
          inLanguage: 'en-IN',
        }}
      />
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Electoral geography</p>
            <h1>Lok Sabha Constituency — 543 Seats and Your MP</h1>
            <p>
              A constituency is the electoral district that elects one Member of Parliament. India
              has 543 of them, and the boundaries have been frozen since 2008. This page explains
              how the seats are distributed, why the map has not changed, and how to work out which
              constituency you are in.
            </p>
          </div>
        </section>

        <div className='container section reading-column'>
          <h2>What a constituency is</h2>
          <p>
            A constituency is a geographical area whose residents elect one representative. India
            uses the same word at two levels, which causes most of the confusion:
          </p>
          <ul>
            <li>
              <strong>Lok Sabha constituency</strong> — 543 seats, each electing one MP to the
              lower house of Parliament. This is what Samadhan means by "constituency".
            </li>
            <li>
              <strong>Assembly constituency</strong> — the seats that elect MLAs to a state
              legislative assembly. There are many more of these, and several usually sit inside
              one Lok Sabha constituency.
            </li>
            <li>
              <strong>Rajya Sabha</strong> — members are elected by state legislative assemblies,
              not by constituency voters, so there is no Rajya Sabha constituency.
            </li>
          </ul>

          <h2>The numbers: 543 seats, 129 of them reserved</h2>
          <p>
            Of the 543 Lok Sabha seats, <strong>412 are general</strong>, <strong>84 are reserved
            for Scheduled Castes</strong> and <strong>47 are reserved for Scheduled Tribes</strong>.
            Reservation is a property of the seat, not of the candidate: in a reserved seat every
            candidate must belong to that category, and the seat is not open to general candidates.
          </p>
          <p>
            Reserved seats are not spread evenly. Uttar Pradesh, with 80 seats, has 17 reserved for
            Scheduled Castes. States with large tribal populations — Madhya Pradesh, Jharkhand,
            Odisha, Chhattisgarh and Gujarat — carry most of the Scheduled Tribe seats. Several
            north-eastern states have a single seat, and in some of those it is reserved.
          </p>
          <p>
            Nagaland is a useful exception to know. Its single seat was reserved for Scheduled
            Tribes until the Constitution (Twenty-third Amendment) Act, 1969 discontinued the
            reservation, so it is a general seat today.
          </p>

          <h2>How the boundaries were drawn — and why they are frozen</h2>
          <p>
            Boundaries are set by the Delimitation Commission of India, constituted under the
            Delimitation Commission Act. Its orders cannot be challenged in a court of law; they are
            laid before the Lok Sabha and the state assemblies, and modifications are not permitted.
          </p>
          <p>
            The present boundaries come from the commission set up on <strong>12 July 2002</strong>{' '}
            under the Delimitation Act, 2002, chaired by Justice Kuldip Singh, using the{' '}
            <strong>2001 census</strong>. Its orders took effect on <strong>19 February 2008</strong>{' '}
            for most states and union territories, and on 20 March 2008 for Tripura and Meghalaya.
          </p>
          <p>
            The number of seats has not moved with population. Delimitation was suspended in 1976
            until after the 2001 census so that states running successful family-planning programmes
            would not lose parliamentary representation. The Constitution was then amended in 2002
            so that inter-state delimitation cannot happen until the{' '}
            <strong>first census conducted after 2026</strong>. That freeze is why the largest
            constituencies now have more than three million electors while the smallest have under
            fifty thousand.
          </p>
          <p>
            The 1973 commission had raised the house from 522 to 542 seats; the total became 543 when
            Sikkim was given a seat.
          </p>

          <h2>What your MP can and cannot do</h2>
          <p>
            An MP's formal powers are legislative and deliberative. In constituency terms, an MP
            can:
          </p>
          <ul>
            <li>
              <strong>Recommend MPLADS works</strong> — up to ₹5 crore a year of durable assets,
              which the district authority then sanctions or rejects.
            </li>
            <li>
              <strong>Raise questions in Parliament</strong> — questions, debates and committee
              work can force a ministry to explain a local failure.
            </li>
            <li>
              <strong>Take up grievances with ministries</strong> — an MP's letter carries more
              weight than an individual's, but it still asks the department to act rather than
              ordering it to.
            </li>
          </ul>
          <p>
            An MP cannot sanction funds directly, appoint or transfer officials, or override a
            departmental decision. Claims that an MP can "get anything done" are the source of most
            misplaced complaints.
          </p>

          <h2>Seats and entitlement, state by state</h2>
          <StateSeatTable
            caption='Lok Sabha seats by state and union territory, with reserved-seat breakdown and the annual MPLADS entitlement those seats represent (seats × ₹5 crore).'
          />

          <h2>How to find your own constituency</h2>
          <ol>
            <li>
              <strong>Check your voter ID</strong> — the Elector's Photo Identity Card and the
              electoral roll entry carry the assembly constituency, which maps to a Lok Sabha
              constituency.
            </li>
            <li>
              <strong>Search the electoral roll</strong> on the Election Commission of India's
              website, or your state chief electoral officer's site, by name and district.
            </li>
            <li>
              <strong>Use the district as a check.</strong> A district can contain parts of more
              than one Lok Sabha constituency, and a constituency can span more than one district.
              That is why Samadhan asks for both.
            </li>
          </ol>

          <h2>How Samadhan uses constituency data</h2>
          <p>
            Samadhan groups citizen reports by constituency so an MP's office can see which problems
            are most urgent in its area. When you report an issue, choose your state and then your
            constituency. Because district and Lok Sabha boundaries do not align, the constituency
            list shows every seat in the state; the district you enter is kept as an address check.
          </p>
          <p>
            Each report is scored on demand, infrastructure gap and severity, and shown to officials
            as a ranked review order. Officials still verify, decide eligibility and sanction.
          </p>

          <p className='center-action'>
            <Link className='button button--primary' to='/report-issue'>Report a constituency issue</Link>
          </p>

          <h2>Sources</h2>
          <ul>
            <li>
              <a href='https://en.wikipedia.org/wiki/Delimitation_Commission_of_India' rel='noopener noreferrer' target='_blank'>
                Delimitation Commission of India
              </a>{' '}
              — 2002 commission, chair, 2001 census basis, 2008 effective dates, 84th Amendment freeze, seat history.
            </li>
            <li>
              <a href='https://en.wikipedia.org/wiki/List_of_constituencies_of_the_Lok_Sabha' rel='noopener noreferrer' target='_blank'>
                List of constituencies of the Lok Sabha
              </a>{' '}
              — seat names and reserved status.
            </li>
            <li>
              <a href='https://en.wikipedia.org/wiki/Nagaland_Lok_Sabha_constituency' rel='noopener noreferrer' target='_blank'>
                Nagaland Lok Sabha constituency
              </a>{' '}
              — the 1969 amendment that ended its Scheduled Tribe reservation.
            </li>
            <li>
              <a href='https://www.eci.gov.in/' rel='noopener noreferrer' target='_blank'>Election Commission of India</a>{' '}
              — electoral roll search and constituency lookup.
            </li>
            <li>
              Seat counts and reserved-seat breakdown: this site's <code>data/constituencies.json</code>,
              generated from the 2024 Lok Sabha list.
            </li>
          </ul>

          <RelatedPages path='/constituency' />
        </div>
      </main>
      <Footer />
    </div>
  );
}

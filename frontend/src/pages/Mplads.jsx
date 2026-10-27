import { Link } from 'react-router-dom';
import SEO, { SITE_URL } from '../components/SEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import RelatedPages from '../components/RelatedPages';
import StateSeatTable from '../components/StateSeatTable';

export default function Mplads() {
  return (
    <div className='page-shell'>
      <SEO
        title='MPLADS Fund — ₹5 Crore a Year for Each MP'
        description='MPLADS explained: launched 23 December 1993, run by MoSPI, ₹5 crore per MP per year since 2011-12. Eligible works, SC and ST earmarks, CAG findings, and state-wise entitlements.'
        path='/mplads'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/mplads#webpage',
          url: SITE_URL + '/mplads',
          name: 'MPLADS Fund — ₹5 Crore a Year for Each MP',
          description: 'MPLADS explained: launched 23 December 1993, run by MoSPI, ₹5 crore per MP per year since 2011-12. Eligible works, SC and ST earmarks, CAG findings, and state-wise entitlements.',
          inLanguage: 'en-IN',
        }}
      />
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Constituency funding</p>
            <h1>MPLADS Fund — ₹5 Crore a Year for Each MP</h1>
            <p>
              The Members of Parliament Local Area Development Scheme lets every MP recommend
              development works in their constituency. It has existed since 1993, and the amount
              has changed three times. This page sets out what the scheme actually pays for, what
              it forbids, and how much each state's seats are worth.
            </p>
          </div>
        </section>

        <div className='container section reading-column'>
          <h2>What MPLADS is, and who runs it</h2>
          <p>
            MPLADS was formulated by the Government of India on <strong>23 December 1993</strong>.
            It was administered by the Ministry of Rural Development until <strong>October 1994</strong>,
            when the Ministry of Statistics and Programme Implementation (MoSPI) took it over. MoSPI
            still runs the scheme.
          </p>
          <p>
            The design is unusual: the MP does not receive or spend the money. The MP only
            <em> recommends</em> a work. The district authority sanctions it, identifies the
            implementing agency, executes it, and reports the status back to the ministry.
          </p>

          <h2>How much each MP gets, and how it changed</h2>
          <p>
            Each MP is allocated <strong>₹5 crore per year</strong>, a level that has been in place
            since 2011-12. It was not always that amount:
          </p>
          <div className='table-scroll'>
            <table className='data-table'>
              <caption>MPLADS annual entitlement per member, by period.</caption>
              <thead>
                <tr>
                  <th scope='col'>Period</th>
                  <th scope='col'>Annual entitlement per MP</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1993-94 onwards</td><td>₹5 lakh</td></tr>
                <tr><td>1998-99 onwards</td><td>₹2 crore</td></tr>
                <tr><td>2011-12 onwards</td><td>₹5 crore</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            The annual entitlement is released in <strong>two instalments of ₹2.5 crore</strong>.
            Funds are <strong>non-lapsable</strong>: money not released in one year is carried
            forward rather than forfeited. MoSPI disburses to district authorities, never directly
            to MPs.
          </p>

          <h2>Earmarks and special allowances</h2>
          <ul>
            <li>
              MPs must recommend at least <strong>15%</strong> of their funds for assets in areas
              inhabited by Scheduled Castes and <strong>7.5%</strong> for areas inhabited by
              Scheduled Tribes.
            </li>
            <li>
              Up to <strong>₹25 lakh per year</strong> may be recommended outside the MP's own
              constituency or state of election, to promote national unity and harmony.
            </li>
            <li>
              Up to <strong>₹25 lakh</strong> may be recommended in the state for a natural
              calamity, and up to <strong>₹1 crore</strong> anywhere in the country for a calamity
              of severe nature such as a tsunami, major cyclone or earthquake.
            </li>
            <li>
              Funds may be converged with MGNREGS to create more durable assets, and with Khelo
              India for sports infrastructure.
            </li>
          </ul>

          <h2>Who can recommend works, and where</h2>
          <ul>
            <li>
              <strong>Lok Sabha MPs</strong> recommend works in their own constituency.
            </li>
            <li>
              <strong>Rajya Sabha MPs</strong> represent the whole state, so they may choose works
              in one or more districts of that state.
            </li>
            <li>
              <strong>Nominated members</strong> of either House may choose works in one or more
              districts anywhere in the country.
            </li>
          </ul>

          <h2>What the money can and cannot be used for</h2>
          <p>
            The scheme is for durable community assets based on locally felt needs. The distinction
            between permitted and prohibited works is where most confusion arises.
          </p>
          <div className='table-scroll'>
            <table className='data-table'>
              <caption>Permitted and prohibited works under MPLADS.</caption>
              <thead>
                <tr>
                  <th scope='col'>Usually permitted</th>
                  <th scope='col'>Not permitted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Drinking water facilities</td>
                  <td>Office and residential buildings for public or private agencies</td>
                </tr>
                <tr>
                  <td>Education infrastructure, libraries and books</td>
                  <td>Land acquisition or payment of compensation</td>
                </tr>
                <tr>
                  <td>Health facilities and ambulances</td>
                  <td>Naming an asset after an individual</td>
                </tr>
                <tr>
                  <td>Roads, pathways, bridges and railway halt stations</td>
                  <td>Grants or loans to state or central relief funds</td>
                </tr>
                <tr>
                  <td>Irrigation, sanitation and drainage</td>
                  <td>Assets for individual benefit</td>
                </tr>
                <tr>
                  <td>Electricity, non-conventional energy and street lighting</td>
                  <td>Works on land belonging to religious groups</td>
                </tr>
                <tr>
                  <td>Sports infrastructure and CCTV at strategic locations</td>
                  <td>Works in unauthorised colonies</td>
                </tr>
                <tr>
                  <td>Rainwater harvesting in public spaces</td>
                  <td>Recurring costs such as salaries and pensions</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            No project costing less than ₹1 lakh is normally sanctioned, with exceptions for
            essential items such as hand pumps, computers and solar lamps. For works on land
            belonging to a registered society or trust, the society must have existed for at least
            three years and be engaged in social welfare; the lifetime ceiling is ₹50 lakh, raised
            to ₹1 crore for homes looking after deprived groups. Funding is not allowed where the
            MP or their family members are office bearers.
          </p>

          <h2>Transparency: plaques, the MPLADS portal and RTI</h2>
          <p>
            A permanent plaque must be displayed at each completed work naming the MP, the year and
            the cost. Lists of completed and ongoing works must be displayed at the district
            authority office and on the MPLADS website. Any citizen can file a Right to Information
            request for the status of funds and works, and accounts are audited by chartered
            accountants, local fund auditors or statutory auditors.
          </p>
          <p>
            District authorities are required to inspect at least <strong>10%</strong> of works
            under implementation every year.
          </p>

          <h2>What audits have found</h2>
          <p>
            The Comptroller and Auditor General's performance audit published in <strong>2010</strong>
            covered 128 district authorities across 35 states and union territories for 2004-05 to
            2008-09. It reported that in almost 100 districts funds were used to create
            non-permissible assets such as office buildings or works for religious institutions; in
            10 states the ceiling for registered societies and trusts was exceeded; in 9 states MPs
            directly recommended an implementing agency, against the norms; and 86 district
            authorities in 23 states and union territories inspected no work at all during the
            period. The same report found 90% of audited district authorities did not maintain an
            asset or work register.
          </p>
          <p>
            These findings are why the recommendation step and the sanction step are kept separate,
            and why Samadhan records who recommended what rather than treating an MP's suggestion as
            an approved project.
          </p>

          <h2>Utilisation varies widely by state</h2>
          <p>
            As of <strong>2 July 2018</strong>, ₹47,572.75 crore had been released since 1993 and
            94.99% utilised. The spread between states was wide:
          </p>
          <div className='table-scroll'>
            <table className='data-table'>
              <caption>Utilisation-to-release ratio, as of 2 July 2018.</caption>
              <thead>
                <tr>
                  <th scope='col'>Highest</th>
                  <th scope='col'>Ratio</th>
                  <th scope='col'>Lowest</th>
                  <th scope='col'>Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Telangana</td><td>101.42%</td><td>Uttarakhand</td><td>87.22%</td></tr>
                <tr><td>Sikkim</td><td>100.89%</td><td>Tripura</td><td>88.46%</td></tr>
                <tr><td>Chhattisgarh</td><td>99.60%</td><td>Jharkhand</td><td>88.93%</td></tr>
                <tr><td>Kerala</td><td>99.30%</td><td>Rajasthan</td><td>90.16%</td></tr>
                <tr><td>West Bengal</td><td>98.65%</td><td>Odisha</td><td>90.54%</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Among union territories, Lakshadweep (111.68%), Andaman and Nicobar Islands (105.68%)
            and Delhi (104.1%) were highest. Ratios above 100% reflect spending from carried-forward
            balances, which is possible because the funds are non-lapsable.
          </p>

          <h2>Seat counts and annual entitlement, state by state</h2>
          <p>
            MPLADS covers members of both Houses. With 543 Lok Sabha and up to 245 Rajya Sabha
            members, the national annual entitlement works out to roughly ₹3,940 crore at ₹5 crore
            per member — the same figure MoSPI has published. The table below covers Lok Sabha seats
            only, so it is the lower bound for each state.
          </p>
          <StateSeatTable />

          <h2>How a citizen can use this</h2>
          <ol>
            <li>
              <strong>Identify a durable asset, not a recurring cost.</strong> A classroom, a hand
              pump or a drainage line fits the scheme. Salaries and pensions do not.
            </li>
            <li>
              <strong>Name the location precisely.</strong> Village or ward, district and
              constituency. A work cannot be sanctioned in an unauthorised colony or on religious
              land.
            </li>
            <li>
              <strong>Say how many people it serves.</strong> Works that serve a wider public
              purpose are preferred over those benefiting a few individuals.
            </li>
            <li>
              <strong>Submit it through Samadhan</strong> so it is scored and recorded, then follow
              it up with the district authority, which holds the sanctioning power.
            </li>
          </ol>

          <p className='center-action'>
            <Link className='button button--primary' to='/report-issue'>Suggest a constituency project</Link>
          </p>

          <h2>Sources</h2>
          <ul>
            <li>
              <a href='https://en.wikipedia.org/wiki/Members_of_Parliament_Local_Area_Development_Scheme' rel='noopener noreferrer' target='_blank'>
                Members of Parliament Local Area Development Scheme
              </a>{' '}
              — launch date, ministry history, entitlement history, earmarks, permitted works, CAG findings, utilisation figures.
            </li>
            <li>
              <a href='https://www.mplads.gov.in/' rel='noopener noreferrer' target='_blank'>mplads.gov.in</a>{' '}
              — MoSPI's scheme portal, for current guidelines and work status.
            </li>
            <li>
              <a href='https://cag.gov.in/' rel='noopener noreferrer' target='_blank'>Comptroller and Auditor General of India</a>{' '}
              — Report No. 31 of 2010, performance audit of MPLADS.
            </li>
            <li>
              Seat counts and reserved-seat breakdown: this site's <code>data/constituencies.json</code>,
              generated from the 2024 Lok Sabha list.
            </li>
          </ul>

          <RelatedPages path='/mplads' />
        </div>
      </main>
      <Footer />
    </div>
  );
}

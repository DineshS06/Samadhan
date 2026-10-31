import { STATE_SEAT_SUMMARY, MPLADS_CRORE_PER_MP_PER_YEAR } from '../data/stateSeatSummary';

/**
 * Every state and union territory, with its Lok Sabha seat count, how many of
 * those seats are reserved, and the MPLADS entitlement those seats represent.
 *
 * The entitlement is arithmetic, not a published allocation: seats × ₹5 crore.
 * It is labelled as such in the table caption so nobody reads it as money that
 * has been released.
 *
 * The three reservation columns are hidden below the `sm` breakpoint. Six
 * columns do not fit a 390px phone, and the table was being cut off mid-word
 * with no way to tell there were more columns. Seat count and entitlement are
 * what a reader needs on a phone; the reserved-seat split is a desktop detail.
 */
export default function StateSeatTable({ caption }) {
  const totalSeats = STATE_SEAT_SUMMARY.reduce((n, r) => n + r.seats, 0);
  const totalSc = STATE_SEAT_SUMMARY.reduce((n, r) => n + r.sc, 0);
  const totalSt = STATE_SEAT_SUMMARY.reduce((n, r) => n + r.st, 0);
  const totalGeneral = STATE_SEAT_SUMMARY.reduce((n, r) => n + r.general, 0);

  return (
    <div className='table-scroll'>
      <table className='data-table'>
        <caption>
          {caption ||
            `Lok Sabha seats by state and union territory. The last column is seats × ₹${MPLADS_CRORE_PER_MP_PER_YEAR} crore, the scheme's annual entitlement per member — not money released.`}
        </caption>
        <thead>
          <tr>
            <th scope='col'>State or union territory</th>
            <th scope='col'>Seats</th>
            <th scope='col' className='hidden sm:table-cell'>General</th>
            <th scope='col' className='hidden sm:table-cell'>SC</th>
            <th scope='col' className='hidden sm:table-cell'>ST</th>
            <th scope='col'>Annual MPLADS entitlement</th>
          </tr>
        </thead>
        <tbody>
          {STATE_SEAT_SUMMARY.map((row) => (
            <tr key={row.state}>
              <th scope='row'>{row.state}</th>
              <td>{row.seats}</td>
              <td className='hidden sm:table-cell'>{row.general}</td>
              <td className='hidden sm:table-cell'>{row.sc}</td>
              <td className='hidden sm:table-cell'>{row.st}</td>
              <td>₹{(row.seats * MPLADS_CRORE_PER_MP_PER_YEAR).toLocaleString('en-IN')} crore</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope='row'>All of India</th>
            <td>{totalSeats}</td>
            <td className='hidden sm:table-cell'>{totalGeneral}</td>
            <td className='hidden sm:table-cell'>{totalSc}</td>
            <td className='hidden sm:table-cell'>{totalSt}</td>
            <td>₹{(totalSeats * MPLADS_CRORE_PER_MP_PER_YEAR).toLocaleString('en-IN')} crore</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

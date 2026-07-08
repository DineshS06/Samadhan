export default function AppNav({ active }) {
  const linkClass = (page) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      active === page
        ? 'bg-[#F28C0F] text-white'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav className="ml-auto flex items-center gap-2">
      <a href="/" className={linkClass('citizen')}>
        Citizen Portal
      </a>
      <a href="/mp" className={linkClass('mp')}>
        MP Dashboard
      </a>
    </nav>
  )
}

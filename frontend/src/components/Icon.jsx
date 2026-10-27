const p = {
  arrow: <><path d='M5 12h14' /><path d='m13 6 6 6-6 6' /></>,
  voice: <><rect x='9' y='3' width='6' height='11' rx='3' /><path d='M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8' /></>,
  brain: <><path d='M9.5 4.5A3 3 0 0 0 4 6a3 3 0 0 0 .5 5.5A3.5 3.5 0 0 0 8 17h1.5M14.5 4.5A3 3 0 0 1 20 6a3 3 0 0 1-.5 5.5A3.5 3.5 0 0 1 16 17h-1.5M9.5 4.5V20M14.5 4.5V20' /></>,
  database: <><ellipse cx='12' cy='5' rx='8' ry='3' /><path d='M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' /></>,
  map: <><path d='m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z' /><path d='M9 3v15M15 6v15' /></>,
  chart: <><path d='M4 20V10M10 20V4M16 20v-7M22 20H2' /></>,
  file: <><path d='M6 2h8l4 4v16H6z' /><path d='M14 2v5h5M9 13h6M9 17h6' /></>,
  shield: <><path d='M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Z' /><path d='m9 12 2 2 4-4' /></>,
  users: <><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' /><circle cx='9' cy='7' r='4' /></>,
  check: <path d='m5 12 4 4L19 6' />,
  menu: <path d='M4 7h16M4 12h16M4 17h16' />,
  close: <path d='m6 6 12 12M18 6 6 18' />,

  // Issue-category icons. These replaced a set of colour emoji: at 18px the
  // emoji rendered differently on every platform and several (the motorway in
  // particular) looked like broken thumbnails rather than icons.
  road: <><path d='M6 21 9 3' /><path d='M18 21 15 3' /><path d='M12 6v3M12 12v3M12 18v3' /></>,
  water: <path d='M12 3s6 6.3 6 10a6 6 0 0 1-12 0c0-3.7 6-10 6-10Z' />,
  health: <><rect x='3' y='5' width='18' height='14' rx='2' /><path d='M12 9v6M9 12h6' /></>,
  education: <><path d='M12 6.5C10 5 7 4.3 4 4.3V18c3 0 6 .7 8 2.2 2-1.5 5-2.2 8-2.2V4.3c-3 0-6 .7-8 2.2Z' /><path d='M12 6.5v13.7' /></>,
  power: <path d='M13 2 4.5 13.5H10L9 22l8.5-11.5H12L13 2Z' />,
  home: <><path d='m3 10.5 9-7.5 9 7.5' /><path d='M5.5 9.5V21h13V9.5' /><path d='M10 21v-6h4v6' /></>,
  plant: <><path d='M12 21V10' /><path d='M12 13C8 13 5.5 10.5 5.5 6.5 9.5 6.5 12 9 12 13Z' /><path d='M12 13c4 0 6.5-2.5 6.5-6.5C14.5 6.5 12 9 12 13Z' /></>,
  briefcase: <><rect x='3' y='7' width='18' height='13' rx='2' /><path d='M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7' /><path d='M3 12.5h18' /></>,
  leaf: <><path d='M20 4c-9 0-15 4.5-15 12 0 2 .8 3.6.8 3.6S8 13 15 10' /><path d='M4 21c0-4 2-7 5-9' /></>,
  bus: <><rect x='3' y='4' width='18' height='12' rx='2' /><path d='M3 10h18' /><path d='M7 16v3M17 16v3' /><circle cx='7.5' cy='13' r='1' /><circle cx='16.5' cy='13' r='1' /></>,
  pin: <><path d='M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z' /><circle cx='12' cy='10' r='2.6' /></>,
};

export default function Icon({ name, size = 24 }) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {p[name] || p.check}
    </svg>
  );
}

export default function Icon({ name, className = "h-5 w-5" }) {
  const props = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const paths = {
    account: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 3h2l2.5 11.5a2 2 0 0 0 2 1.5h8.6a2 2 0 0 0 1.9-1.4L22 7H6" /></>,
    categories: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4.5 7.5 7.5 4 7.5-4" /><path d="M12 11.5V21" /></>,
    quote: <><path d="M7 17H5a2 2 0 0 1-2-2v-4a5 5 0 0 1 5-5" /><path d="M19 17h-2a2 2 0 0 1-2-2v-4a5 5 0 0 1 5-5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></>,
    storefront: <><path d="M4 10v10h16V10" /><path d="M3 4h18l-1 6a3 3 0 0 1-5 1 3 3 0 0 1-6 0 3 3 0 0 1-5-1z" /><path d="M9 20v-5h6v5" /></>,
  };

  return <svg {...props}>{paths[name] || paths.search}</svg>;
}

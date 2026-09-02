import Link from "next/link";
import Icon from "./Icons";

export default function SectionHeader({ eyebrow, title, description, href, linkLabel }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="marketplace-eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600">
          {linkLabel}<Icon name="arrow" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

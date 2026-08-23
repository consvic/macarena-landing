import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  /** Secondary text link. Omitted on focused flows like checkout. */
  secondaryLink?: { href: string; label: string };
  /** Right-most element: the page's primary action (CTA pill or cart button). */
  action: ReactNode;
};

export function SiteHeader({ secondaryLink, action }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-light-beige/10 bg-royal-blue/90 backdrop-blur">
      <div className="container mx-auto flex h-12 items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-light-beige"
        >
          <Image src="/MacaBeige2.png" alt="" width={36} height={36} priority />
          <span className="font-serif text-lg text-light-beige">Macarena</span>
        </Link>
        <nav className="flex items-center gap-6">
          {secondaryLink ? (
            <Link
              href={secondaryLink.href}
              className="hidden text-sm text-light-beige/80 transition-colors duration-200 hover:text-light-beige focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-light-beige sm:block"
            >
              {secondaryLink.label}
            </Link>
          ) : null}
          {action}
        </nav>
      </div>
    </header>
  );
}

export function SiteHeaderCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full bg-light-beige px-5 py-2 text-sm font-medium text-royal-blue transition-[background-color,transform] duration-200 hover:bg-cream-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light-beige"
    >
      {children}
    </Link>
  );
}

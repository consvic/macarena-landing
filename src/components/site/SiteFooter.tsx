import Image from "next/image";
import Link from "next/link";

const INSTAGRAM_URL =
  "https://www.instagram.com/macarenagelateria?igsh=MTRmbDhlYmY3aG54dw==";

export function SiteFooter() {
  return (
    <footer className="bg-royal-blue py-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <Image src="/MacaBeige2.png" alt="" width={32} height={32} />
          <span className="font-serif text-light-beige">
            Macarena Gelateria
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/menu"
            className="text-sm text-light-beige/80 transition-colors duration-200 hover:text-light-beige"
          >
            Ver menú
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-light-beige/80 transition-colors duration-200 hover:text-light-beige"
          >
            Instagram
          </a>
        </nav>
        <p className="text-sm text-light-beige/60">
          <span className="font-data">© {new Date().getFullYear()}</span>{" "}
          Macarena Gelateria
        </p>
      </div>
    </footer>
  );
}

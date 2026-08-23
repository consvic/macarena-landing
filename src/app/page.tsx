import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader, SiteHeaderCta } from "@/components/site/SiteHeader";

// Re-render daily so the footer copyright year stays current on a static page
export const revalidate = 86400;

const values = [
  {
    title: "Calidad sobre cantidad",
    text: "Pocos sabores, hechos bien y en pequeños lotes.",
  },
  {
    title: "Tradición italiana",
    text: "Técnica clásica de gelateria, sin atajos.",
  },
  {
    title: "Esencia mexicana",
    text: "Ingredientes y sabores que celebran a México.",
  },
];

const lifestyleCopy = [
  "Sabores pensados para paladares curiosos",
  "Ingredientes de primera y combinaciones únicas",
  "Una experiencia que se siente tan bien como sabe",
];

export default function MacarenaGelateria() {
  return (
    <>
      <SiteHeader
        secondaryLink={{ href: "#philosophy", label: "Nuestra historia" }}
        action={<SiteHeaderCta href="/menu">Ver menú</SiteHeaderCta>}
      />

      <main className="overflow-x-clip bg-cream-white">
        <section className="relative flex min-h-[calc(100dvh-3rem)] items-center overflow-hidden bg-royal-blue">
          <div className="container mx-auto grid items-center gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4 lg:py-16">
            <div className="max-w-xl">
              <h1 className="animate-slide-up font-serif text-4xl font-bold leading-[1.05] text-light-beige [text-wrap:balance] md:text-6xl">
                La nueva experiencia de gelato en México
              </h1>
              <p className="mt-6 max-w-[46ch] animate-fade-in-delay font-sans text-lg font-light leading-relaxed text-light-beige/90 md:text-xl">
                Ingredientes premium, tradición italiana y un sabor único con
                esencia mexicana.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-delay-2">
                <Link
                  href="/menu"
                  className="w-full rounded-full bg-light-beige px-8 py-3 text-center text-base font-medium text-royal-blue transition-[background-color,transform] duration-200 hover:bg-cream-white hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light-beige sm:w-auto"
                >
                  Ver menú
                </Link>
                <a
                  href="#philosophy"
                  className="w-full rounded-full border-2 border-light-beige/60 px-8 py-3 text-center text-base font-medium text-light-beige transition-[border-color,transform] duration-200 hover:border-light-beige hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light-beige sm:w-auto"
                >
                  Nuestra historia
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-56 sm:w-80 lg:w-full lg:max-w-lg lg:translate-x-12">
              <Image
                src="/scoop-vanilla.png"
                alt=""
                width={512}
                height={768}
                priority
                className="w-full animate-float-slow [filter:drop-shadow(0_40px_80px_rgba(9,14,38,0.55))]"
              />
            </div>
          </div>
        </section>

        <section
          id="philosophy"
          className="scroll-mt-12 bg-light-beige py-32 md:py-44"
        >
          <div className="container mx-auto px-6">
            <Reveal>
              <h2 className="max-w-2xl font-serif text-3xl font-bold text-royal-blue [text-wrap:balance] md:text-5xl">
                Nacido de la pasión, creado con amor
              </h2>
              <p className="mt-6 max-w-[60ch] font-sans text-lg leading-relaxed text-oxford-black/75">
                Gelato artesanal con técnica italiana clásica y sabores que
                celebran a México.
              </p>
            </Reveal>

            <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-ochre/30">
              {values.map((value, index) => (
                <Reveal
                  key={value.title}
                  delay={index * 120}
                  className="md:px-8 md:first:pl-0 md:last:pr-0"
                >
                  <h3 className="font-serif text-xl font-bold text-terracotta">
                    {value.title}
                  </h3>
                  <p className="mt-3 max-w-[36ch] font-sans leading-relaxed text-oxford-black/75">
                    {value.text}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-wine-red py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
              <Reveal>
                <Image
                  src="/image-2.png"
                  alt="Bolas de gelato de pistache y chocolate sobre mármol"
                  width={800}
                  height={800}
                  className="w-full max-w-lg rounded-2xl shadow-2xl shadow-black/30"
                />
              </Reveal>

              <Reveal delay={150}>
                <h2 className="font-serif text-3xl font-bold text-light-beige [text-wrap:balance] md:text-5xl">
                  Para el paladar sofisticado
                </h2>
                <p className="mt-6 max-w-[52ch] font-sans text-lg leading-relaxed text-light-beige/90">
                  Nuestro gelato no es solo un postre: es un antojo que combina
                  calidad, autenticidad y ese toque especial que te hace volver
                  por más.
                </p>
                <ul className="mt-8 space-y-4">
                  {lifestyleCopy.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-ochre pl-4 font-sans text-light-beige/90"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-light-beige py-24 md:py-32">
          <Image
            src="/scoop-pistache.png"
            alt=""
            width={120}
            height={180}
            className="absolute left-10 top-12 hidden animate-float opacity-80 md:block"
          />
          <Image
            src="/scoop-pistache.png"
            alt=""
            width={90}
            height={135}
            className="absolute bottom-16 right-16 hidden animate-float-delay opacity-80 md:block"
          />

          <div className="container mx-auto px-6 text-center">
            <Reveal>
              <Image
                src="/MacaAzul1.png"
                alt="Macarena Gelateria"
                width={260}
                height={260}
                className="mx-auto"
              />
              <h2 className="mt-2 font-serif text-4xl font-bold text-royal-blue [text-wrap:balance] md:text-6xl">
                La espera ha terminado
              </h2>
              <p className="mx-auto mt-6 max-w-[44ch] font-sans text-lg leading-relaxed text-oxford-black/75 md:text-xl">
                Pide en línea o síguenos para enterarte de nuestras novedades y
                sabores.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/menu"
                  className="w-full max-w-xs rounded-full bg-royal-blue px-8 py-3 text-center text-base font-medium text-light-beige transition-[background-color,transform] duration-200 hover:bg-royal-blue/90 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue sm:w-auto sm:max-w-none"
                >
                  Ver menú
                </Link>
                <a
                  id="instagram-link"
                  href="https://www.instagram.com/macarenagelateria?igsh=MTRmbDhlYmY3aG54dw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-xs rounded-full border-2 border-royal-blue px-8 py-3 text-center text-base font-medium text-royal-blue transition-[background-color,transform] duration-200 hover:bg-royal-blue/10 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue sm:w-auto sm:max-w-none"
                >
                  Síguenos en Instagram
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

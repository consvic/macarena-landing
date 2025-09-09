"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const lifestyleCopy = [
  {
    color: "bg-ochre",
    text: "Sabores pensados para paladares curiosos",
  },
  {
    color: "bg-light-beige",
    text: "Ingredientes de primera y combinaciones únicas",
  },
  {
    color: "bg-wine-red",
    text: "Una experiencia que se siente tan bien como sabe",
  },
];

export default function MacarenaGelateria() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({
    differentiators: false,
    philosophy: false,
    lifestyle: false,
    cta: false,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("data-section");
            if (section) {
              setIsVisible((prev) => ({ ...prev, [section]: true }));
            }
          }
        });
      },
      { threshold: 0.1 },
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section with Falling Ice Cream Animation */}
      <section className="relative min-h-screen flex items-center justify-center bg-royal-blue">
        <div className="absolute inset-0 overflow-hidden">
          {/* Giant falling gelato scoop */}
          <Image
            src="/scoop-vanilla.png"
            alt="Giant vanilla gelato scoop"
            width={600}
            height={600}
            className="absolute transition-transform duration-300 ease-out"
            style={{
              bottom: `${Math.max(-600, scrollY * 0.8 - 400)}px`,
              right: "-12%",
              transform: `rotate(${-scrollY * 0.05}deg)`,
              filter: "drop-shadow(0 30px 60px hsla(0, 0%, 0%, 0.3))",
              opacity: Math.max(0.1, 1 - scrollY / 800),
            }}
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-6 animate-fade-in flex justify-center">
            <Image
              src="/MacaBeige2.png"
              alt="Macarena Gelateria"
              width={180}
              height={180}
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-[100%] animate-slide-up text-light-beige">
            Macarena
            <br />
            <span className="text-3xl md:text-5xl animate-slide-up-delay">
              La nueva experiencia de gelato en México
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-sans font-light leading-[100%] animate-fade-in-delay text-light-beige">
            Ingredientes premium, tradición italiana, y un sabor único con una
            esencia mexicana.
          </p>

          <Button
            size="lg"
            className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent cursor-pointer hover:bg-opacity-20 hover:shadow-xl hover:shadow-white/20 active:scale-95 active:shadow-inner transition-all duration-300 ease-out hover:scale-105 animate-fade-in-delay-2 hover:border-opacity-80 active:border-opacity-100 border-light-beige text-light-beige"
          >
            Descubre más
          </Button>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden bg-cream-white"
        data-section="philosophy"
        style={{
          backgroundImage: `url('/MacaRojo3.png')`,
          backgroundSize: "120px 120px",
          backgroundRepeat: "repeat",
          backgroundPosition: "0 0",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay to soften the pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            backgroundImage: `
              linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%),
              linear-gradient(-45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)
            `,
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`mb-12 transition-all duration-1000 ${
                isVisible.philosophy
                  ? "animate-fade-in opacity-100"
                  : "opacity-0"
              }`}
            >
              <Image
                width={200}
                height={200}
                src="/image-1.png"
                alt="Artisanal gelato making process"
                className="w-full max-w-lg mx-auto rounded-lg shadow-2xl hover:shadow-3xl transition-shadow duration-500"
              />
            </div>

            <h2
              className={`text-4xl md:text-5xl font-serif font-bold mb-8 transition-all duration-1000 text-royal-blue ${
                isVisible.philosophy
                  ? "animate-slide-up opacity-100"
                  : "opacity-0 translate-y-10"
              }`}
            >
              Nacido de la pasión, creado con amor
            </h2>

            {/* <p
              className={`text-xl font-sans leading-relaxed mb-8 transition-all duration-1000 delay-200 text-wine-red ${
                isVisible.philosophy
                  ? "animate-fade-in opacity-100"
                  : "opacity-0"
              }`}
            >
              Macarena es una gelatería digital nacida del amor por el arte
              culinario italiano y la tradición del gelato. Nuestra misión es
              destacar en México por la calidad y el sabor único, con la
              elegancia como valor central en el servicio y las plataformas
              digitales.
            </p> */}

            <div
              className={`flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-400 ${
                isVisible.philosophy
                  ? "animate-slide-up opacity-100"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="relative bg-gradient-to-r from-ochre/20 to-ochre/10 px-6 py-3 rounded-lg border-l-4 border-ochre shadow-sm">
                <span className="text-lg font-medium text-ochre">
                  Calidad sobre cantidad
                </span>
              </div>
              <div className="relative bg-gradient-to-r from-terracotta/20 to-terracotta/10 px-6 py-3 rounded-lg border-l-4 border-terracotta shadow-sm">
                <span className="text-lg font-medium text-terracotta">
                  Tradición italiana
                </span>
              </div>
              <div className="relative bg-gradient-to-r from-wine-red/20 to-wine-red/10 px-6 py-3 rounded-lg border-l-4 border-wine-red shadow-sm">
                <span className="text-lg font-medium text-wine-red">
                  Esencia mexicana
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden bg-terracotta"
        data-section="lifestyle"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                isVisible.lifestyle
                  ? "animate-slide-left opacity-100"
                  : "opacity-0 -translate-x-10"
              }`}
            >
              <Image
                width={400}
                height={400}
                src="/image-2.png"
                alt="Elegant gelato tasting experience"
                className="w-full max-w-lg mx-auto rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105"
              />
            </div>

            <div
              className={`transition-all duration-1000 delay-300 ${
                isVisible.lifestyle
                  ? "animate-slide-right opacity-100"
                  : "opacity-0 translate-x-10"
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-light-beige">
                Para el paladar sofisticado
              </h2>

              <p className="text-xl font-sans leading-relaxed mb-8 text-light-beige">
                Hecho para quienes saben disfrutar lo bueno de la vida. Nuestro
                gelato no es solo un postre: es un antojo que combina calidad,
                autenticidad y ese toque especial que te hace volver por más.
              </p>

              <div className="space-y-4">
                {lifestyleCopy.map((item, index) => (
                  <div
                    key={item.text}
                    className={`flex items-center gap-4 transition-all duration-500 hover:translate-x-2 ${
                      isVisible.lifestyle
                        ? "animate-fade-in opacity-100"
                        : "opacity-0"
                    }`}
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${item.color}`}
                    ></div>
                    <span className="text-lg font-sans text-light-beige">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-32 relative overflow-hidden bg-light-beige"
        data-section="cta"
      >
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/scoop-pistache.png"
            alt="Pistachio gelato scoop"
            width={120}
            height={120}
            className="absolute top-10 left-10 animate-float"
          />
          <Image
            src="/scoop-pistache.png"
            alt="Pistachio gelato scoop"
            width={100}
            height={100}
            className="absolute bottom-20 right-20 animate-float-delay"
          />
          <Image
            src="/scoop-pistache.png"
            alt="Pistachio gelato scoop"
            width={80}
            height={80}
            className="absolute top-1/2 right-10 animate-float-delay-2"
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div
            className={`mb-2 transition-all duration-1000 ${
              isVisible.cta ? "animate-fade-in opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src="/MacaAzul1.png"
              alt="Macarena Gelateria"
              width={300}
              height={300}
              className="mx-auto"
            />
          </div>

          <h2
            className={`text-5xl md:text-8xl font-serif font-bold tracking-[2.5px] mb-8 transition-all duration-1000 delay-200 text-royal-blue ${
              isVisible.cta
                ? "animate-scale-up opacity-100"
                : "opacity-0 scale-95"
            }`}
          >
            Próximamente
          </h2>

          <p
            className={`text-2xl md:text-3xl mb-12 max-w-3xl mx-auto font-sans leading-[100%] transition-all duration-1000 delay-300 text-wine-red ${
              isVisible.cta ? "animate-fade-in opacity-100" : "opacity-0"
            }`}
          >
            Síguenos en redes sociales para ser el primero en experimentar
            Macarena Gelateria.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-500 ${
              isVisible.cta
                ? "animate-slide-up opacity-100"
                : "opacity-0 translate-y-10"
            }`}
          >
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 text-base font-medium rounded-full border-2 bg-transparent cursor-pointer hover:bg-opacity-20 hover:shadow-2xl hover:shadow-slate-900/30 active:scale-95 active:shadow-inner transition-all duration-300 ease-out hover:scale-105 hover:border-opacity-80 active:border-opacity-100 hover:brightness-110 border-royal-blue text-royal-blue text-center"
            >
              Siguenos en Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

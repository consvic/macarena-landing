"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import Image from "next/image";

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
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section with Falling Ice Cream Animation */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#151F49" }}
      >
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
          <div className="mb-10 animate-fade-in flex justify-center">
            <Image
              src="/MacaBeige2.png"
              alt="Macarena Gelateria"
              width={180}
              height={180}
            />
          </div>

          <h1
            className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight animate-slide-up"
            style={{ color: "#EDDBC3" }}
          >
            Macarena - La nueva experiencia de gelato
            <br />
            <span className="animate-slide-up-delay">en México</span>
          </h1>

          <p
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-sans font-light leading-relaxed animate-fade-in-delay"
            style={{ color: "#EDDBC3" }}
          >
            Ingredientes premium, tradición italiana, y un sabor único con una
            esencia mexicana.
          </p>

          <Button
            size="lg"
            className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent cursor-pointer hover:bg-opacity-20 hover:shadow-xl hover:shadow-white/20 active:scale-95 active:shadow-inner transition-all duration-300 ease-out hover:scale-105 animate-fade-in-delay-2 hover:border-opacity-80 active:border-opacity-100"
            style={{
              borderColor: "#EDDBC3",
              color: "#EDDBC3",
              backgroundColor: "transparent",
            }}
          >
            Descubre más
          </Button>
        </div>
      </section>

      <section
        className="py-24 transition-all duration-1000"
        style={{ backgroundColor: "#EDDBC3" }}
        data-section="differentiators"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                icon: "#C98D50",
                title: "Ingredientes de alta calidad",
                description:
                  "Ingredientes premium cuidadosamente seleccionados de los mejores proveedores italianos y mexicanos.",
                delay: "0s",
              },
              {
                icon: "#BF602B",
                title: "Opciones sin azúcar, sin lactosa y veganas",
                description:
                  "Gelato inclusivo creado para cada estilo de vida, sin comprometer el sabor o la calidad.",
                delay: "0.2s",
              },
              {
                icon: "#640A1A",
                title: "Inspirado en Italia, con un toque mexicano",
                description:
                  "Técnicas tradicionales italianas de gelato realzadas con sabores e ingredientes mexicanos auténticos.",
                delay: "0.4s",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`border-0 shadow-none bg-transparent text-center transition-all duration-1000 hover:transform hover:scale-105 ${
                  isVisible.differentiators
                    ? "animate-slide-up opacity-100"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ animationDelay: item.delay }}
              >
                <CardContent className="pt-8">
                  <div
                    className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-transform duration-300 hover:rotate-12"
                    style={{ backgroundColor: "#151F49" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full animate-pulse"
                      style={{ backgroundColor: item.icon }}
                    ></div>
                  </div>
                  <h3
                    className="text-2xl font-serif font-bold mb-4"
                    style={{ color: "#151F49" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-lg font-sans leading-relaxed"
                    style={{ color: "#640A1A" }}
                  >
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden"
        data-section="philosophy"
        style={{
          backgroundColor: "#f8f6f3",
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
            backgroundColor: "rgba(255, 255, 255, 0.85)",
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
              className={`text-4xl md:text-5xl font-serif font-bold mb-8 transition-all duration-1000 ${
                isVisible.philosophy
                  ? "animate-slide-up opacity-100"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ color: "#151F49" }}
            >
              Nacido de la pasión, creado con amor
            </h2>

            <p
              className={`text-xl font-sans leading-relaxed mb-8 transition-all duration-1000 delay-200 ${
                isVisible.philosophy
                  ? "animate-fade-in opacity-100"
                  : "opacity-0"
              }`}
              style={{ color: "#640A1A" }}
            >
              Macarena es una gelatería digital nacida del amor por el arte
              culinario italiano y la tradición del gelato. Nuestra misión es
              destacar en México por la calidad y el sabor único, con la
              elegancia como valor central en el servicio y las plataformas
              digitales.
            </p>

            <div
              className={`flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-400 ${
                isVisible.philosophy
                  ? "animate-slide-up opacity-100"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Badge
                variant="outline"
                className="px-6 py-2 text-lg border-2 hover:scale-105 transition-transform duration-300"
                style={{ borderColor: "#C98D50", color: "#C98D50" }}
              >
                Calidad sobre cantidad
              </Badge>
              <Badge
                variant="outline"
                className="px-6 py-2 text-lg border-2 hover:scale-105 transition-transform duration-300"
                style={{ borderColor: "#BF602B", color: "#BF602B" }}
              >
                Tradición italiana
              </Badge>
              <Badge
                variant="outline"
                className="px-6 py-2 text-lg border-2 hover:scale-105 transition-transform duration-300"
                style={{ borderColor: "#640A1A", color: "#640A1A" }}
              >
                Esencia mexicana
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: "#bf602b" }}
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
              <h2
                className="text-4xl md:text-5xl font-serif font-bold mb-8"
                style={{ color: "#EDDBC3" }}
              >
                Para el paladar sofisticado
              </h2>

              <p
                className="text-xl font-sans leading-relaxed mb-8"
                style={{ color: "#EDDBC3" }}
              >
                Creado para adultos exigentes que aprecian las cosas finas de la
                vida. Nuestro gelato representa más que un postre—es una
                elección de estilo de vida premium que refleja sofisticación y
                calidad.
              </p>

              <div className="space-y-4">
                {[
                  {
                    color: "#C98D50",
                    text: "Experiencia premium para adultos",
                  },
                  { color: "#eddbc3", text: "Perfiles de sabor sofisticados" },
                  {
                    color: "#640A1A",
                    text: "Presentación y servicio elegantes",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 transition-all duration-500 hover:translate-x-2 ${
                      isVisible.lifestyle
                        ? "animate-fade-in opacity-100"
                        : "opacity-0"
                    }`}
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span
                      className="text-lg font-sans"
                      style={{ color: "#EDDBC3" }}
                    >
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
        className="py-32 relative overflow-hidden"
        style={{ backgroundColor: "#EDDBC3" }}
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
            className={`text-5xl md:text-8xl font-serif font-bold mb-8 transition-all duration-1000 delay-200 ${
              isVisible.cta
                ? "animate-scale-up opacity-100"
                : "opacity-0 scale-95"
            }`}
            style={{ color: "#151F49" }}
          >
            Próximamente
          </h2>

          <p
            className={`text-2xl md:text-3xl mb-12 max-w-3xl mx-auto font-sans leading-relaxed transition-all duration-1000 delay-300 ${
              isVisible.cta ? "animate-fade-in opacity-100" : "opacity-0"
            }`}
            style={{ color: "#640A1A" }}
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
            <Button
              size="lg"
              className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent cursor-pointer hover:bg-opacity-20 hover:shadow-2xl hover:shadow-slate-900/30 active:scale-95 active:shadow-inner transition-all duration-300 ease-out hover:scale-110 hover:border-opacity-80 active:border-opacity-100 hover:brightness-110"
              style={{
                borderColor: "#151F49",
                color: "#151F49",
                backgroundColor: "transparent",
              }}
            >
              Siguenos en Instagram
            </Button>

            <Button
              size="lg"
              className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent cursor-pointer hover:bg-opacity-20 hover:shadow-2xl hover:shadow-red-900/30 active:scale-95 active:shadow-inner transition-all duration-300 ease-out hover:scale-110 hover:border-opacity-80 active:border-opacity-100 hover:brightness-110"
              style={{
                borderColor: "#640A1A",
                color: "#640A1A",
                backgroundColor: "transparent",
              }}
            >
              Siguenos en TikTok
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

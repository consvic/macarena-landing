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
          {/* Animated floating gelato scoops */}
          <div
            className="absolute w-32 h-32 rounded-full opacity-20 animate-bounce"
            style={{
              backgroundColor: "#EDDBC3",
              top: "10%",
              left: "10%",
              animationDelay: "0s",
              animationDuration: "3s",
            }}
          ></div>
          <div
            className="absolute w-24 h-24 rounded-full opacity-15 animate-bounce"
            style={{
              backgroundColor: "#C98D50",
              top: "20%",
              right: "15%",
              animationDelay: "1s",
              animationDuration: "4s",
            }}
          ></div>
          <div
            className="absolute w-20 h-20 rounded-full opacity-25 animate-bounce"
            style={{
              backgroundColor: "#BF602B",
              bottom: "30%",
              left: "20%",
              animationDelay: "2s",
              animationDuration: "3.5s",
            }}
          ></div>

          {/* Main falling ice cream scoop */}
          <div
            className="absolute w-40 h-40 rounded-full opacity-30 transition-transform duration-1000 ease-out"
            style={{
              backgroundColor: "#EDDBC3",
              top: `${Math.max(-100, -scrollY * 0.5)}px`,
              left: "50%",
              transform: `translateX(-50%) rotate(${scrollY * 0.1}deg)`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          ></div>

          {/* Secondary falling scoops */}
          <div
            className="absolute w-28 h-28 rounded-full opacity-20 transition-transform duration-1000 ease-out"
            style={{
              backgroundColor: "#C98D50",
              top: `${Math.max(-80, -scrollY * 0.3)}px`,
              left: "30%",
              transform: `translateX(-50%) rotate(${-scrollY * 0.08}deg)`,
            }}
          ></div>
          <div
            className="absolute w-24 h-24 rounded-full opacity-25 transition-transform duration-1000 ease-out"
            style={{
              backgroundColor: "#640A1A",
              top: `${Math.max(-60, -scrollY * 0.4)}px`,
              right: "25%",
              transform: `translateX(50%) rotate(${scrollY * 0.12}deg)`,
            }}
          ></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-12 animate-fade-in flex justify-center">
            <Image
              src="/MacaBeige2.png"
              alt="Macarena Gelateria"
              width={120}
              height={120}
            />
          </div>

          <h1
            className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight animate-slide-up"
            style={{ color: "#EDDBC3" }}
          >
            A new gelato experience
            <br />
            <span className="animate-slide-up-delay">in Mexico</span>
          </h1>

          <p
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed animate-fade-in-delay"
            style={{ color: "#EDDBC3" }}
          >
            Premium ingredients, Italian tradition, and a unique flavor with a
            Mexican essence.
          </p>

          <Button
            size="lg"
            className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent hover:bg-opacity-10 transition-all duration-500 hover:scale-105 animate-fade-in-delay-2"
            style={{
              borderColor: "#EDDBC3",
              color: "#EDDBC3",
              backgroundColor: "transparent",
            }}
            disabled
          >
            Discover more
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
                title: "High-quality ingredients",
                description:
                  "Carefully selected premium ingredients sourced from the finest Italian and Mexican suppliers.",
                delay: "0s",
              },
              {
                icon: "#BF602B",
                title: "Sugar-free, lactose-free & vegan options",
                description:
                  "Inclusive gelato crafted for every lifestyle, without compromising on taste or quality.",
                delay: "0.2s",
              },
              {
                icon: "#640A1A",
                title: "Inspired by Italy, with a Mexican touch",
                description:
                  "Traditional Italian gelato techniques enhanced with authentic Mexican flavors and ingredients.",
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
                    className="text-lg leading-relaxed"
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

      <section className="py-24 bg-white" data-section="philosophy">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`mb-12 transition-all duration-1000 ${
                isVisible.philosophy
                  ? "animate-fade-in opacity-100"
                  : "opacity-0"
              }`}
            >
              <img
                src="/image-1.png"
                alt="Artisanal gelato making process"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl hover:shadow-3xl transition-shadow duration-500"
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
              Born from passion, crafted with love
            </h2>

            <p
              className={`text-xl leading-relaxed mb-8 transition-all duration-1000 delay-200 ${
                isVisible.philosophy
                  ? "animate-fade-in opacity-100"
                  : "opacity-0"
              }`}
              style={{ color: "#640A1A" }}
            >
              Macarena is a digital gelateria born from the love of Italian
              culinary art and gelato tradition. Our mission is to stand out in
              Mexico for quality and unique flavor, with elegance as the core
              value across service and digital platforms.
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
                Quality over quantity
              </Badge>
              <Badge
                variant="outline"
                className="px-6 py-2 text-lg border-2 hover:scale-105 transition-transform duration-300"
                style={{ borderColor: "#BF602B", color: "#BF602B" }}
              >
                Italian tradition
              </Badge>
              <Badge
                variant="outline"
                className="px-6 py-2 text-lg border-2 hover:scale-105 transition-transform duration-300"
                style={{ borderColor: "#640A1A", color: "#640A1A" }}
              >
                Mexican essence
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: "#151F49" }}
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
              <img
                src="/image-2.png"
                alt="Elegant gelato tasting experience"
                className="w-full rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105"
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
                For the sophisticated palate
              </h2>

              <p
                className="text-xl leading-relaxed mb-8"
                style={{ color: "#EDDBC3" }}
              >
                Crafted for discerning adults who appreciate the finer things in
                life. Our gelato represents more than a dessert—it's a premium
                lifestyle choice that reflects sophistication and quality.
              </p>

              <div className="space-y-4">
                {[
                  {
                    color: "#C98D50",
                    text: "Premium experience for adults 27-38",
                  },
                  { color: "#BF602B", text: "Sophisticated flavor profiles" },
                  {
                    color: "#640A1A",
                    text: "Elegant presentation and service",
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
                    <span className="text-lg" style={{ color: "#EDDBC3" }}>
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
          <div
            className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-10 animate-float"
            style={{ backgroundColor: "#151F49" }}
          ></div>
          <div
            className="absolute bottom-20 right-20 w-16 h-16 rounded-full opacity-15 animate-float-delay"
            style={{ backgroundColor: "#640A1A" }}
          ></div>
          <div
            className="absolute top-1/2 right-10 w-12 h-12 rounded-full opacity-20 animate-float-delay-2"
            style={{ backgroundColor: "#C98D50" }}
          ></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2
            className={`text-6xl md:text-8xl font-serif font-bold mb-8 transition-all duration-1000 ${
              isVisible.cta
                ? "animate-scale-up opacity-100"
                : "opacity-0 scale-95"
            }`}
            style={{ color: "#151F49" }}
          >
            Coming Soon
          </h2>

          <p
            className={`text-2xl md:text-3xl mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
              isVisible.cta ? "animate-fade-in opacity-100" : "opacity-0"
            }`}
            style={{ color: "#640A1A" }}
          >
            Follow us on social media to be the first to experience Macarena
            Gelateria.
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
              className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent hover:bg-opacity-10 transition-all duration-500 hover:scale-110 hover:shadow-lg"
              style={{
                borderColor: "#151F49",
                color: "#151F49",
                backgroundColor: "transparent",
              }}
            >
              Follow on Instagram
            </Button>

            <Button
              size="lg"
              className="px-12 py-6 text-lg font-medium rounded-full border-2 bg-transparent hover:bg-opacity-10 transition-all duration-500 hover:scale-110 hover:shadow-lg"
              style={{
                borderColor: "#640A1A",
                color: "#640A1A",
                backgroundColor: "transparent",
              }}
            >
              Follow on Facebook
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

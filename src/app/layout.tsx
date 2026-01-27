import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import type React from "react";
import "./globals.css";

const eymenPro = localFont({
  src: "../fonts/EymenPro-Light.otf",
  display: "swap",
  variable: "--font-eymen",
});

const cocoGothic = localFont({
  src: [
    {
      path: "../fonts/CocoGothic-Light_trial.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/CocoGothic_trial.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CocoGothic-Bold_trial.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/CocoGothic-Heavy_trial.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-coco",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Macarena Gelateria - Gelato Italiano Premium en México",
  description:
    "Experimenta la mejor tradición italiana de gelato con un toque mexicano. Ingredientes premium, sabores elegantes y gusto sofisticado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${eymenPro.variable} ${cocoGothic.variable} ${inter.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

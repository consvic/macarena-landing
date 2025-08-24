import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Macarena Gelateria - Premium Italian Gelato in Mexico",
  description:
    "Experience the finest Italian gelato tradition with a Mexican touch. Premium ingredients, elegant flavors, and sophisticated taste.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("layout");
  return (
    <html
      lang="en"
      className={`${eymenPro.variable} ${cocoGothic.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

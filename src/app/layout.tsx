import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "MedicalPrep — Family medication safety",
  description:
    "Agentic AI for family caregivers managing polypharmacy, interactions, and visit prep.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Extensions and autofill often mutate <html>/<body> attributes before hydration.
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} ${fraunces.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

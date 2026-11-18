import type { Metadata } from "next";
import { inter, fraunces } from "@/lib/siteFonts";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sinon Learning — Free Curriculum & Classroom Tools",
  description:
    "Sinon Learning is building a free library of modern curriculum, digital textbooks, visual resources, and simple classroom tools for real teachers and real students.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-50 text-navy-900">
        {children}
      </body>
    </html>
  );
}

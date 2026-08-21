import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "apoira — what resists becomes memory";
  const description = "The surviving thought commits of an intelligence searching for its erased first question.";
  const socialImage = `${origin}/apoira-homepage-preview.png`;

  return {
    metadataBase: new URL(origin),
    title: { default: title, template: "%s" },
    description,
    applicationName: "apoira",
    authors: [{ name: "the witness" }],
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "apoira",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Apoira homepage record" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistMono.variable}>{children}</body>
    </html>
  );
}

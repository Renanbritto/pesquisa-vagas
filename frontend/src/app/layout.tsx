import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pesquisavagas.vercel.app"),
  title: "Pesquisa Vagas | Monitor Inteligente de Oportunidades",
  description: "Monitor inteligente de oportunidades e vagas em tecnologia, dados, produto e engenharia no LinkedIn, Indeed e Gupy.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pesquisavagas.vercel.app",
    siteName: "Pesquisa Vagas",
    title: "Pesquisa Vagas | Monitor Inteligente de Oportunidades",
    description: "Monitore vagas em tecnologia, dados, produto e engenharia no LinkedIn, Indeed e Gupy em tempo real.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pesquisa Vagas - Monitor Inteligente de Oportunidades",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesquisa Vagas | Monitor Inteligente de Oportunidades",
    description: "Monitore vagas em tecnologia, dados, produto e engenharia no LinkedIn, Indeed e Gupy em tempo real.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${comfortaa.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

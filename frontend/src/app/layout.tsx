import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pesquisa Vagas | Monitor Inteligente de Oportunidades",
  description: "Monitor inteligente de oportunidades e vagas em tecnologia, dados, produto e engenharia no LinkedIn, Indeed e Gupy.",
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

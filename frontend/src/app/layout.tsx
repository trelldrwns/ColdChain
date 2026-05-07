import type { Metadata } from "next";
import { Figtree, DM_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-ui" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-data" });
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Cold Chain Monitor",
  description: "Pharmaceutical cold chain logistics monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${dmMono.variable} font-ui bg-page text-text-primary antialiased`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

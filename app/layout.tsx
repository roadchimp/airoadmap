import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Assuming global styles exist here
import Providers from "./providers";
import ClientProviders from "./client-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Roadmap", // Set a default title
  description: "AI GTM Readiness Analyzer", // Set a default description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>{/* suppressHydrationWarning often needed with next-themes */}
      <body className={inter.className}>
        <ClientProviders>
          <Providers>{children}</Providers>
        </ClientProviders>
      </body>
    </html>
  );
}

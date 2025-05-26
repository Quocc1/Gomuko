"use client";

import "../styles/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { AblyProvider } from "@/contexts/ably-provider";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AblyProvider>{children}</AblyProvider>
        </Providers>
      </body>
    </html>
  );
}

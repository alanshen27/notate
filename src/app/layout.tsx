import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notate",
  description: "Your personal note-taking app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-screen`}>
        <Providers session={session}>
          <div className="h-full flex flex-col">
            <Navbar />
            <main className="flex-1">  
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

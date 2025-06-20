import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner"


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "notate.sh",
  description: "Your personal AI-powered note-taking and revision app",
  icons: "/logo.png",
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
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

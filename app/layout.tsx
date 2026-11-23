import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "LevelGround", description: "Free graduate assessment practice for South African youth." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";
import { nunito } from "@/app/ui/fonts";

export const metadata: Metadata = {
  title: "Bubbles",
  description: "Discover and share listings in one bubbly place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

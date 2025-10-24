import type { Metadata } from "next";
import "./globals.css";
// import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "TwilioChat - WhatsApp Business Management",
  description: "Professional WhatsApp Business management platform with agent management and conversation tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* <Toaster /> */}
      </body>
    </html>
  );
}
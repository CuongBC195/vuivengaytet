import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Removed for simplicity if fonts not installed/configured perfectly, or keep default
import { Inter } from "next/font/google"; // Switch to Inter as requested "Font to rõ ràng"
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Lô Tô Online",
    description: "Chơi Lô Tô Online Realtime",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}

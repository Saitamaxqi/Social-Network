import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GroupProvider } from '@/contexts/GroupContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soul Society Network",
  description: "Welcome to our Soul Society",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <WebSocketProvider>
            <NotificationProvider>
              <GroupProvider>
                {children}
              </GroupProvider>
            </NotificationProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

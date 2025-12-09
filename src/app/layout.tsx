import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GetInvoice - CRM & Invoice Management",
  description: "Modern CRM system with powerful invoice generation",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        {children}
        <Toaster />
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('LordIcon library loaded successfully')
          }}
          onError={(e) => {
            console.error('Failed to load lordicon:', e)
          }}
        />
        <Script id="lordicon-error-handler" strategy="afterInteractive">
          {`
            // Catch lordicon errors globally
            if (typeof window !== 'undefined') {
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    event.reason.message.includes('did not match the expected pattern')) {
                  console.warn('Suppressed lordicon error:', event.reason.message);
                  event.preventDefault();
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}

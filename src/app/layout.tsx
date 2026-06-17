import type { Metadata } from "next";
import { Noto_Sans_TC, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileStickyCTA from "@/components/MobileStickyCTA";
import JsonLd from "@/components/JsonLd";
import { siteConfig } from "@/data/site";

// Configure fonts
const noto = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["300", "400", "500", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "焓耀空調工程｜高雄、屏東冷氣空調工程專精",
  description: "焓耀空調提供高雄與屏東專業冷氣空調工程服務。項目涵蓋家用冷氣安裝、商用多聯變頻空調規劃、冷氣定期清洗保養、滴水噪音冷媒故障檢修、全熱交換器及冷氣舊換新。合格技師持照施作，透明報價保固無憂。",
  metadataBase: new URL("https://www.hanyao.com.tw"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "焓耀空調工程｜高雄、屏東冷氣空調安裝、維修、清洗保養、商用規劃",
    description: "高屏全區在地服務，國家級技術士執照師傅團隊。家用與商用空調量身規劃施工，收費透明先報價才施工，完工享售後專屬保固。",
    url: "https://www.hanyao.com.tw",
    siteName: "焓耀空調工程",
    locale: "zh_TW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "name": "焓耀空調工程有限公司",
    "alternateName": "焓耀空調",
    "url": "https://www.hanyao.com.tw",
    "telephone": `+886-${siteConfig.phone1.replace(/-/g, "")}`,
    "email": siteConfig.email,
    "taxID": "90234660",
    "priceRange": "$$",
    "description": "焓耀空調工程有限公司具備經濟部冷凍空調業登記（字號：經冷字第 1120002883 號，登記為 E602011 冷凍空調工程業丙等），且為台灣區冷凍空調工程工業同業公會會員。旗下技師持有乙級冷凍空調裝修技術士證照，專精高雄與屏東地區之商用空調工程規劃、冷氣安裝、維修、清洗與保養。",
    "knowsAbout": [
      "經濟部冷凍空調業登記 經冷字第 1120002883 號",
      "E602011 冷凍空調工程業",
      "台灣區冷凍空調工程工業同業公會會員",
      "乙級冷凍空調裝修技術士",
      "高雄屏東空調工程",
      "商用空調工程",
      "冷氣安裝維修清洗保養"
    ],
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": "高雄市"
      },
      {
        "@type": "AdministrativeArea",
        "name": "屏東縣"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "高雄市",
      "addressCountry": "TW"
    }
  };

  return (
    <html
      lang="zh-Hant-TW"
      className={`${noto.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* Inject JSON-LD Schema */}
        <JsonLd schema={businessSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {/* Background dark grid overlay */}
        <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
        
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">{children}</div>

        {/* Footer */}
        <Footer />

        {/* Mobile Sticky CTA Bar */}
        <MobileStickyCTA />

        {/* GTM & Tracking browser scripts */}
        <Script src="/scripts/tracking.js" strategy="afterInteractive" />
        <Script src="/scripts/geo.js" strategy="afterInteractive" />
        <Script src="/scripts/form.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

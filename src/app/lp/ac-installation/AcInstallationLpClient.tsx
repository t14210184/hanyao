"use client";

import React from "react";
import LandingHero from "@/components/LandingHero";
import PainPointCards from "@/components/PainPointCards";
import PriceFactorsSection from "@/components/PriceFactorsSection";
import FAQAccordion from "@/components/FAQAccordion";
import ContactForm from "@/components/ContactForm";
import FinalCTA from "@/components/FinalCTA";
import TrustSection from "@/components/TrustSection";
import ProcessSection from "@/components/ProcessSection";

const painPoints = [
  {
    title: "管線配置混亂不美觀",
    description: "隨意牽線明管外露，不僅破壞室內裝潢美感，甚至容易拉扯破損造成冷媒洩漏。"
  },
  {
    title: "排水設計不良常漏水",
    description: "排水管傾角不足或位置不對，吹冷氣不到半年室內就開始滴水漏水，破壞裝潢牆面。"
  },
  {
    title: "室外機散熱差常故障",
    description: "安裝在不通風的陽台或狹窄縫隙，主機長期散熱不良導致耗電暴增、壓縮機壽命減半。"
  }
];

const priceFactors = [
  {
    name: "冷媒銅管配置長度",
    description: "室內機與室外機之間的距離決定了銅管長度，超過標準基本長度（一般為5米）後，會依公尺數及厚度規格累計費用。"
  },
  {
    name: "室外機安裝危險加成",
    description: "室外機是否需要架設不銹鋼A字架、工作平台，或涉及外牆高空懸吊吊裝等高風險作業，會產生對應的防護安全配備費用。"
  },
  {
    name: "舊機拆卸與回收清運",
    description: "舊冷氣舊換新需進行冷媒回收封存與拆除。如有清運與回收需要，我們會依機型大小提供拆卸回收與舊機折抵評估。"
  },
  {
    name: "牆面洗孔與線槽配置",
    description: "銅管穿牆所需的洗孔數量（鋼筋混凝土洗孔），以及室外管線是否需要安裝美觀耐候線槽以保護銅管避免日曬劣化。"
  }
];

const faqItems = [
  {
    id: "inst-faq-1",
    question: "冷氣安裝費用為什麼一定要看現場才能報價？",
    answer: "因為每位客戶的安裝環境皆不相同：銅管配置的實際長度、室外機安裝位置的危險程度（是否需要吊車或高空作業）、排水孔與電源配置等都會直接影響材料與工時。實地看過現場能保證提供100%精準報價，避免電話粗估導致事後加價糾紛。"
  },
  {
    id: "inst-faq-2",
    question: "新屋裝潢前，為什麼要先找空調公司規劃冷氣？",
    answer: "建議在「木作與水電進場前」就完成冷氣配置規劃。因為不論是吊隱式冷氣或是分離式冷氣，銅管、排水管與控制線皆需預先埋入天花板或粉刷牆內。提早配置能與裝潢設計無縫結合，避免完工後被迫走明管而破壞美感。"
  },
  {
    id: "inst-faq-3",
    question: "可以先用 LINE 傳現場照片或格局圖做初步估價嗎？",
    answer: "可以！非常歡迎您先將現場空間照片、預留冷氣孔位置、格局平面圖等透過 LINE 傳送給我們（LINE ID 官方帳號 @451vpomq）。我們的技師可以在線上根據照片提供初步的機型噸數建議與估價範圍，之後再約時間到府做最後的實地確認。"
  },
  {
    id: "inst-faq-4",
    question: "分離式冷氣與吊隱式冷氣的安裝差異是什麼？",
    answer: "分離式冷氣（壁掛式）安裝快速、保養清潔極為便利，但室內機需佔用局部牆面。吊隱式冷氣主機隱藏在天花板木作中，只露出美觀的出風口與回風口，完全不佔用空間且視覺感高級，但建置成本較高，且木作天花板必須預留足夠大的維修孔以便未來保養。"
  },
  {
    id: "inst-faq-5",
    question: "舊冷氣舊換新拆除安裝一條龍，費用怎麼算？",
    answer: "我們提供冷媒回收封存、舊機拆卸、新機載運、標準施工安裝到完工效能測試。舊機拆卸費依主機大小與危險度而定，若同時向我們訂購並安裝新機，我們會提供專屬的一條龍優惠折抵方案，保證費用合理透明。"
  }
];

export default function AcInstallationLpClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Landing Hero */}
      <LandingHero
        title="高雄 / 屏東冷氣安裝估價｜新屋、舊換新、分離式與吊隱式規劃"
        subtitle="焓耀空調提供家用變頻冷氣、商用多聯變頻系統與全熱交換器量身規劃。持證技師團隊，重視管線隱蔽配置、排水斜度與室外機散熱防護，提供真實透明估價服務。"
        phoneCtaText="立即撥打安裝估價"
        lineCtaText="LINE 傳照片初步評估"
        appointmentCtaText="預約現場估價"
        trackPrefix="installation"
        serviceType="ac-installation"
      />

      {/* Pain points */}
      <PainPointCards
        title="冷氣安裝不良，將帶給您未來十年的煩惱"
        subtitle="隨意低價發包、缺少工法規範的冷氣安裝，往往是漏水、不冷與機器短命的主因。"
        points={painPoints}
      />

      {/* Trust credentials */}
      <TrustSection />

      {/* Price factors */}
      <PriceFactorsSection
        title="為什麼冷氣安裝費用不能隨便報一個死價格？"
        subtitle="我們堅持到府場勘精準評估，拒絕低價攬客後現場任意加價。"
        factors={priceFactors}
      />

      {/* Process steps */}
      <ProcessSection />

      {/* FAQ Section */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              冷氣安裝常見問題解答
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              為您解答關於估價方式、配合裝潢時間以及機型選用等安裝疑問。
            </p>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* Booking Form */}
      <section id="contact-section" className="py-16 bg-slate-950 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              預約免費到府場勘與安裝估價
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              留下您的基本資料，我們將指派技師以電話或簡訊與您聯繫約定場勘時間。
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />
    </main>
  );
}

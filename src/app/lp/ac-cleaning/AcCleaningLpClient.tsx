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

const symptoms = [
  {
    title: "開機吹出酸臭霉味",
    description: "冷氣內部鰭片與排水盤滋生大量黴菌，一運轉就散發難聞的異味，嚴重影響室內空氣品質。"
  },
  {
    title: "風速變慢、出風量變小",
    description: "鼓風輪（圓筒葉片）縫隙卡滿厚重的棉絮、灰塵與油煙，阻擋風流，導致風速極度緩慢。"
  },
  {
    title: "冷房效率差、室內不冷",
    description: "冷媒鰭片表面堆積油泥灰塵阻礙熱交換，使得冷氣出風不夠冰冷，冷房時間拉長。"
  },
  {
    title: "水盤淤積果凍生物膜漏水",
    description: "水盤積滿黴菌黏膠（生物膜）並流入排水孔造成完全堵塞，凝結水無處排放直接溢流室內。"
  },
  {
    title: "電費異常暴增、主機吃電",
    description: "鰭片髒污使冷氣必須提高轉速、延長高功率運轉時間才能降溫，造成耗電量大幅增加。"
  },
  {
    title: "出風口掉下黑色髒污顆粒",
    description: "內部黴菌與灰塵結塊成黑色碎屑，運轉時隨風噴出，直接污染下方的床舖或地板。"
  }
];

const priceFactors = [
  {
    name: "冷氣型式（壁掛/吊隱/嵌入）",
    description: "家用壁掛式結構簡單、拆裝快速；而天花板吊隱式或四方吹嵌入式冷氣，拆卸零件繁複且需要高空作業，清洗耗時較長。"
  },
  {
    name: "室外機是否一併清洗",
    description: "室外機散熱片如果卡滿灰塵，會直接降低排熱效率導致耗電。加洗室外機通常會有與室內機合洗的優惠加購價。"
  },
  {
    name: "一次施作的冷氣總台數",
    description: "同一個地址有多台冷氣需要清洗保養時，我們會統一安排工程車與工具，省下重置與車馬工時，並提供多台合洗的包套優惠。"
  }
];

const faqItems = [
  {
    id: "cl-faq-1",
    question: "冷氣一般多久需要安排清洗保養一次？",
    answer: "一般家用冷氣建議「1 至 2 年」進行一次深層高壓清洗保養。若家中有過敏體質成員、嬰幼兒、寵物，或是冷氣裝在餐廳、廚房旁容易吸附油煙，則強烈建議「每年」清洗一次，以確保呼吸道健康與省電效能。"
  },
  {
    id: "cl-faq-2",
    question: "冷氣有霉味可以用市售冷氣清洗噴霧自己噴嗎？",
    answer: "市售噴霧僅能清潔到表面的「鰭片」，但霉味的源頭往往是排水盤與最裡面的「鼓風輪（風輪）」。噴霧藥劑如果沒有徹底高壓沖洗乾淨，殘留的藥劑反而會加速黏附灰塵與滋生黴菌。因此徹底除霉防菌必須由技師使用專用高壓水罩在現場深層沖洗。"
  },
  {
    id: "cl-faq-3",
    question: "為什麼清洗冷氣前，師傅需要先確認「機型」與「台數」？",
    answer: "因為不同機型（如一般的壁掛式、吊隱式、四方吹嵌入型，以及日系特殊自動清潔防捲機型）其結構與拆裝複雜度完全不同，所需的防護水罩與工時也不同。確認好機型與台數能讓我們準備專門的工具與估算精確費用，確保報價透明。"
  },
  {
    id: "cl-faq-4",
    question: "清洗冷氣會拆回公司洗嗎？會不會弄髒我家裡的牆壁與家具？",
    answer: "我們全數採用「現場高壓清洗」。施作前會針對冷氣周圍的牆面、下方的家具、地板鋪設嚴密的防塵防護塑膠套，並為冷氣掛上專用的漏斗形集水罩，所有的髒水會順著導水管排入集水桶中，完全不弄髒您的裝潢與家具。"
  },
  {
    id: "cl-faq-5",
    question: "我的冷氣現在不冷，這算是「清洗」還是「維修」？",
    answer: "如果冷氣開機後「風量很小、有酸臭霉味、冷房慢，但有亮綠燈且運轉正常」，通常是髒污堵塞，透過「清洗保養」即可恢復。但若冷氣「室外機不運轉、主機亮故障燈/閃紅燈、完全只吹微溫送風、或有刺耳摩擦噪音」，這屬於「故障維修」，請在預約時提前告知故障狀況，以便我們指派備有檢修儀器的技師到府處理。"
  }
];

export default function AcCleaningLpClient() {
  return (
    <main className="flex-1 flex flex-col pt-16">
      {/* Landing Hero */}
      <LandingHero
        title="高雄 / 屏東冷氣清洗保養｜霉味、風量變小、髒污堆積先確認機型"
        subtitle="焓耀空調提供家用與商用冷氣高壓深層清洗保養。中性無毒防霉劑、裝潢全面防塵防水包覆，當場洗、當場裝，改善霉味與冷房效能。"
        phoneCtaText="撥打詢問清洗"
        lineCtaText="LINE 傳台數與照片"
        appointmentCtaText="預約清洗保養"
        trackPrefix="cleaning"
        serviceType="ac-cleaning"
      />

      {/* Symptoms Grid */}
      <PainPointCards
        title="冷氣吹出黑屑、風量卡阻？這代表內部已嚴重發霉"
        subtitle="冷氣內部溫暖潮濕，最容易成為塵蟎、黴菌與生物膜的溫床，需透過高壓水槍沖刷方能根治。"
        points={symptoms}
      />

      {/* Trust credentials */}
      <TrustSection />

      {/* Price factors */}
      <PriceFactorsSection
        title="為什麼冷氣清洗費用一定要先確認機型與台數？"
        subtitle="我們堅持公開價格、依機型合理報價，拒絕低價釣魚與任意現場加收費用。"
        factors={priceFactors}
      />

      {/* Process steps */}
      <ProcessSection />

      {/* FAQ Section */}
      <section className="py-16 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              冷氣清洗保養常見問題解答
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              為您解答關於清洗頻率、施工作業防護以及清洗與維修之差別。
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
              預約冷氣現場清洗保養
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              請填寫您的資料與冷氣機型，我們將儘速與您確認施作台數、報價與到府清洗排程。
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

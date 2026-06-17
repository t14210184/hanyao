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
import JsonLd from "@/components/JsonLd";

export default function AcRepairLP() {
  const pageTitle = "高雄 / 屏東冷氣維修檢修｜冷氣不冷、滴水漏水、異音故障快速預約 - 焓耀空調";
  const pageDescription = "高雄與屏東地區冷氣維修檢修服務。提供分離式冷氣、吊隱式冷氣不冷、漏水滴水、異常噪音及漏冷媒精準檢測。專業師傅先報價後維修，故障處理透明安心。";

  // Schema for BreadcrumbList and WebPage
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "高雄 / 屏東冷氣維修檢修",
    "description": pageDescription,
    "url": "https://www.hanyao.com.tw/lp/ac-repair/"
  };

  const symptoms = [
    {
      title: "冷氣突然不冷只吹送風",
      description: "主機有運轉但完全沒有冷風吹出，可能是啟動電容損壞、冷媒不足或基板故障。"
    },
    {
      title: "室內機漏水滴水或噴水",
      description: "出風口開始滴水，甚至浸濕牆壁與木作裝潢，通常是排水管堵塞或蒸發器結霜。"
    },
    {
      title: "主機運轉噪音劇烈",
      description: "運轉時發出強烈震動聲、喀喀異音或高頻噪音，可能馬達軸承磨損或扇葉鬆脫。"
    },
    {
      title: "管路漏冷媒效能下降",
      description: "冷媒管路微漏導致冷房效果越來越差，嚴重時室外機銅管接頭處會出現結霜現象。"
    },
    {
      title: "冷氣無法啟動無反應",
      description: "插電後電源指示燈不亮，遙控器完全無法開機，基板損壞或電源線路故障。"
    },
    {
      title: "排水管嚴重髒污堵塞",
      description: "冷氣內部滋生黴菌與果凍狀膠質，造成排水孔完全堵死，冷氣凝結水無法排出。"
    }
  ];

  const priceFactors = [
    {
      name: "更換之零配件類別",
      description: "維修費用取決於損壞的零件：如啟動電容、風扇馬達、控制基板或壓縮機。我們會依現場檢測出的實際損壞點進行精準報價。"
    },
    {
      name: "冷媒查漏與系統重新封裝",
      description: "若有漏冷媒，並非單純補充冷媒即可。必須先進行系統加壓查漏、焊補洩漏點、抽真空排除水分後，再重新定量充填冷媒。"
    },
    {
      name: "室外機所處施工作業環境",
      description: "室外機若位處高空外牆、無安全立足點等高風險環境，基於工安規範，需額外增設安全繩索防護或出動吊車配合。"
    }
  ];

  const faqItems = [
    {
      id: "rep-faq-1",
      question: "冷氣吹出來不冷，最常見的原因是什麼？",
      answer: "最常見的原因包含：濾網與熱交換鰭片被髒污嚴重堵塞導致無法熱交換、啟動電容故障使壓縮機無法運轉、冷媒管路洩漏導致冷媒不足，或是主控制基板損壞。技師會使用電流表與壓力表進行綜合診斷，找出真正病因。"
    },
    {
      id: "rep-faq-2",
      question: "如果師傅到府檢查後報價，我覺得太貴決定不修，需要付費嗎？",
      answer: "若技師到府進行詳細檢測並說明故障原因後，您評估機器過於老舊而決定不予維修，我們僅會收取基本的檢測診斷費與車馬費（高雄與屏東市區一般為300-500元，視距離與危險度而定）。若您決定當場委託維修，則此檢測費將全額折抵，不另加收。"
    },
    {
      id: "rep-faq-3",
      question: "冷氣漏水滴水可以自己處理嗎？還是必須找專業師傅？",
      answer: "您可以先檢查並清洗防塵濾網，有時是濾網太髒通風不良導致蒸發器結霜漏水。若清洗濾網後仍持續漏水，多數是內部排水盤累積黴菌膠質、排水管路完全堵塞，或是冷媒不足引起結冰。這需要師傅使用專業高壓沖洗槍與疏通藥劑處理，建議聯絡師傅檢修。"
    },
    {
      id: "rep-faq-4",
      question: "報警搶修可以保證「依排程安排檢修」與當場修好嗎？",
      answer: "我們無法保證無預警隨叫隨到，而是會依現有排程進行調度與判斷。若是一般啟動電容損壞、漏水堵塞、繼電器故障等常見問題，師傅車上備有常用材料，通常可在當次現場修復。但若遇到基板燒毀需送廠修復、壓縮機燒毀或需向原廠調用特殊零件，則必須約定二次施作，因此我們不承諾隨叫隨到或一定當場修好，一切以誠實檢測與安全施工為原則。"
    },
    {
      id: "rep-faq-5",
      question: "找焓耀維修更換零件，有提供售後保保固嗎？",
      answer: "有的。我們針對檢修項目及更換的原廠規格零件皆提供售後保固憑證。保固範圍與具體時間會清楚註記在您的維修單據上，保障您的售後權益。"
    }
  ];

  return (
    <>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href="https://www.hanyao.com.tw/lp/ac-repair/" />
        <JsonLd schema={pageSchema} />
      </head>

      <main className="flex-1 flex flex-col pt-16">
        {/* Landing Hero */}
        <LandingHero
          title="冷氣不冷、滴水、異音？高雄 / 屏東冷氣維修檢修"
          subtitle="焓耀空調提供家用變頻與商用空調快速檢修。國家乙級技術士技師到府，堅持「先精密檢測、報價，客戶同意後才施作」，絕不隨意現場加價。"
          phoneCtaText="急件立即撥打"
          lineCtaText="LINE 傳故障狀況"
          appointmentCtaText="預約到府檢修"
          trackPrefix="repair"
          serviceType="ac-repair"
        />

        {/* Symptoms Grid */}
        <PainPointCards
          title="冷氣出現這些異常症狀？建議儘速安排檢查"
          subtitle="冷氣異常若強行運轉，可能導致微小故障惡化為壓縮機燒毀等重大損壞。"
          points={symptoms}
        />

        {/* Trust credentials */}
        <TrustSection />

        {/* Price factors */}
        <PriceFactorsSection
          title="為什麼冷氣維修費用無法在電話中直接報死？"
          subtitle="我們秉持實務查檢與診斷，現場說明損壞點，拒絕低價釣魚與任意加價。"
          factors={priceFactors}
        />

        {/* Process steps */}
        <ProcessSection />

        {/* FAQ Section */}
        <section className="py-16 bg-slate-900/10 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                冷氣維修常見問題解答
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                為您解答關於到府檢修排程、檢測費用與保固條款等修復疑問。
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
                預約到府冷氣檢修
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                請留下您的姓名與電話，並描述冷氣故障症狀，我們將儘速安排工程師與您聯繫。
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA />
      </main>
    </>
  );
}

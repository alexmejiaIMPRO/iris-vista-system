'use client';

import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AnalyticsPage() {
  const { language } = useLanguage();

  const text = {
    en: {
      title: 'Analytics',
      subtitle: 'View reports and analytics',
      comingSoon: 'Coming soon',
    },
    zh: {
      title: '分析',
      subtitle: '查看报表和分析',
      comingSoon: '即将推出',
    },
    es: {
      title: 'Analítica',
      subtitle: 'Ver reportes y analítica',
      comingSoon: 'Próximamente',
    },
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <section className="border-b border-[#E4E1DD] bg-white px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
            {t.title}
          </h1>
          <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
        </div>
      </section>

      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
            <BarChart3 className="h-16 w-16 text-[#E4E1DD] mx-auto mb-4" />
            <p className="text-xl text-[#6E6B67]">{t.comingSoon}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

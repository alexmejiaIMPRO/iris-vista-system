import { Search, ShoppingBag, Package, Shield, Zap, Laptop, Wrench } from 'lucide-react';

interface HeroProps {
  language: 'en' | 'zh';
}

export function Hero({ language }: HeroProps) {
  const text = {
    en: {
      title: 'What do you need today?',
      search: 'Search for forms, materials, services...',
      actions: [
        { icon: ShoppingBag, label: 'Amazon Purchase', color: '#FF9900' },
        { icon: Package, label: 'Regular Purchase (PR/PO)', color: '#75534B' },
        { icon: Shield, label: 'PPE Request', color: '#10B981' },
        { icon: Zap, label: 'Non-Amazon Spot Purchase', color: '#F59E0B' },
        { icon: Laptop, label: 'IT Request', color: '#3B82F6' },
        { icon: Wrench, label: 'Maintenance Request', color: '#8B5CF6' },
      ],
    },
    zh: {
      title: '今天需要什么？',
      search: '搜索表单、物料、服务...',
      actions: [
        { icon: ShoppingBag, label: '亚马逊采购', color: '#FF9900' },
        { icon: Package, label: '常规采购 (PR/PO)', color: '#75534B' },
        { icon: Shield, label: 'PPE 请求', color: '#10B981' },
        { icon: Zap, label: '非亚马逊现货采购', color: '#F59E0B' },
        { icon: Laptop, label: 'IT 请求', color: '#3B82F6' },
        { icon: Wrench, label: '维护请求', color: '#8B5CF6' },
      ],
    },
  };

  const t = text[language];

  return (
    <section className="mb-12">
      {/* Hero Title */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-gray-900">{t.title}</h1>
        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-14 pr-4 text-base shadow-sm transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 focus:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {t.actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className="group flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl transition-all"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon className="h-7 w-7" style={{ color: action.color }} />
              </div>
              <span className="text-center text-sm text-gray-700 group-hover:text-gray-900">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

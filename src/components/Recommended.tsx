import { Clock, TrendingUp, Star } from 'lucide-react';

interface RecommendedProps {
  language: 'en' | 'zh';
}

export function Recommended({ language }: RecommendedProps) {
  const text = {
    en: {
      title: 'Recommended for You',
      items: [
        {
          name: 'Office Supplies Request',
          category: 'Non-Production',
          usage: 'Used 12 times',
          icon: TrendingUp,
        },
        {
          name: 'Safety Glasses - Clear Lens',
          category: 'PPE & Safety',
          usage: 'Frequently ordered',
          icon: Star,
        },
        {
          name: 'IT Equipment Request',
          category: 'IT Services',
          usage: 'Recently viewed',
          icon: Clock,
        },
        {
          name: 'Travel Expense Report',
          category: 'HR & Admin',
          usage: 'Used 8 times',
          icon: TrendingUp,
        },
      ],
    },
    zh: {
      title: '为您推荐',
      items: [
        {
          name: '办公用品申请',
          category: '非生产',
          usage: '已使用 12 次',
          icon: TrendingUp,
        },
        {
          name: '安全眼镜 - 透明镜片',
          category: 'PPE 与安全',
          usage: '经常订购',
          icon: Star,
        },
        {
          name: 'IT 设备申请',
          category: 'IT 服务',
          usage: '最近浏览',
          icon: Clock,
        },
        {
          name: '差旅费用报告',
          category: 'HR 与行政',
          usage: '已使用 8 次',
          icon: TrendingUp,
        },
      ],
    },
  };

  const t = text[language];

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-gray-900">{t.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {t.items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className="group flex items-center gap-4 rounded-xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#75534B]/10">
                <Icon className="h-5 w-5 text-[#75534B]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-gray-900 group-hover:text-[#75534B]">
                  {item.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{item.usage}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

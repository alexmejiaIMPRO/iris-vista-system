import { Package, Shield, Settings, Users, Laptop, Archive, FileText, TrendingUp } from 'lucide-react';

interface CategoriesProps {
  language: 'en' | 'zh';
}

export function Categories({ language }: CategoriesProps) {
  const text = {
    en: {
      title: 'Browse by Category',
      categories: [
        {
          icon: Package,
          title: 'Non-Production Procurement',
          description: 'Office supplies, furniture, services',
        },
        {
          icon: Shield,
          title: 'PPE & Safety',
          description: 'Personal protective equipment, safety gear',
        },
        {
          icon: Settings,
          title: 'MRO Supplies',
          description: 'Maintenance, repair, operations materials',
        },
        {
          icon: Users,
          title: 'HR & Admin',
          description: 'Onboarding, travel, expense reports',
        },
        {
          icon: Laptop,
          title: 'IT Services',
          description: 'Hardware, software, support requests',
        },
        {
          icon: Archive,
          title: 'Inventory Management',
          description: 'Stock requests, transfers, adjustments',
        },
        {
          icon: FileText,
          title: 'Forms Library',
          description: 'All procurement forms and templates',
        },
        {
          icon: TrendingUp,
          title: 'Analytics & Reports',
          description: 'Spending reports, trends, insights',
        },
      ],
    },
    zh: {
      title: '按类别浏览',
      categories: [
        {
          icon: Package,
          title: '非生产采购',
          description: '办公用品、家具、服务',
        },
        {
          icon: Shield,
          title: 'PPE 与安全',
          description: '个人防护装备、安全设备',
        },
        {
          icon: Settings,
          title: 'MRO 供应',
          description: '维护、维修、运营物资',
        },
        {
          icon: Users,
          title: 'HR 与行政',
          description: '入职、差旅、费用报告',
        },
        {
          icon: Laptop,
          title: 'IT 服务',
          description: '硬件、软件、支持请求',
        },
        {
          icon: Archive,
          title: '库存管理',
          description: '库存请求、转移、调整',
        },
        {
          icon: FileText,
          title: '表单库',
          description: '所有采购表单和模板',
        },
        {
          icon: TrendingUp,
          title: '分析与报告',
          description: '支出报告、趋势、洞察',
        },
      ],
    },
  };

  const t = text[language];

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-gray-900">{t.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {t.categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <button
              key={index}
              className="group flex items-start gap-4 rounded-xl bg-white p-6 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#75534B]/10">
                <Icon className="h-6 w-6 text-[#75534B]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-gray-900 group-hover:text-[#75534B]">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

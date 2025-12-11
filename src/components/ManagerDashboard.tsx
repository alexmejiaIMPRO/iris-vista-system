import { DollarSign, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface ManagerDashboardProps {
  language: 'en' | 'zh';
}

export function ManagerDashboard({ language }: ManagerDashboardProps) {
  const text = {
    en: {
      title: 'Manager Dashboard',
      monthlySpend: {
        title: 'Monthly Spend',
        amount: '$127,450',
        change: '+12% vs last month',
        trend: 'up',
      },
      pendingApprovals: {
        title: 'Pending Approvals',
        count: '8',
        description: 'Requests awaiting your approval',
      },
      lowStockAlerts: {
        title: 'Low Stock Alerts',
        count: '3',
        description: 'PPE items below threshold',
      },
      alerts: [
        {
          item: 'Safety Gloves - Medium',
          quantity: '45 units',
          threshold: 'Below 50',
        },
        {
          item: 'Safety Glasses',
          quantity: '22 units',
          threshold: 'Below 30',
        },
        {
          item: 'Hard Hats - Yellow',
          quantity: '18 units',
          threshold: 'Below 25',
        },
      ],
    },
    zh: {
      title: '管理员仪表板',
      monthlySpend: {
        title: '月度支出',
        amount: '$127,450',
        change: '较上月 +12%',
        trend: 'up',
      },
      pendingApprovals: {
        title: '待处理审批',
        count: '8',
        description: '等待您审批的请求',
      },
      lowStockAlerts: {
        title: '低库存警报',
        count: '3',
        description: 'PPE 物品低于阈值',
      },
      alerts: [
        {
          item: '安全手套 - 中号',
          quantity: '45 件',
          threshold: '低于 50',
        },
        {
          item: '安全眼镜',
          quantity: '22 件',
          threshold: '低于 30',
        },
        {
          item: '安全帽 - 黄色',
          quantity: '18 件',
          threshold: '低于 25',
        },
      ],
    },
  };

  const t = text[language];

  return (
    <section>
      <h2 className="mb-6 text-gray-900">{t.title}</h2>
      
      <div className="space-y-4">
        {/* Monthly Spend */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#75534B]/10">
              <DollarSign className="h-5 w-5 text-[#75534B]" />
            </div>
            <h3 className="text-gray-900">{t.monthlySpend.title}</h3>
          </div>
          <div className="mb-2 text-3xl text-gray-900">{t.monthlySpend.amount}</div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{t.monthlySpend.change}</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <button className="w-full rounded-xl bg-white p-6 text-left shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <CheckCircle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-gray-900">{t.pendingApprovals.title}</h3>
          </div>
          <div className="mb-2 text-3xl text-gray-900">{t.pendingApprovals.count}</div>
          <p className="text-sm text-gray-500">{t.pendingApprovals.description}</p>
        </button>

        {/* Low Stock Alerts */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-gray-900">{t.lowStockAlerts.title}</h3>
          </div>
          <div className="mb-4">
            <div className="mb-2 text-3xl text-gray-900">{t.lowStockAlerts.count}</div>
            <p className="text-sm text-gray-500">{t.lowStockAlerts.description}</p>
          </div>
          
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {t.alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-2 rounded-lg bg-red-50 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{alert.item}</div>
                  <div className="text-xs text-gray-500">{alert.quantity}</div>
                </div>
                <div className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                  {alert.threshold}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

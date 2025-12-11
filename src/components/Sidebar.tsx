import { Home, ShoppingBag, ExternalLink, FileText, CheckSquare, Package, Users, BarChart3, Settings, Wrench, Handshake, FileSignature, Factory, Database, ClipboardList, DollarSign } from 'lucide-react';

type PageType = 'home' | 'catalog' | 'cart' | 'punchout' | 'equipment' | 'service' | 'contract' | 'production' | 'inventory' | 'supplier' | 'analytics' | 'admin' | 'masterdata' | 'prpo' | 'approvals' | 'financial';

interface SidebarProps {
  language: 'en' | 'zh' | 'es';
  currentPage: PageType;
  navigateTo: (page: PageType) => void;
}

export function Sidebar({ language, currentPage, navigateTo }: SidebarProps) {
  const text = {
    en: {
      menu: [
        { icon: Home, label: 'Home', page: 'home' as PageType },
        { icon: ShoppingBag, label: 'Internal Catalog', page: 'catalog' as PageType },
        { icon: ExternalLink, label: 'Punch-out', page: 'punchout' as PageType },
        { icon: ClipboardList, label: 'PR & PO', page: 'prpo' as PageType },
        { icon: CheckSquare, label: 'Approvals', page: 'approvals' as PageType },
        { icon: Wrench, label: 'Equipment', page: 'equipment' as PageType },
        { icon: Handshake, label: 'Service', page: 'service' as PageType },
        { icon: FileSignature, label: 'Contract', page: 'contract' as PageType },
        { icon: Factory, label: 'Production', page: 'production' as PageType },
        { icon: Package, label: 'Inventory', page: 'inventory' as PageType },
        { icon: Users, label: 'Suppliers', page: 'supplier' as PageType },
        { icon: BarChart3, label: 'Analytics', page: 'analytics' as PageType },
        { icon: Database, label: 'Master Data', page: 'masterdata' as PageType },
        { icon: Settings, label: 'Admin', page: 'admin' as PageType },
        { icon: DollarSign, label: 'Financial', page: 'financial' as PageType },
      ],
    },
    zh: {
      menu: [
        { icon: Home, label: '首页', page: 'home' as PageType },
        { icon: ShoppingBag, label: '内部目录', page: 'catalog' as PageType },
        { icon: ExternalLink, label: 'Punch-out', page: 'punchout' as PageType },
        { icon: ClipboardList, label: 'PR & PO', page: 'prpo' as PageType },
        { icon: CheckSquare, label: '审批', page: 'approvals' as PageType },
        { icon: Wrench, label: '设备', page: 'equipment' as PageType },
        { icon: Handshake, label: '服务', page: 'service' as PageType },
        { icon: FileSignature, label: '合同', page: 'contract' as PageType },
        { icon: Factory, label: '生产', page: 'production' as PageType },
        { icon: Package, label: '库存', page: 'inventory' as PageType },
        { icon: Users, label: '供应商', page: 'supplier' as PageType },
        { icon: BarChart3, label: '分析', page: 'analytics' as PageType },
        { icon: Database, label: '主数据', page: 'masterdata' as PageType },
        { icon: Settings, label: '管理', page: 'admin' as PageType },
        { icon: DollarSign, label: '财务', page: 'financial' as PageType },
      ],
    },
    es: {
      menu: [
        { icon: Home, label: 'Inicio', page: 'home' as PageType },
        { icon: ShoppingBag, label: 'Catálogo Interno', page: 'catalog' as PageType },
        { icon: ExternalLink, label: 'Punch-out', page: 'punchout' as PageType },
        { icon: ClipboardList, label: 'PR & PO', page: 'prpo' as PageType },
        { icon: CheckSquare, label: 'Aprobaciones', page: 'approvals' as PageType },
        { icon: Wrench, label: 'Equipo', page: 'equipment' as PageType },
        { icon: Handshake, label: 'Servicio', page: 'service' as PageType },
        { icon: FileSignature, label: 'Contrato', page: 'contract' as PageType },
        { icon: Factory, label: 'Producción', page: 'production' as PageType },
        { icon: Package, label: 'Inventario', page: 'inventory' as PageType },
        { icon: Users, label: 'Proveedores', page: 'supplier' as PageType },
        { icon: BarChart3, label: 'Analítica', page: 'analytics' as PageType },
        { icon: Database, label: 'Datos Maestros', page: 'masterdata' as PageType },
        { icon: Settings, label: 'Admin', page: 'admin' as PageType },
        { icon: DollarSign, label: 'Financiero', page: 'financial' as PageType },
      ],
    },
  };

  const t = text[language];

  return (
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 border-r border-[#E4E1DD] bg-white overflow-y-auto">
      <nav className="flex flex-col gap-1 p-4">
        {t.menu.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          
          return (
            <button
              key={index}
              onClick={() => navigateTo(item.page)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white shadow-md'
                  : 'text-[#75534B] hover:bg-[#F9F8F6] active:scale-95'
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 500 }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
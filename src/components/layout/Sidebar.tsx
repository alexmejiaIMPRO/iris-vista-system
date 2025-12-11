'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  Package,
  Users,
  BarChart3,
  Settings,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { icon: Home, labelKey: 'home', href: '/' },
  { icon: ShoppingBag, labelKey: 'catalog', href: '/catalog' },
  { icon: ExternalLink, labelKey: 'amazonCatalog', href: '/catalog/amazon' },
  { icon: ClipboardList, labelKey: 'requests', href: '/requests' },
  { icon: CheckSquare, labelKey: 'approvals', href: '/approvals', roles: ['admin', 'general_manager'] },
  { icon: Package, labelKey: 'inventory', href: '/inventory' },
  { icon: BarChart3, labelKey: 'analytics', href: '/analytics', roles: ['admin', 'supply_chain_manager'] },
  { icon: Users, labelKey: 'users', href: '/admin/users', roles: ['admin'] },
  { icon: Settings, labelKey: 'admin', href: '/admin', roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();

  const text = {
    en: {
      home: 'Home',
      catalog: 'Internal Catalog',
      amazonCatalog: 'Amazon Business',
      requests: 'My Requests',
      approvals: 'Approvals',
      inventory: 'Inventory',
      analytics: 'Analytics',
      users: 'Users',
      admin: 'Admin',
    },
    zh: {
      home: '首页',
      catalog: '内部目录',
      amazonCatalog: 'Amazon Business',
      requests: '我的请求',
      approvals: '审批',
      inventory: '库存',
      analytics: '分析',
      users: '用户',
      admin: '管理',
    },
    es: {
      home: 'Inicio',
      catalog: 'Catálogo Interno',
      amazonCatalog: 'Amazon Business',
      requests: 'Mis Solicitudes',
      approvals: 'Aprobaciones',
      inventory: 'Inventario',
      analytics: 'Analítica',
      users: 'Usuarios',
      admin: 'Admin',
    },
  };

  const t = text[language];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Exact match
    if (pathname === href) {
      return true;
    }
    // Check if pathname starts with href + '/'
    // But only if no other menu item is a more specific match
    if (pathname.startsWith(href + '/')) {
      // Check if there's a more specific menu item that matches
      const hasMoreSpecificMatch = filteredMenuItems.some(
        (item) => item.href !== href &&
                  item.href.startsWith(href + '/') &&
                  (pathname === item.href || pathname.startsWith(item.href + '/'))
      );
      return !hasMoreSpecificMatch;
    }
    return false;
  };

  return (
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 border-r border-[#E4E1DD] bg-white overflow-y-auto">
      <nav className="flex flex-col gap-1 p-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = t[item.labelKey as keyof typeof t] || item.labelKey;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white shadow-md'
                  : 'text-[#75534B] hover:bg-[#F9F8F6] active:scale-95'
              }`}
              style={{ fontWeight: 500 }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

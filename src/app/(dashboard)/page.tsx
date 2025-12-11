'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ExternalLink,
  FileText,
  CheckSquare,
  Package,
  Users,
  BarChart3,
  Settings,
  Wrench,
  Handshake,
  FileSignature,
  Factory,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi, approvalsApi } from '@/lib/api';
import type { DashboardStats, ApprovalStats } from '@/types';

export default function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const text = {
    en: {
      welcome: 'Welcome to IRIS VISTA',
      subtitle: 'Your unified workspace for supply chain & procurement management',
      procurementModules: 'Procurement Modules',
      operationalModules: 'Operational Modules',
      dashboardWidgets: 'Quick Overview',
      pendingApprovals: 'Pending Approvals',
      pendingCount: 'items awaiting review',
      recentRequests: 'Recent Requests',
      requestsCount: 'active requests',
      spendOverview: 'Spend Overview',
      spendAmount: 'this month',
      modules: {
        procurement: [
          {
            icon: Wrench,
            title: 'Equipment Procurement',
            subtitle: 'Equipment Lifecycle',
            description: 'Full equipment purchase & maintenance workflow',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: Handshake,
            title: 'Service Procurement',
            subtitle: 'Service Requests',
            description: 'Consulting, cleaning, legal services, etc.',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: FileSignature,
            title: 'Contract Management',
            subtitle: 'Construction & Engineering',
            description: 'Long-term contracts & milestones',
            color: '#3F8F8F',
            href: '/requests',
          },
          {
            icon: Factory,
            title: 'Production Materials',
            subtitle: 'MRP Integration',
            description: 'SAP MRP-driven material procurement',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: ShoppingBag,
            title: 'Internal Catalog',
            subtitle: 'Internal Shopping Mall',
            description: 'Browse and order from internal inventory',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: ExternalLink,
            title: 'Punch-Out to Amazon',
            subtitle: 'External Procurement',
            description: 'Access Amazon Business with AI price comparison',
            color: '#3F8F8F',
            href: '/catalog/amazon',
          },
          {
            icon: FileText,
            title: 'PR & PO Management',
            subtitle: 'Request Tracking',
            description: 'View and manage purchase requests & orders',
            color: '#75534B',
            href: '/requests',
          },
        ],
        operational: [
          {
            icon: Package,
            title: 'Inventory Snapshot',
            subtitle: 'Stock Overview',
            description: 'Real-time inventory & turnover analytics',
            color: '#3A6EA5',
            href: '/inventory',
          },
          {
            icon: Users,
            title: 'Supplier Lifecycle',
            subtitle: 'Vendor Management',
            description: 'Registration, onboarding & performance',
            color: '#75534B',
            href: '/admin',
          },
          {
            icon: BarChart3,
            title: 'Analytics & AI Reports',
            subtitle: 'Insights Dashboard',
            description: 'Spend analysis & AI-driven insights',
            color: '#3F8F8F',
            href: '/analytics',
          },
          {
            icon: Settings,
            title: 'Admin Console',
            subtitle: 'System Configuration',
            description: 'Users, workflows, and settings',
            color: '#5D423C',
            href: '/admin',
          },
        ],
      },
    },
    zh: {
      welcome: '欢迎来到 IRIS VISTA',
      subtitle: '您的供应链与采购管理统一工作区',
      procurementModules: '采购模块',
      operationalModules: '运营模块',
      dashboardWidgets: '快速概览',
      pendingApprovals: '待处理审批',
      pendingCount: '项待审核',
      recentRequests: '最近请求',
      requestsCount: '个活动请求',
      spendOverview: '支出概览',
      spendAmount: '本月',
      modules: {
        procurement: [
          {
            icon: Wrench,
            title: '设备采购',
            subtitle: '设备生命周期',
            description: '完整的设备采购与维护工作流',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: Handshake,
            title: '服务采购',
            subtitle: '服务请求',
            description: '咨询、清洁、法律服务等',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: FileSignature,
            title: '合同管理',
            subtitle: '建设与工程',
            description: '长期合同与里程碑管理',
            color: '#3F8F8F',
            href: '/requests',
          },
          {
            icon: Factory,
            title: '生产物料',
            subtitle: 'MRP 集成',
            description: 'SAP MRP 驱动的物料采购',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: ShoppingBag,
            title: '内部目录',
            subtitle: '内部购物商城',
            description: '浏览并订购内部库存',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: ExternalLink,
            title: 'Punch-Out 到亚马逊',
            subtitle: '外部采购',
            description: '访问亚马逊商业与 AI 价格比较',
            color: '#3F8F8F',
            href: '/catalog/amazon',
          },
          {
            icon: FileText,
            title: 'PR & PO 管理',
            subtitle: '请求跟踪',
            description: '查看和管理采购请求与订单',
            color: '#75534B',
            href: '/requests',
          },
        ],
        operational: [
          {
            icon: Package,
            title: '库存快照',
            subtitle: '库存概览',
            description: '实时库存与周转率分析',
            color: '#3A6EA5',
            href: '/inventory',
          },
          {
            icon: Users,
            title: '供应商生命周期',
            subtitle: '供应商管理',
            description: '注册、入职与绩效管理',
            color: '#75534B',
            href: '/admin',
          },
          {
            icon: BarChart3,
            title: '分析与 AI 报告',
            subtitle: '洞察仪表板',
            description: '支出分析与 AI 驱动的洞察',
            color: '#3F8F8F',
            href: '/analytics',
          },
          {
            icon: Settings,
            title: '管理控制台',
            subtitle: '系统配置',
            description: '用户、工作流和设置',
            color: '#5D423C',
            href: '/admin',
          },
        ],
      },
    },
    es: {
      welcome: 'Bienvenido a IRIS VISTA',
      subtitle: 'Su espacio de trabajo unificado para la gestión de cadena de suministro y compras',
      procurementModules: 'Módulos de Compras',
      operationalModules: 'Módulos Operativos',
      dashboardWidgets: 'Resumen Rápido',
      pendingApprovals: 'Aprobaciones Pendientes',
      pendingCount: 'elementos pendientes de revisión',
      recentRequests: 'Solicitudes Recientes',
      requestsCount: 'solicitudes activas',
      spendOverview: 'Resumen de Gastos',
      spendAmount: 'este mes',
      modules: {
        procurement: [
          {
            icon: Wrench,
            title: 'Adquisición de Equipos',
            subtitle: 'Ciclo de Vida de Equipos',
            description: 'Flujo de trabajo completo de compra y mantenimiento de equipos',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: Handshake,
            title: 'Adquisición de Servicios',
            subtitle: 'Solicitudes de Servicios',
            description: 'Consultoría, limpieza, servicios legales, etc.',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: FileSignature,
            title: 'Gestión de Contratos',
            subtitle: 'Construcción e Ingeniería',
            description: 'Contratos a largo plazo y hitos',
            color: '#3F8F8F',
            href: '/requests',
          },
          {
            icon: Factory,
            title: 'Materiales de Producción',
            subtitle: 'Integración MRP',
            description: 'Adquisición de materiales impulsada por SAP MRP',
            color: '#75534B',
            href: '/catalog',
          },
          {
            icon: ShoppingBag,
            title: 'Catálogo Interno',
            subtitle: 'Tienda de Compras Interna',
            description: 'Navegar y ordenar desde el inventario interno',
            color: '#3A6EA5',
            href: '/catalog',
          },
          {
            icon: ExternalLink,
            title: 'Punch-Out a Amazon',
            subtitle: 'Adquisición Externa',
            description: 'Acceder a Amazon Business con comparación de precios de IA',
            color: '#3F8F8F',
            href: '/catalog/amazon',
          },
          {
            icon: FileText,
            title: 'Gestión de PR y PO',
            subtitle: 'Seguimiento de Solicitudes',
            description: 'Ver y gestionar solicitudes y pedidos de compra',
            color: '#75534B',
            href: '/requests',
          },
        ],
        operational: [
          {
            icon: Package,
            title: 'Instantánea de Inventario',
            subtitle: 'Resumen de Stock',
            description: 'Análisis de inventario y rotación en tiempo real',
            color: '#3A6EA5',
            href: '/inventory',
          },
          {
            icon: Users,
            title: 'Ciclo de Vida de Proveedores',
            subtitle: 'Gestión de Proveedores',
            description: 'Registro, incorporación y rendimiento',
            color: '#75534B',
            href: '/admin',
          },
          {
            icon: BarChart3,
            title: 'Análisis y Reportes de IA',
            subtitle: 'Tablero de Insights',
            description: 'Análisis de gastos e insights impulsados por IA',
            color: '#3F8F8F',
            href: '/analytics',
          },
          {
            icon: Settings,
            title: 'Consola de Administración',
            subtitle: 'Configuración del Sistema',
            description: 'Usuarios, flujos de trabajo y configuraciones',
            color: '#5D423C',
            href: '/admin',
          },
        ],
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'admin') {
          const stats = await adminApi.getDashboardStats();
          setDashboardStats(stats);
        }
        if (user?.role === 'admin' || user?.role === 'general_manager') {
          const stats = await approvalsApi.getStats();
          setApprovalStats(stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#75534B] via-[#8A6056] to-[#5D423C] px-8 py-16">
        {/* Decorative geometric shapes */}
        <div className="absolute top-10 right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-10 left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="mb-3 text-5xl text-white" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            {t.welcome}
          </h1>
          <p className="text-xl text-white/90" style={{ fontWeight: 400 }}>
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Dashboard Widgets */}
      <section className="px-8 py-8 bg-[#F9F8F6]">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
            {t.dashboardWidgets}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD] transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E1A948]/20 to-[#E1A948]/10">
                  <CheckSquare className="h-6 w-6 text-[#E1A948]" />
                </div>
                <div>
                  <h3 className="text-sm text-[#6E6B67]">{t.pendingApprovals}</h3>
                  <p className="text-lg text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                    {approvalStats?.pending || dashboardStats?.pending_approvals || 0} {t.pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD] transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3A6EA5]/20 to-[#3A6EA5]/10">
                  <Clock className="h-6 w-6 text-[#3A6EA5]" />
                </div>
                <div>
                  <h3 className="text-sm text-[#6E6B67]">{t.recentRequests}</h3>
                  <p className="text-lg text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                    {dashboardStats?.total_requests || approvalStats?.total || 0} {t.requestsCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD] transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#4BAF7E]/20 to-[#4BAF7E]/10">
                  <TrendingUp className="h-6 w-6 text-[#4BAF7E]" />
                </div>
                <div>
                  <h3 className="text-sm text-[#6E6B67]">{t.spendOverview}</h3>
                  <p className="text-lg text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                    ${dashboardStats ? (dashboardStats.total_requests * 250).toLocaleString() : '0'} {t.spendAmount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Procurement Modules */}
      <section className="px-8 py-8 bg-[#F9F8F6]">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
            {t.procurementModules}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {t.modules.procurement.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link
                  key={index}
                  href={module.href}
                  className="group relative flex flex-col gap-4 rounded-xl bg-white p-6 text-left shadow-sm border border-[#E4E1DD] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                >
                  <div className="relative">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${module.color}25, ${module.color}10)`,
                      }}
                    >
                      <Icon
                        className="h-7 w-7 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: module.color }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <h3
                      className="mb-1 text-[#2C2C2C] transition-colors duration-200 group-hover:text-[#75534B]"
                      style={{ fontWeight: 600 }}
                    >
                      {module.title}
                    </h3>
                    <p
                      className="mb-2 text-sm transition-colors duration-200"
                      style={{
                        fontWeight: 500,
                        color: module.color,
                      }}
                    >
                      {module.subtitle}
                    </p>
                    <p className="text-sm text-[#6E6B67]">{module.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operational Modules */}
      <section className="px-8 py-8 pb-12 bg-[#F9F8F6]">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
            {t.operationalModules}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.modules.operational.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link
                  key={index}
                  href={module.href}
                  className="group relative flex flex-col gap-4 rounded-xl bg-white p-6 text-left shadow-sm border border-[#E4E1DD] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                >
                  <div className="relative">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${module.color}25, ${module.color}10)`,
                      }}
                    >
                      <Icon
                        className="h-7 w-7 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: module.color }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <h3
                      className="mb-1 text-[#2C2C2C] transition-colors duration-200 group-hover:text-[#75534B]"
                      style={{ fontWeight: 600 }}
                    >
                      {module.title}
                    </h3>
                    <p
                      className="mb-2 text-sm transition-colors duration-200"
                      style={{
                        fontWeight: 500,
                        color: module.color,
                      }}
                    >
                      {module.subtitle}
                    </p>
                    <p className="text-sm text-[#6E6B67]">{module.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type PageType = 'home' | 'catalog' | 'cart' | 'punchout' | 'equipment' | 'service' | 'contract' | 'production' | 'inventory' | 'supplier' | 'analytics' | 'admin' | 'masterdata' | 'prpo' | 'approvals' | 'financial';

interface LayoutProps {
  children: ReactNode;
  language: 'en' | 'zh' | 'es';
  setLanguage: (lang: 'en' | 'zh' | 'es') => void;
  cartItemCount: number;
  currentPage: PageType;
  navigateTo: (page: PageType) => void;
}

export function Layout({ children, language, setLanguage, cartItemCount, currentPage, navigateTo }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Header 
        language={language} 
        setLanguage={setLanguage}
        cartItemCount={cartItemCount}
        navigateTo={navigateTo}
      />
      <div className="flex">
        <Sidebar language={language} currentPage={currentPage} navigateTo={navigateTo} />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
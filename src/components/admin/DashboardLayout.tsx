import { Button } from '@/components/ui/button';
import { LogOut, FolderOpen, DollarSign, Home, Globe, Menu, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
}

const mainSections = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'portfolio', label: 'Portfólio', icon: FolderOpen },
  { id: 'services', label: 'Orçamentos', icon: DollarSign },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

const DashboardLayout = ({ children, currentSection, onSectionChange, onSignOut }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  const NavigationContent = () => (
    <nav className="p-4 space-y-2">
      {mainSections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              currentSection === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <NavigationContent />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-xl md:text-2xl font-bold">Painel Admin</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" size={isMobile ? "icon" : "default"}>
                <Globe className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Ver Site</span>}
              </Button>
            </Link>
            <Button variant="outline" size={isMobile ? "icon" : "default"} onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
              {!isMobile && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 min-h-[calc(100vh-73px)] border-r bg-card/50 sticky top-[73px]">
            <NavigationContent />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

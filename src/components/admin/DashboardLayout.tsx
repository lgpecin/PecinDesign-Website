import { Home, FolderOpen, Users, Layers, Globe, LogOut, Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export type AdminSection = "home" | "projects" | "clients" | "library";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onSignOut: () => void;
}

const navItems: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "projects", label: "Projetos", icon: FolderOpen },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "library", label: "Templates & Custos", icon: Layers },
];

const DashboardLayout = ({
  children,
  currentSection,
  onSectionChange,
  onSignOut,
}: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (id: AdminSection) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const SidebarBody = () => (
    <div className="flex flex-col h-full justify-between px-4 py-6 text-[#F4F7F5]">
      <div className="space-y-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleSelect("home")}
          className="flex items-center gap-3 px-2 text-left cursor-pointer group"
        >
          <img
            src={logo}
            alt="Pecin Design"
            className="h-8 w-auto object-contain select-none"
          />
          <span className="font-boldonse text-[10px] tracking-[0.16em] text-[#CCFF00] uppercase pt-0.5">
            Estúdio
          </span>
        </button>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "studio-press w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium cursor-pointer text-left",
                  isActive
                    ? "bg-[#1C231F] text-white font-semibold"
                    : "text-[#8FA399] hover:text-white hover:bg-[#171C19]"
                )}
              >
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0",
                    isActive ? "text-[#00E57A]" : "text-[#7A8C83]"
                  )}
                  strokeWidth={1.6}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E57A] shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="space-y-1 pt-6 border-t border-[#1F2723]">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="studio-press w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#8FA399] hover:text-white hover:bg-[#171C19]"
        >
          <Globe className="w-[17px] h-[17px] text-[#7A8C83]" strokeWidth={1.6} />
          <span>Ver site</span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="studio-press w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#8FA399] hover:text-[#FF7B7B] hover:bg-[#1E1717] cursor-pointer text-left"
        >
          <LogOut className="w-[17px] h-[17px]" strokeWidth={1.6} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="studio-shell min-h-[100dvh] bg-[#111412] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      {isMobile && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#111412] border-b border-[#1F2723] text-white">
          <button
            type="button"
            onClick={() => handleSelect("home")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <img src={logo} alt="Pecin Design" className="h-7 w-auto" />
            <span className="font-boldonse text-[10px] tracking-[0.16em] text-[#CCFF00] uppercase">
              Estúdio
            </span>
          </button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="studio-press p-2 rounded-xl bg-[#1C231F] text-white"
              >
                <Menu className="w-5 h-5" strokeWidth={1.7} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-64 bg-[#111412] border-r border-[#1F2723] text-white"
            >
              <SidebarBody />
            </SheetContent>
          </Sheet>
        </header>
      )}

      {/* Desktop Fixed Sidebar */}
      {!isMobile && (
        <aside className="w-[236px] shrink-0 sticky top-0 h-[100dvh] bg-[#111412]">
          <SidebarBody />
        </aside>
      )}

      {/* Light Studio Canvas */}
      <main className="flex-1 bg-[#F6F6F2] text-[#111412] md:rounded-l-[24px] min-h-[100dvh] overflow-x-hidden">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

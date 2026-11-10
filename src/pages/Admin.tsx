import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import "@/components/admin/admin.css";
import DashboardLayout, { type AdminSection } from "@/components/admin/DashboardLayout";
import DashboardHome from "@/components/admin/DashboardHome";
import ProjectsSection from "@/components/admin/ProjectsSection";
import ClientsList from "@/components/admin/budgets/ClientsList";
import ClientServicesView from "@/components/admin/budgets/ClientServicesView";
import LibrarySection from "@/components/admin/LibrarySection";
import type { BudgetClient } from "@/components/admin/budgets/types";

const Admin = () => {
  const [currentSection, setCurrentSection] = useState<AdminSection>("home");
  const [activeClient, setActiveClient] = useState<BudgetClient | null>(null);
  const [clientTab, setClientTab] = useState<"budgets" | "briefings" | "board">("budgets");
  const [quickNewProject, setQuickNewProject] = useState(false);
  const [quickNewClient, setQuickNewClient] = useState(false);

  const { isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("studio-theme");
    return () => document.body.classList.remove("studio-theme");
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSectionChange = (section: AdminSection) => {
    setCurrentSection(section);
    if (section !== "clients") {
      setActiveClient(null);
    }
    setQuickNewProject(false);
    setQuickNewClient(false);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderSection = () => {
    switch (currentSection) {
      case "home":
        return (
          <DashboardHome
            onNavigate={handleSectionChange}
            onQuickNewProject={() => {
              setQuickNewProject(true);
              setCurrentSection("projects");
            }}
            onQuickNewClient={() => {
              setActiveClient(null);
              setQuickNewClient(true);
              setCurrentSection("clients");
            }}
            onOpenClient={(client, initialTab = "budgets") => {
              setActiveClient(client);
              setClientTab(initialTab);
              setCurrentSection("clients");
            }}
          />
        );
      case "projects":
        return (
          <ProjectsSection
            initialNewProject={quickNewProject}
            onClearInitialNew={() => setQuickNewProject(false)}
          />
        );
      case "clients":
        return activeClient ? (
          <ClientServicesView
            key={`${activeClient.id}-${clientTab}`}
            client={activeClient}
            initialTab={clientTab}
            onBack={() => setActiveClient(null)}
          />
        ) : (
          <ClientsList
            onOpenClient={(client) => {
              setClientTab("budgets");
              setActiveClient(client);
            }}
            initialNewOpen={quickNewClient}
            onClearInitialNew={() => setQuickNewClient(false)}
          />
        );
      case "library":
        return <LibrarySection />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      currentSection={currentSection}
      onSectionChange={handleSectionChange}
      onSignOut={handleSignOut}
    >
      {renderSection()}
    </DashboardLayout>
  );
};

export default Admin;

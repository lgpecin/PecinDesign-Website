import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/admin/DashboardLayout';
import DashboardHome from '@/components/admin/DashboardHome';
import ProjectList from '@/components/admin/ProjectList';
import ProjectForm from '@/components/admin/ProjectForm';

import ServicesSection from '@/components/admin/ServicesSection';
import UsersSection from '@/components/admin/UsersSection';
import SettingsSection from '@/components/admin/SettingsSection';
import NotificationPanel from '@/components/admin/NotificationPanel';
import DataExportImport from '@/components/admin/DataExportImport';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Admin = () => {
  const [currentSection, setCurrentSection] = useState('home');
  const [showForm, setShowForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEdit = (projectId: string) => {
    setEditingProjectId(projectId);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProjectId(undefined);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProjectId(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return <DashboardHome onNavigate={setCurrentSection} />;
      case 'portfolio':
        return showForm ? (
          <ProjectForm
            projectId={editingProjectId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-6">
            <NotificationPanel />
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Portfólio</h2>
              <div className="flex gap-2">
                <DataExportImport 
                  tableName="projects" 
                  buttonLabel="Projetos"
                  onImportSuccess={() => setRefreshKey(prev => prev + 1)}
                />
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </div>
            </div>
            <ProjectList onEdit={handleEdit} refresh={refreshKey} />
          </div>
        );
      case 'services':
        return <ServicesSection />;
      case 'users':
        return <UsersSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      currentSection={currentSection}
      onSectionChange={(section) => {
        setCurrentSection(section);
        setShowForm(false);
        setEditingProjectId(undefined);
      }}
      onSignOut={handleSignOut}
    >
      {renderSection()}
    </DashboardLayout>
  );
};

export default Admin;

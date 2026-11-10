import { useState } from "react";
import { Plus, FolderOpen, Images } from "lucide-react";
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";
import CarouselManager from "./CarouselManager";
import DataExportImport from "./DataExportImport";

interface ProjectsSectionProps {
  initialNewProject?: boolean;
  onClearInitialNew?: () => void;
}

const ProjectsSection = ({
  initialNewProject = false,
  onClearInitialNew,
}: ProjectsSectionProps) => {
  const [tab, setTab] = useState<"portfolio" | "carousel">("portfolio");
  const [showForm, setShowForm] = useState(initialNewProject);
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (projectId: string) => {
    setEditingProjectId(projectId);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProjectId(undefined);
    setRefreshKey((prev) => prev + 1);
    onClearInitialNew?.();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProjectId(undefined);
    onClearInitialNew?.();
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <ProjectForm
          projectId={editingProjectId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111412]">
            Projetos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Tabs: Portfólio | Carrossel */}
          <div className="inline-flex items-center bg-[#EBECE6] p-1 rounded-full border border-[#E2E4DC]">
            <button
              type="button"
              onClick={() => setTab("portfolio")}
              className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                tab === "portfolio"
                  ? "bg-[#111412] text-white"
                  : "text-[#5E6862] hover:text-[#111412]"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.7} />
              Portfólio
            </button>
            <button
              type="button"
              onClick={() => setTab("carousel")}
              className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                tab === "carousel"
                  ? "bg-[#111412] text-white"
                  : "text-[#5E6862] hover:text-[#111412]"
              }`}
            >
              <Images className="w-3.5 h-3.5" strokeWidth={1.7} />
              Carrossel
            </button>
          </div>

          {tab === "portfolio" && (
            <>
              <DataExportImport
                tableName="projects"
                buttonLabel="Projetos"
                onImportSuccess={() => setRefreshKey((prev) => prev + 1)}
              />
              <button
                type="button"
                onClick={() => {
                  setEditingProjectId(undefined);
                  setShowForm(true);
                }}
                className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo projeto
              </button>
            </>
          )}
        </div>
      </div>

      {tab === "portfolio" ? (
        <ProjectList onEdit={handleEdit} refresh={refreshKey} />
      ) : (
        <CarouselManager />
      )}
    </div>
  );
};

export default ProjectsSection;

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, GripVertical, Search, ImageOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  banner_image: string | null;
  year: number;
  display_order: number;
}

interface ProjectListProps {
  onEdit: (projectId: string) => void;
  refresh: number;
}

const ProjectList = ({ onEdit, refresh }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, [refresh]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading projects:", error);
      toast({
        title: "Erro ao carregar projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
    return ["all", ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [projects, search, selectedCategory]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Projeto excluído" });
      loadProjects();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error deleting project:", error);
      toast({
        title: "Erro ao excluir projeto",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedItem(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = projects.findIndex((p) => p.id === draggedItem);
    const targetIndex = projects.findIndex((p) => p.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    setProjects(newProjects);
    setDraggedItem(null);

    try {
      await Promise.all(
        newProjects.map((project, index) =>
          supabase.from("projects").update({ display_order: index }).eq("id", project.id)
        )
      );
      toast({ title: "Ordem atualizada" });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error updating order:", error);
      toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      loadProjects();
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-white border border-[#E5E7E2] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & Category Filter */}
      {projects.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#8FA399] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projeto..."
              className="w-full rounded-full bg-white border border-[#E5E7E2] focus:border-[#111412] pl-9 pr-4 py-2 text-sm text-[#111412] placeholder:text-[#8FA399] outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`studio-press px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[#111412] text-white border-[#111412]"
                    : "bg-white text-[#5E6862] border-[#E5E7E2] hover:text-[#111412]"
                }`}
              >
                {cat === "all" ? "Todos" : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D6D9D2] bg-white py-14 px-6 text-center text-sm text-[#5E6862]">
          {projects.length === 0
            ? "Nenhum projeto cadastrado ainda."
            : "Nenhum projeto encontrado para esse filtro."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const canDrag = selectedCategory === "all" && !search.trim();
            return (
              <div
                key={project.id}
                draggable={canDrag}
                onDragStart={(e) => canDrag && handleDragStart(e, project.id)}
                onDragOver={canDrag ? handleDragOver : undefined}
                onDrop={(e) => canDrag && handleDrop(e, project.id)}
                className={`group rounded-2xl bg-white border border-[#E5E7E2] hover:border-[#C5CBC2] overflow-hidden flex flex-col justify-between transition-colors ${
                  draggedItem === project.id ? "opacity-50" : ""
                }`}
              >
                <div>
                  <div className="relative aspect-[16/10] bg-[#F2F3EE] overflow-hidden">
                    {project.banner_image ? (
                      <img
                        src={project.banner_image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8FA399]">
                        <ImageOff className="w-6 h-6" />
                      </div>
                    )}

                    {canDrag && (
                      <div
                        title="Arraste para reordenar"
                        className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm border border-[#E5E7E2] rounded-lg p-1 cursor-grab active:cursor-grabbing text-[#5E6862]"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}

                    <span className="absolute top-2.5 right-2.5 bg-white/95 text-[#111412] text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#E5E7E2] studio-nums">
                      {project.year}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#00A859] block">
                      {project.category}
                    </span>
                    <h3 className="text-base font-semibold text-[#111412] truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#5E6862] line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-[#F0F1EC] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(project.id)}
                    className="studio-press flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" strokeWidth={1.7} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(project.id)}
                    aria-label="Excluir projeto"
                    className="studio-press p-2 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectList;

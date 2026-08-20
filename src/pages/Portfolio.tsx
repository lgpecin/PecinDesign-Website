import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingAdminButton from "@/components/FloatingAdminButton";
import Lightbox from "@/components/Lightbox";
import ProjectCard from "@/components/ProjectCard";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import placeholderProject from "@/assets/placeholder-project.jpg";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

// Vector SVG assets
import vectorFlower from "@/assets/redesign/Vector.svg";
import vectorAsterisk from "@/assets/redesign/Vector-1.svg";

interface ProjectMedia {
  url: string;
  type: 'image' | 'video' | 'grid';
  metadata?: any;
  gridData?: { backgroundColor: string; images: string[]; columns?: number };
}

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  bannerImage: string;
  bannerType: 'image' | 'video';
  detailMedia: ProjectMedia[];
  description: string;
  fullDescription: string;
  technologies: string[];
  year: string;
  imageSpacing: number;
  hideBanner?: boolean;
  notes?: string;
}

const Portfolio = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; projectIndex: number; mediaIndex: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__");
  const [scrollY, setScrollY] = useState(0);
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["all_projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select(`
          *,
          project_images (image_url, display_order, file_type, metadata),
          project_technologies (technology)
        `).order('display_order', { ascending: true });
      if (error) throw error;
      const formattedProjects: Project[] = (data || []).map((project: any) => {
        const sortedMedia = project.project_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
        return {
          id: project.id,
          title: project.title,
          category: project.category,
          image: project.banner_image || placeholderProject,
          bannerImage: project.banner_image || placeholderProject,
          bannerType: 'image' as 'image' | 'video',
          detailMedia: sortedMedia.map((img: any) => {
            const ft = img.file_type || 'image';
            if (ft === 'grid') {
              const meta = img.metadata as any;
              return {
                url: 'grid',
                type: 'grid' as const,
                gridData: {
                  backgroundColor: meta?.backgroundColor || '#000000',
                  images: meta?.images || [],
                  columns: meta?.columns || 3,
                },
              };
            }
            return {
              url: img.image_url,
              type: ft as 'image' | 'video',
              metadata: img.metadata,
            };
          }),
          description: project.description,
          fullDescription: project.full_description,
          technologies: project.project_technologies?.map((t: any) => t.technology) || [],
          year: (project.year ?? "").toString(),
          imageSpacing: project.image_spacing ?? 16,
          hideBanner: project.hide_banner ?? false,
          notes: project.notes ?? undefined
        };
      });
      return formattedProjects;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleProjectClick = async (proj: Project, originalIndex: number) => {
    setLoadingProjectId(proj.id);
    const urls: string[] = [];
    if (proj.bannerImage) urls.push(proj.bannerImage);
    if (proj.detailMedia) {
      proj.detailMedia.forEach(m => {
        if (m.type === 'image' && m.url && m.url !== 'grid') urls.push(m.url);
        if (m.gridData?.images) urls.push(...m.gridData.images);
      });
    }

    const promises = urls.map(url => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => resolve(url);
      });
    });

    const timeout = new Promise(resolve => setTimeout(resolve, 1500));
    await Promise.race([Promise.all(promises), timeout]);

    setLoadingProjectId(null);
    setSelectedProject(originalIndex);
  };

  const project = selectedProject !== null ? projects[selectedProject] : null;
  const categories = ["__all__", ...Array.from(new Set(projects.map(p => p.category)))];
  const filteredProjects = selectedCategory === "__all__" ? projects : projects.filter(p => p.category === selectedCategory);

  const handleLightboxPrevious = () => {
    if (!lightboxImage) return;
    const currentProject = projects[lightboxImage.projectIndex];
    const images = currentProject.detailMedia.filter(m => m.type === 'image');
    const currentImageIndex = images.findIndex(m => m.url === lightboxImage.src);
    if (currentImageIndex > 0) {
      const prevImage = images[currentImageIndex - 1];
      setLightboxImage({ src: prevImage.url, alt: `${currentProject.title} - ${t("projects.detail")} ${currentImageIndex}`, projectIndex: lightboxImage.projectIndex, mediaIndex: currentImageIndex - 1 });
    }
  };

  const handleLightboxNext = () => {
    if (!lightboxImage) return;
    const currentProject = projects[lightboxImage.projectIndex];
    const images = currentProject.detailMedia.filter(m => m.type === 'image');
    const currentImageIndex = images.findIndex(m => m.url === lightboxImage.src);
    if (currentImageIndex < images.length - 1) {
      const nextImage = images[currentImageIndex + 1];
      setLightboxImage({ src: nextImage.url, alt: `${currentProject.title} - ${t("projects.detail")} ${currentImageIndex + 2}`, projectIndex: lightboxImage.projectIndex, mediaIndex: currentImageIndex + 1 });
    }
  };

  const getLightboxNavigationInfo = () => {
    if (!lightboxImage) return { hasPrevious: false, hasNext: false };
    const currentProject = projects[lightboxImage.projectIndex];
    const images = currentProject.detailMedia.filter(m => m.type === 'image');
    const currentImageIndex = images.findIndex(m => m.url === lightboxImage.src);
    return { hasPrevious: currentImageIndex > 0, hasNext: currentImageIndex < images.length - 1 };
  };

  return (
    <div className="min-h-screen bg-[#0a0c0e] text-white">
      <header>
        <Navigation />
        {isAdmin && <FloatingAdminButton />}
      </header>

      <main className="pt-28 sm:pt-36 pb-20 relative overflow-hidden">
        <div
          className="hidden sm:block absolute -right-12 sm:-right-20 md:-right-24 top-10 sm:top-24 w-40 sm:w-64 md:w-80 h-auto text-white pointer-events-none z-0 transition-transform duration-75 will-change-transform opacity-95 drop-shadow-[0_0_30px_rgba(255,255,255,0.18)]"
          style={{
            transform: `rotate(${scrollY * 0.05}deg)`,
          }}
        >
          <img src={vectorFlower} alt="" className="w-full h-auto" />
        </div>

        <div
          className="hidden sm:block absolute -left-12 sm:-left-20 md:-left-24 bottom-32 sm:bottom-48 w-40 sm:w-60 md:w-72 h-auto text-white pointer-events-none z-0 transition-transform duration-75 will-change-transform opacity-95 drop-shadow-[0_0_30px_rgba(255,255,255,0.18)]"
          style={{
            transform: `rotate(${-scrollY * 0.05}deg)`,
          }}
        >
          <img src={vectorAsterisk} alt="" className="w-full h-auto" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="mb-6 sm:mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95 border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("nav.back_home")}
            </Link>
          </div>

          <div className="text-center mb-10 sm:mb-14">
            <h1 className="font-boldonse text-5xl sm:text-7xl md:text-8xl text-[#ccff00] mb-6 tracking-wider">
              {t("projects.title").toUpperCase()}
            </h1>

            <div className="inline-flex flex-wrap justify-center items-center bg-white rounded-full p-1.5 shadow-xl max-w-2xl mx-auto border border-white/20 mb-8 sm:mb-12">
              {categories.map((category) => {
                const label = category === "__all__" ? t("projects.filter_all") : category;
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                      isSelected
                        ? "bg-[#ccff00] text-black shadow-sm"
                        : "text-neutral-700 hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 text-[#ccff00] animate-spin" />
              <p className="text-sm font-medium">{t("projects.loading")}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">{t("projects.empty")}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4">
              {filteredProjects.map((proj, index) => {
                const originalIndex = projects.findIndex(p => p.id === proj.id);
                return (
                  <AnimatedSection key={proj.id} index={index}>
                    <ProjectCard
                      {...proj}
                      isLoading={loadingProjectId === proj.id}
                      onClick={() => handleProjectClick(proj, originalIndex)}
                    />
                  </AnimatedSection>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-[#141517] text-white border-white/10">
          {project && (
            <div className="space-y-12">
              <div>
                <DialogTitle className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-boldonse tracking-tight text-white">
                  {project.title}
                </DialogTitle>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-block px-4 py-1.5 bg-[#ccff00] text-black font-bold rounded-full text-xs sm:text-sm">{project.category}</span>
                  <span className="inline-block px-4 py-1.5 bg-white/10 text-white rounded-full text-xs sm:text-sm font-medium">{project.year}</span>
                </div>
              </div>

              {!project.hideBanner && (
                <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
                  {project.bannerType === 'video' ? (
                    <video src={project.bannerImage} controls className="w-full h-auto" style={{ maxWidth: '1920px', margin: '0 auto', display: 'block' }} preload="metadata" />
                  ) : (
                    <img src={project.bannerImage} alt={`${project.title} - Banner`} className="w-full h-auto" style={{ maxWidth: '1920px', margin: '0 auto', display: 'block' }} loading="eager" decoding="sync" />
                  )}
                </div>
              )}

              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#00ff88]">{t("projects.about_project")}</h2>
                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">{project.fullDescription}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: `${project.imageSpacing}px` }}>
                {project.detailMedia.map((media, index) => {
                  if (media.type === 'grid' && media.gridData) {
                    const cols = media.gridData.columns || 3;
                    return (
                      <div
                        key={index}
                        className="w-full overflow-hidden shadow-xl"
                        style={{
                          backgroundColor: media.gridData.backgroundColor,
                          borderRadius: project.imageSpacing === 0 ? '0' : '1rem',
                          display: 'grid',
                          gridTemplateColumns: `repeat(${cols}, 1fr)`,
                          gap: '4px',
                          padding: '4px',
                        }}
                      >
                        {media.gridData.images.map((imgUrl, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={imgUrl}
                            alt={`${project.title} - Grid ${index + 1} - ${imgIdx + 1}`}
                            className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage({
                              src: imgUrl,
                              alt: `${project.title} - Grid ${index + 1}`,
                              projectIndex: selectedProject!,
                              mediaIndex: index,
                            })}
                            loading="eager"
                          />
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="relative w-full overflow-hidden shadow-xl" style={{ borderRadius: project.imageSpacing === 0 ? '0' : '1rem' }}>
                      {media.type === 'video' ? (
                        <video src={media.url} controls className="w-full h-auto" style={{ maxWidth: '1920px', margin: '0 auto', display: 'block' }} preload="metadata" />
                      ) : (
                        <img src={media.url} alt={`${project.title} - ${t("projects.detail")} ${index + 1}`} className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity" style={{ maxWidth: '1920px', margin: '0 auto', display: 'block' }} onClick={() => setLightboxImage({ src: media.url, alt: `${project.title} - ${t("projects.detail")} ${index + 1}`, projectIndex: selectedProject!, mediaIndex: index })} loading="eager" decoding="sync" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#00ff88]">{t("projects.software_used")}</h2>
                <div className="flex flex-wrap gap-3">
                  {project.technologies.map(tech => (
                    <span key={tech} className="inline-block px-5 py-2.5 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors">{tech}</span>
                  ))}
                </div>
              </div>

              {project.notes && (
                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#00ff88]">{t("projects.notes")}</h2>
                  <p className="text-base sm:text-lg text-neutral-300 leading-relaxed whitespace-pre-line">{project.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lightboxImage && <Lightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} onPrevious={handleLightboxPrevious} onNext={handleLightboxNext} hasPrevious={getLightboxNavigationInfo().hasPrevious} hasNext={getLightboxNavigationInfo().hasNext} />}

      <FloatingWhatsApp />

      <footer className="py-6 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <img src={logo} alt="Pecin Design - Logo" className="h-8 w-auto hover:scale-110 transition-transform duration-300" loading="lazy" />
            <p className="text-neutral-400 text-sm">{t("footer.rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;

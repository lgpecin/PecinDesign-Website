import { lazy, Suspense, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import logo from "@/assets/logo.png";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ProjectCard from "@/components/ProjectCard";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingAdminButton from "@/components/FloatingAdminButton";
import Lightbox from "@/components/Lightbox";
import { useInView } from "@/hooks/use-in-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import placeholderProject from "@/assets/placeholder-project.jpg";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Vector SVG assets
import vectorFlower from "@/assets/redesign/Vector.svg";
import vectorAsterisk from "@/assets/redesign/Vector-1.svg";

// Lazy loading
const About = lazy(() => import("@/components/About"));
const InfiniteCarousel = lazy(() => import("@/components/InfiniteCarousel"));
const ServiceSteps = lazy(() => import("@/components/ServiceSteps"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Contact = lazy(() => import("@/components/Contact"));

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

const Index = () => {
  const { ref: projectsRef, isInView: projectsInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; projectIndex: number; mediaIndex: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__");
  const [scrollY, setScrollY] = useState(0);
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

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
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select(`
          *,
          project_images (image_url, display_order, file_type, metadata),
          project_technologies (technology)
        `).order('display_order', { ascending: true }).limit(20);
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
          year: project.year.toString(),
          imageSpacing: project.image_spacing ?? 16,
          hideBanner: project.hide_banner ?? false,
          notes: project.notes ?? undefined
        };
      });
      return formattedProjects;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // Preload project images before opening modal dialog
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

    const timeout = new Promise(resolve => setTimeout(resolve, 1200));
    await Promise.race([Promise.all(promises), timeout]);

    setLoadingProjectId(null);
    setSelectedProject(originalIndex);
  };

  const project = selectedProject !== null ? projects[selectedProject] : null;
  const categories = ["__all__", ...Array.from(new Set(projects.map(p => p.category)))];
  const filteredProjects = selectedCategory === "__all__" ? projects : projects.filter(p => p.category === selectedCategory);
  
  // Limite responsivo: 9 no desktop (3x3), 6 no mobile (2x3)
  const maxProjects = isMobile ? 6 : 9;
  const displayedProjects = filteredProjects.slice(0, maxProjects);

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

  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <div className="min-h-screen">
      <header>
        <Navigation />
        {isAdmin && <FloatingAdminButton />}
      </header>
      
      <main>
        <Hero />

        {/* Services Section */}
        <Services />
      
        {/* Portfolio Section */}
        <section id="projects" className="py-16 sm:py-24 relative overflow-hidden" aria-label={t("nav.projects")}>
          {/* Decorative Vector Flower (Topo Direito) com rotação suave no scroll */}
          <div
            className="absolute -right-8 sm:-right-16 top-10 sm:top-20 w-36 sm:w-56 md:w-72 h-auto text-white pointer-events-none z-0 transition-transform duration-75 will-change-transform opacity-95 drop-shadow-[0_0_25px_rgba(255,255,255,0.18)]"
            style={{
              transform: `rotate(${scrollY * 0.05}deg)`,
            }}
          >
            <img src={vectorFlower} alt="" className="w-full h-auto" />
          </div>

          {/* Decorative Vector Asterisk (Baixo Esquerdo) com rotação suave no scroll */}
          <div
            className="absolute -left-8 sm:-left-16 bottom-24 sm:bottom-36 w-32 sm:w-52 md:w-64 h-auto text-white pointer-events-none z-0 transition-transform duration-75 will-change-transform opacity-95 drop-shadow-[0_0_25px_rgba(255,255,255,0.18)]"
            style={{
              transform: `rotate(${-scrollY * 0.05}deg)`,
            }}
          >
            <img src={vectorAsterisk} alt="" className="w-full h-auto" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div ref={projectsRef} className="text-center mb-10 sm:mb-14">
              <h2 className="font-boldonse text-5xl sm:text-7xl md:text-8xl text-[#ccff00] mb-6 tracking-wider">
                PORTFÓLIO
              </h2>
              
              {/* White Pill Category Filters */}
              <div className="inline-flex flex-wrap justify-center items-center bg-white rounded-full p-1.5 shadow-xl max-w-xl mx-auto border border-white/20 mb-8 sm:mb-12">
                {categories.map((category) => {
                  const label = category === "__all__" ? "Todos" : category;
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
              <div className="text-center py-12 text-muted-foreground">{t("projects.loading")}</div>
            ) : displayedProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">{t("projects.empty")}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto px-1 sm:px-4">
                  {displayedProjects.map((proj, index) => {
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

                {/* Botão Conheça meu portfólio completo */}
                <div className="text-center mt-12 sm:mt-16">
                  <Link
                    to="/portfolio"
                    className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-boldonse text-sm sm:text-lg md:text-xl bg-[#ccff00] hover:bg-[#b8e600] text-black shadow-[0_10px_30px_rgba(204,255,0,0.35)] hover:shadow-[0_15px_40px_rgba(204,255,0,0.55)] transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span>Conheça meu portfólio completo</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <Suspense fallback={<div className="py-16" />}>
          <About />
          <ServiceSteps />
          <FAQ />
          <Contact />
        </Suspense>
      </main>

      <FloatingWhatsApp />

      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {project && (
            <div className="space-y-12">
              <div>
                <DialogTitle className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  {project.title}
                </DialogTitle>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-block px-4 py-2 bg-primary/90 text-primary-foreground rounded-full text-sm font-medium">{project.category}</span>
                  <span className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">{project.year}</span>
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("projects.about_project")}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">{project.fullDescription}</p>
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
                            loading="lazy"
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("projects.software_used")}</h2>
                <div className="flex flex-wrap gap-3">
                  {project.technologies.map(tech => (
                    <span key={tech} className="inline-block px-6 py-3 bg-primary/10 text-primary rounded-full text-base font-medium hover:bg-primary/20 transition-colors">{tech}</span>
                  ))}
                </div>
              </div>

              {project.notes && (
                <div className="pt-6 border-t border-border">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("projects.notes")}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{project.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lightboxImage && <Lightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} onPrevious={handleLightboxPrevious} onNext={handleLightboxNext} hasPrevious={getLightboxNavigationInfo().hasPrevious} hasNext={getLightboxNavigationInfo().hasNext} />}
      
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <img src={logo} alt="Pecin Design - Logo" className="h-8 w-auto hover:scale-110 transition-transform duration-300" loading="lazy" />
            <p className="text-muted-foreground text-sm">{t("footer.rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

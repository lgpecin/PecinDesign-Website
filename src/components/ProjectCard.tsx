import { useState } from "react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Loader2 } from "lucide-react";

interface ProjectCardProps {
  title: string;
  category: string;
  image: string;
  description: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const ProjectCard = ({ title, category, image, description, onClick, isLoading }: ProjectCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card 
      onClick={onClick} 
      className="project-card relative group overflow-hidden rounded-2xl border-2 border-transparent shadow-lg cursor-pointer bg-[#141517] active:scale-[0.98] transition-all duration-300 ease-out hover:border-[#ccff00] hover:shadow-[0_0_25px_rgba(204,255,0,0.25)]"
      style={{
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      {/* Loading overlay during image preloading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 text-[#ccff00] animate-spin" />
          <span className="text-white text-xs font-semibold tracking-wider">Carregando...</span>
        </div>
      )}

      <div 
        className="relative aspect-square overflow-hidden rounded-xl m-2 sm:m-3 bg-neutral-900"
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          transform: 'translateZ(0)',
        }}
      >
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-neutral-800" />
        )}
        <img
          src={image}
          alt={`${title} - ${category}`}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
          loading="lazy"
          decoding="async"
          width="600"
          height="600"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-end p-3 sm:p-5 pointer-events-none">
          <div className="text-white">
            <p className="text-[11px] sm:text-xs font-semibold text-[#00ff88] mb-1">{category}</p>
            <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 leading-snug">{description}</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1">
        <span className="text-[10px] sm:text-xs font-bold text-[#00ff88] mb-0.5 sm:mb-1 block tracking-wider uppercase">{category}</span>
        <h3 className="text-xs sm:text-base md:text-lg font-bold text-white leading-snug line-clamp-2">{title}</h3>
      </div>
    </Card>
  );
};

export default ProjectCard;

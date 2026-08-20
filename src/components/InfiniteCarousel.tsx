import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

// Fallback images from assets
import slide1 from "@/assets/carousel/slide-1.png";
import slide2 from "@/assets/carousel/slide-2.png";
import slide3 from "@/assets/carousel/slide-3.png";
import slide4 from "@/assets/carousel/slide-4.png";
import slide5 from "@/assets/carousel/slide-5.png";
import slide6 from "@/assets/carousel/slide-6.png";

const fallbackImages = [slide1, slide2, slide3, slide4, slide5, slide6];

const InfiniteCarousel = () => {
  const [images, setImages] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const { settings } = useSiteSettings();
  const speed = Number(settings.carousel_speed) || 15;

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("carousel_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error || !data || data.length === 0) {
        setImages(fallbackImages);
      } else {
        setImages(data.map((img: CarouselImage) => img.image_url));
      }
    };
    fetchImages();
  }, []);

  // Once images are loaded, measure the width of one set and use px-based animation
  useEffect(() => {
    if (!trackRef.current || images.length === 0) return;

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const oneSetWidth = track.scrollWidth / 3;
      track.style.setProperty("--marquee-distance", `-${oneSetWidth}px`);
    };

    const imgs = trackRef.current.querySelectorAll("img");
    let loaded = 0;
    const total = imgs.length;

    const onLoad = () => {
      loaded++;
      if (loaded >= total) measure();
    };

    imgs.forEach((img) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener("load", onLoad, { once: true });
      }
    });

    if (loaded >= total) measure();

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [images]);

  if (images.length === 0) return null;

  // Triple images for seamless infinite loop
  const duplicated = [...images, ...images, ...images];
  const duration = images.length * speed;

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden py-3 sm:py-6 my-2 sm:my-4">
      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(162 75% 28% / 0.1) 0%, transparent 70%)',
        }}
      />
      <div
        ref={trackRef}
        className="flex carousel-track"
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {duplicated.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Portfolio ${(i % images.length) + 1}`}
            className="h-[180px] sm:h-[320px] md:h-[440px] w-auto flex-shrink-0 object-cover select-none pointer-events-none"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
};

export default InfiniteCarousel;

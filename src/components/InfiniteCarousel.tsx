import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Fallback images from assets (optimized WebP)
import slide1 from "@/assets/carousel/slide-1.webp";
import slide2 from "@/assets/carousel/slide-2.webp";
import slide3 from "@/assets/carousel/slide-3.webp";
import slide4 from "@/assets/carousel/slide-4.webp";
import slide5 from "@/assets/carousel/slide-5.webp";
import slide6 from "@/assets/carousel/slide-6.webp";

interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

const FALLBACK_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6];
const DEFAULT_SPEED = 5;
const HERO_ENTRANCE_MS = 1150;
const FETCH_FALLBACK_TIMEOUT_MS = 1400;
const SAFETY_REVEAL_TIMEOUT_MS = 1800;

const preloadAndDecode = (urls: string[]) => {
  const uniqueUrls = Array.from(new Set(urls));
  return Promise.all(
    uniqueUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          const finish = () => {
            if (typeof img.decode === "function") {
              img.decode().then(resolve, resolve);
            } else {
              resolve();
            }
          };
          img.onload = finish;
          img.onerror = () => resolve();
          img.src = url;
          if (img.complete) finish();
        })
    )
  );
};

const InfiniteCarousel = () => {
  const [images, setImages] = useState<string[] | null>(null);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const [isReady, setIsReady] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let fetchSettled = false;
    const mountTime = performance.now();

    const heroEntrancePromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, HERO_ENTRANCE_MS);
    });

    const safetyTimeoutPromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, SAFETY_REVEAL_TIMEOUT_MS);
    });

    const fetchWithTimeout = new Promise<{ imgs: string[]; spd: number }>((resolve) => {
      const fallbackTimer = window.setTimeout(() => {
        if (!fetchSettled) {
          fetchSettled = true;
          resolve({ imgs: FALLBACK_IMAGES, spd: DEFAULT_SPEED });
        }
      }, FETCH_FALLBACK_TIMEOUT_MS);

      Promise.all([
        supabase
          .from("carousel_images")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "carousel_speed")
          .maybeSingle(),
      ])
        .then(([imagesRes, speedRes]) => {
          window.clearTimeout(fallbackTimer);
          if (fetchSettled || cancelled) return;
          fetchSettled = true;

          const resolvedImages =
            !imagesRes.error && imagesRes.data && imagesRes.data.length > 0
              ? imagesRes.data.map((img: CarouselImage) => img.image_url)
              : FALLBACK_IMAGES;

          const parsedSpeed = Number(speedRes.data?.setting_value);
          const resolvedSpeed =
            !speedRes.error && parsedSpeed > 0 ? parsedSpeed : DEFAULT_SPEED;

          resolve({ imgs: resolvedImages, spd: resolvedSpeed });
        })
        .catch(() => {
          window.clearTimeout(fallbackTimer);
          if (fetchSettled || cancelled) return;
          fetchSettled = true;
          resolve({ imgs: FALLBACK_IMAGES, spd: DEFAULT_SPEED });
        });
    });

    const initCarousel = async () => {
      const { imgs, spd } = await fetchWithTimeout;
      if (cancelled) return;

      setImages(imgs);
      setSpeed(spd);

      // Wait for first set preload/decode (capped by overall safety deadline) and Hero entrance (~1150ms)
      const remainingSafety = Math.max(0, SAFETY_REVEAL_TIMEOUT_MS - (performance.now() - mountTime));
      const decodeGate = Promise.race([
        preloadAndDecode(imgs),
        remainingSafety > 0
          ? new Promise<void>((resolve) => window.setTimeout(resolve, remainingSafety))
          : safetyTimeoutPromise,
      ]);

      await Promise.all([heroEntrancePromise, decodeGate]);
      if (cancelled) return;

      // Defer reveal to next animation frame after DOM commit + width measurement
      window.requestAnimationFrame(() => {
        if (!cancelled) setIsReady(true);
      });
    };

    void initCarousel();

    return () => {
      cancelled = true;
    };
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const oneSetWidth = track.scrollWidth / 3;
    if (oneSetWidth > 0) {
      track.style.setProperty("--marquee-distance", `-${oneSetWidth}px`);
    }
  }, []);

  useLayoutEffect(() => {
    if (!images || images.length === 0) return;
    measure();
  }, [images, isReady, measure]);

  // Keep --marquee-distance accurate after all <img> elements settle or on viewport resize
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !images || images.length === 0) return;

    const imgs = Array.from(track.querySelectorAll("img"));
    let settled = 0;
    const total = imgs.length;

    const onImgSettled = () => {
      settled++;
      if (settled >= total) measure();
    };

    const pendingImgs: HTMLImageElement[] = [];
    imgs.forEach((img) => {
      if (img.complete) {
        settled++;
      } else {
        pendingImgs.push(img);
        img.addEventListener("load", onImgSettled, { once: true });
        img.addEventListener("error", onImgSettled, { once: true });
      }
    });

    if (settled >= total) measure();

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      pendingImgs.forEach((img) => {
        img.removeEventListener("load", onImgSettled);
        img.removeEventListener("error", onImgSettled);
      });
    };
  }, [images, measure]);

  const activeImages = images ?? [];
  const duplicated = activeImages.length > 0 ? [...activeImages, ...activeImages, ...activeImages] : [];
  const duration = Math.max(activeImages.length, 1) * speed;

  return (
    <div
      className={`relative w-screen left-1/2 -translate-x-1/2 overflow-hidden py-3 sm:py-6 my-2 sm:my-4 min-h-[204px] sm:min-h-[368px] md:min-h-[488px] transition-[opacity,transform] duration-700 ease-carousel-reveal ${
        isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(162 75% 28% / 0.1) 0%, transparent 70%)",
        }}
      />
      <div
        ref={trackRef}
        className={`flex w-max min-h-[180px] sm:min-h-[320px] md:min-h-[440px] ${
          isReady ? "carousel-track" : ""
        }`}
        style={isReady ? { animationDuration: `${duration}s` } : undefined}
      >
        {duplicated.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`Portfolio ${(i % activeImages.length) + 1}`}
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

export default memo(InfiniteCarousel);

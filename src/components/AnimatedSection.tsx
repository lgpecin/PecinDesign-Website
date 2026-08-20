import { useInView } from "@/hooks/use-in-view";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  /** Optional stagger index — items appear one after another */
  index?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export const AnimatedSection = ({
  children,
  className = "",
  index = 0,
  threshold = 0.1,
  triggerOnce = false,
}: AnimatedSectionProps) => {
  const { ref, isInView } = useInView({ threshold, triggerOnce });
  // Cap stagger so late items don't feel slow
  const delay = Math.min(index, 8) * 40;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isInView ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-500 ease-out will-change-[opacity,transform] ${
        isInView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
      } ${className}`}
    >
      {children}
    </div>
  );
};

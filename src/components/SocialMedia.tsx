import { Instagram, Linkedin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import BehanceIcon from "@/components/icons/BehanceIcon";
import { AnimatedSection } from "@/components/AnimatedSection";

const SocialMedia = () => {
  const { settings } = useSiteSettings();

  const socialLinks = [
    { name: "Instagram", icon: Instagram, url: settings.instagram_url, color: "hover:text-pink-500" },
    { name: "LinkedIn", icon: Linkedin, url: settings.linkedin_url, color: "hover:text-blue-600" },
    { name: "Behance", icon: BehanceIcon, url: settings.behance_url, color: "hover:text-blue-500" },
  ];

  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h2 className="font-boldonse text-2xl sm:text-3xl md:text-4xl text-white mb-3">
              Me acompanhe pelas redes sociais
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Fique por dentro dos meus projetos e novidades
            </p>
          </div>
          <div className="flex justify-center items-center gap-6 md:gap-8">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group transition-colors duration-200 ${social.color}`}
                aria-label={social.name}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-background border-2 border-border flex items-center justify-center transition-[transform,border-color,box-shadow] duration-200 ease-out md:group-hover:scale-110 md:group-hover:border-current md:hover:shadow-lg active:scale-[0.97] shadow-sm">
                  <social.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
              </a>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SocialMedia;

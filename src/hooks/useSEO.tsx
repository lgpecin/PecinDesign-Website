import { useEffect } from "react";
import { SITE_CONFIG } from "@/config/site";

export const useSEO = () => {
  useEffect(() => {
    document.title = SITE_CONFIG.seo_meta_title;
  }, []);
};

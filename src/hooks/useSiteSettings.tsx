import { SITE_CONFIG } from "@/config/site";

export const useSiteSettings = () => {
  return {
    settings: SITE_CONFIG,
    loading: false,
  };
};

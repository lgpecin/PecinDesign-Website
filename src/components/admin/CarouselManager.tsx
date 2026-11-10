import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Trash2, GripVertical, Loader2, Upload } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

const CarouselManager = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("carousel_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar imagens do carrossel");
      return;
    }
    setImages(data || []);
    setLoading(false);
  }, []);

  const fetchSpeed = useCallback(async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "carousel_speed")
      .maybeSingle();

    if (data?.setting_value) {
      setSpeed(Number(data.setting_value));
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchSpeed();
  }, [fetchImages, fetchSpeed]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      let nextOrder = images.length;
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 880,
          quality: 0.88,
          convertToWebP: true,
        });
        const fileExt = compressed.type === "image/webp" ? "webp" : "jpg";
        const fileName = `carousel/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, compressed, {
            cacheControl: "31536000",
            contentType: compressed.type || "image/webp",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(fileName);

        nextOrder += 1;
        const { error: insertError } = await supabase
          .from("carousel_images")
          .insert({
            image_url: urlData.publicUrl,
            display_order: nextOrder,
          });

        if (insertError) throw insertError;
      }

      toast.success("Imagens adicionadas");
      fetchImages();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagens");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("carousel_images").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover imagem");
      return;
    }
    toast.success("Imagem removida");
    fetchImages();
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newImages = [...images];
    const [dragged] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, dragged);
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    for (let i = 0; i < images.length; i++) {
      await supabase
        .from("carousel_images")
        .update({ display_order: i })
        .eq("id", images[i].id);
    }
    toast.success("Ordem atualizada");
  };

  const handleSpeedChange = async (value: number[]) => {
    const newSpeed = value[0];
    setSpeed(newSpeed);

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("setting_key", "carousel_speed")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ setting_value: String(newSpeed) })
        .eq("setting_key", "carousel_speed");
    } else {
      await supabase.from("site_settings").insert({
        setting_key: "carousel_speed",
        setting_value: String(newSpeed),
        setting_type: "number",
        description: "Velocidade do carrossel (segundos por imagem)",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 bg-white rounded-3xl border border-[#E5E7E2]">
        <Loader2 className="h-5 w-5 animate-spin text-[#00A859]" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7E2] rounded-3xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#111412]">
            Carrossel da página inicial
          </h2>
          <p className="text-xs text-[#5E6862] mt-0.5">
            Arraste para ordenar os slides exibidos no loop contínuo.
          </p>
        </div>

        <label
          htmlFor="carousel-upload"
          className="studio-press inline-flex items-center gap-2 px-4 py-2 bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold rounded-full cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 text-[#CCFF00]" />
          )}
          {uploading ? "Enviando..." : "Adicionar imagens"}
          <input
            id="carousel-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Speed control */}
      <div className="p-4 rounded-2xl bg-[#F6F6F2] border border-[#E5E7E2] space-y-2.5 max-w-md">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#111412]">Velocidade por slide</span>
          <span className="font-semibold text-[#00A859] studio-nums">{speed}s</span>
        </div>
        <Slider
          value={[speed]}
          onValueChange={handleSpeedChange}
          min={3}
          max={60}
          step={1}
        />
      </div>

      {/* Image list */}
      {images.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#5E6862] border border-dashed border-[#D6D9D2] rounded-2xl">
          Nenhuma imagem cadastrada no carrossel.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border border-[#E5E7E2] bg-[#FAFAF7] hover:border-[#C5CBC2] transition-colors cursor-move ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="h-4 w-4 text-[#8FA399] shrink-0" />
              <img
                src={img.image_url}
                alt={`Slide ${index + 1}`}
                className="h-14 w-24 rounded-xl object-cover bg-[#EBECE6]"
              />
              <span className="text-xs font-semibold text-[#5E6862] flex-1 studio-nums">
                #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="studio-press p-2 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                aria-label="Remover imagem"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselManager;

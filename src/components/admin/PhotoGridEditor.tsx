import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Loader2, GripVertical, Download } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

export interface GridData {
  backgroundColor: string;
  images: string[];
  columns?: number;
}

interface PhotoGridEditorProps {
  data: GridData;
  onChange: (data: GridData) => void;
  onRemove: () => void;
}

const PhotoGridEditor = ({ data, onChange, onRemove }: PhotoGridEditorProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        let fileToUpload = file;
        fileToUpload = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.92,
          convertToWebP: true,
        });

        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `grid-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('project-images')
          .upload(fileName, fileToUpload);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);

        newImages.push(urlData.publicUrl);
      }

      onChange({ ...data, images: [...data.images, ...newImages] });
      toast({ title: `${newImages.length} imagem(ns) adicionada(s)!` });
    } catch (error) {
      toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      uploadImages(e.dataTransfer.files);
    }
    setDragOverIndex(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImages(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    onChange({ ...data, images: data.images.filter((_, i) => i !== index) });
  };

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      const newImages = [...data.images];
      const [moved] = newImages.splice(draggedIndex, 1);
      newImages.splice(targetIndex, 0, moved);
      onChange({ ...data, images: newImages });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const exportAsPng = async () => {
    if (!gridRef.current || data.images.length === 0) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: data.backgroundColor,
        useCORS: true,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `grid-export-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Grade exportada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao exportar grade', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const columns = data.columns || 3;
  const inputId = `grid-upload-${data.backgroundColor}`;

  return (
    <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 space-y-4 bg-primary/5">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Grade de Fotos
        </Label>
        <div className="flex gap-2">
          {data.images.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={exportAsPng} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Exportar PNG
            </Button>
          )}
          <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
            <X className="h-4 w-4 mr-1" /> Remover Grade
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">Cor de Fundo</Label>
          <input
            type="color"
            value={data.backgroundColor}
            onChange={(e) => onChange({ ...data, backgroundColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border border-border"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Colunas</Label>
          <Input
            type="number"
            min={2}
            max={6}
            value={columns}
            onChange={(e) => onChange({ ...data, columns: parseInt(e.target.value) || 3 })}
            className="w-20"
          />
        </div>
      </div>

      {/* Preview da grade */}
      {data.images.length > 0 && (
        <div
          ref={gridRef}
          className="rounded-lg p-1 gap-1"
          style={{
            backgroundColor: data.backgroundColor,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {data.images.map((url, index) => (
            <div
              key={index}
              className={`relative group cursor-grab overflow-hidden ${
                dragOverIndex === index ? 'ring-2 ring-primary' : ''
              }`}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDrop={(e) => handleImageDrop(e, index)}
              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
            >
              <img
                src={url}
                alt={`Grid ${index + 1}`}
                className="w-full h-auto object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Label htmlFor={inputId} className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arraste fotos aqui ou clique para selecionar
                </span>
                <span className="text-xs text-muted-foreground">
                  Múltiplas imagens permitidas
                </span>
              </>
            )}
          </div>
        </Label>
        <Input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default PhotoGridEditor;

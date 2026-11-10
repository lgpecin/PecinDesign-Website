import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

interface MediaUploadProps {
  onMediaUploaded: (url: string, fileType: 'image' | 'video', metadata?: any) => void;
  label?: string;
  currentMedia?: string;
  currentType?: 'image' | 'video';
  acceptVideo?: boolean;
}

const MediaUpload = ({ 
  onMediaUploaded, 
  label = 'Mídia', 
  currentMedia,
  currentType = 'image',
  acceptVideo = false 
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentMedia || null);
  const [fileType, setFileType] = useState<'image' | 'video'>(currentType);
  const { toast } = useToast();

  const getFileDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        video.src = URL.createObjectURL(file);
      }
    });
  };

  const uploadMedia = async (file: File) => {
    try {
      setUploading(true);

      // Comprimir imagem antes de fazer upload (apenas para imagens)
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        toast({
          title: 'Comprimindo imagem...',
          description: 'Otimizando para carregamento rápido',
        });
        
        fileToUpload = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.92, // 92% de qualidade - imperceptível
          convertToWebP: true
        });
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const dimensions = await getFileDimensions(file);

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, fileToUpload, {
          cacheControl: '31536000',
          contentType: fileToUpload.type || undefined,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setPreview(publicUrl);
      setFileType(type);
      onMediaUploaded(publicUrl, type, dimensions);

      toast({
        title: `${type === 'video' ? 'Vídeo' : 'Imagem'} enviado com sucesso!`,
        description: file.type.startsWith('image/') 
          ? `Imagem comprimida e otimizada` 
          : undefined,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error uploading media:', error);
      toast({
        title: 'Erro ao enviar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMedia(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    onMediaUploaded('', 'image');
  };

  const acceptTypes = acceptVideo ? 'image/*,video/*' : 'image/*';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {preview ? (
        <div className="relative">
          {fileType === 'video' ? (
            <video
              src={preview}
              className="w-full h-48 object-cover rounded-md"
              controls
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md p-4">
          <Label htmlFor={`media-upload-${label}`} className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-sm text-primary font-medium">
                    Comprimindo e enviando...
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para selecionar {acceptVideo ? 'imagem ou vídeo' : 'imagem'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Compressão automática para carregamento rápido
                  </span>
                </>
              )}
            </div>
          </Label>
          <Input
            id={`media-upload-${label}`}
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
};

export default MediaUpload;

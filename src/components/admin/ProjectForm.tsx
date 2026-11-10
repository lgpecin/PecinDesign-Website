import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MediaUpload from './MediaUpload';
import BannerUploadWithCrop from './BannerUploadWithCrop';
import ImageCropDialog from './ImageCropDialog';
import PhotoGridEditor, { type GridData } from './PhotoGridEditor';
import { X, GripVertical, LayoutGrid } from 'lucide-react';

interface ProjectFormProps {
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'grid';
  metadata?: any;
  gridData?: GridData;
}

const ProjectForm = ({ projectId, onSuccess, onCancel }: ProjectFormProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [bannerMedia, setBannerMedia] = useState<{ url: string; type: 'image' }>({ url: '', type: 'image' });
  const [detailMedia, setDetailMedia] = useState<MediaItem[]>([]);
  const [technologies, setTechnologies] = useState<string[]>(['']);
  const [imageSpacing, setImageSpacing] = useState(16);
  const [hideBanner, setHideBanner] = useState(false);
  const [notes, setNotes] = useState('');
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_images (image_url, display_order, file_type, metadata),
          project_technologies (technology)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      setTitle(project.title);
      setCategory(project.category);
      setDescription(project.description);
      setFullDescription(project.full_description);
      setYear(project.year);
      setImageSpacing(project.image_spacing ?? 16);
      setHideBanner(project.hide_banner ?? false);
      setNotes(project.notes ?? '');
      setBannerMedia({ url: project.banner_image || '', type: 'image' });
      
      const media = project.project_images
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => {
          const fileType = img.file_type || 'image';
          if (fileType === 'grid') {
            const meta = img.metadata as any;
            return {
              url: 'grid',
              type: 'grid' as const,
              gridData: {
                backgroundColor: meta?.backgroundColor || '#000000',
                images: meta?.images || [],
                columns: meta?.columns || 3,
              },
            };
          }
          return {
            url: img.image_url,
            type: fileType as 'image' | 'video',
            metadata: img.metadata,
          };
        }) || [];
      setDetailMedia(media);
      
      const techs = project.project_technologies?.map((t: any) => t.technology) || [''];
      setTechnologies(techs.length > 0 ? techs : ['']);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading project:', error);
      toast({ title: 'Erro ao carregar projeto', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        title,
        category,
        description,
        full_description: fullDescription,
        year,
        banner_image: bannerMedia.url,
        image_spacing: imageSpacing,
        hide_banner: hideBanner,
        notes: notes.trim() || null,
      };

      let finalProjectId = projectId;

      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId);
        if (error) throw error;
        await supabase.from('project_images').delete().eq('project_id', projectId);
        await supabase.from('project_technologies').delete().eq('project_id', projectId);
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();
        if (error) throw error;
        finalProjectId = data.id;
      }

      // Insert media files (including grids)
      const validMedia = detailMedia.filter(m => m.type === 'grid' ? (m.gridData?.images?.length ?? 0) > 0 : m.url);
      if (validMedia.length > 0) {
        const mediaInserts = validMedia.map((media, index) => {
          if (media.type === 'grid') {
            return {
              project_id: finalProjectId,
              image_url: 'grid',
              file_type: 'grid',
              metadata: {
                backgroundColor: media.gridData?.backgroundColor || '#000000',
                images: media.gridData?.images || [],
                columns: media.gridData?.columns || 3,
              },
              display_order: index,
            };
          }
          return {
            project_id: finalProjectId,
            image_url: media.url,
            file_type: media.type,
            metadata: media.metadata,
            display_order: index,
          };
        });

        const { error: mediaError } = await supabase
          .from('project_images')
          .insert(mediaInserts);
        if (mediaError) throw mediaError;
      }

      const validTechs = technologies.filter(t => t.trim() !== '');
      if (validTechs.length > 0) {
        const techInserts = validTechs.map(tech => ({
          project_id: finalProjectId,
          technology: tech,
        }));
        const { error: techError } = await supabase
          .from('project_technologies')
          .insert(techInserts);
        if (techError) throw techError;
      }

      toast({ title: projectId ? 'Projeto atualizado!' : 'Projeto criado!' });
      onSuccess();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving project:', error);
      toast({
        title: 'Erro ao salvar projeto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTechnology = () => setTechnologies([...technologies, '']);
  const removeTechnology = (index: number) => setTechnologies(technologies.filter((_, i) => i !== index));
  const updateTechnology = (index: number, value: string) => {
    const newTechs = [...technologies];
    newTechs[index] = value;
    setTechnologies(newTechs);
  };

  const addDetailMedia = () => setDetailMedia([...detailMedia, { url: '', type: 'image' }]);
  const addGridSection = () => {
    setDetailMedia([...detailMedia, {
      url: 'grid',
      type: 'grid',
      gridData: { backgroundColor: '#000000', images: [], columns: 3 },
    }]);
  };

  const removeDetailMedia = (index: number) => setDetailMedia(detailMedia.filter((_, i) => i !== index));

  const handleBannerSelected = (url: string) => {
    setTempBannerUrl(url);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const contentType = croppedBlob.type || 'image/webp';
      const ext = contentType === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, croppedBlob, {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);
      setBannerMedia({ url: publicUrl, type: 'image' });
      toast({ title: 'Imagem recortada com sucesso!' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error uploading cropped image:', error);
      toast({ title: 'Erro ao fazer upload da imagem', variant: 'destructive' });
    }
  };

  // Drag reorder handlers for detail media
  const handleItemDragStart = (index: number) => setDraggedIndex(index);
  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index);
  };
  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      const newMedia = [...detailMedia];
      const [moved] = newMedia.splice(draggedIndex, 1);
      newMedia.splice(targetIndex, 0, moved);
      setDetailMedia(newMedia);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleItemDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projectId ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Curta</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullDescription">Descrição Completa</Label>
            <Textarea id="fullDescription" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} rows={5} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input id="year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageSpacing">Espaçamento entre Imagens (px)</Label>
            <Input id="imageSpacing" type="number" min="0" value={imageSpacing} onChange={(e) => setImageSpacing(parseInt(e.target.value) || 0)} />
            <p className="text-sm text-muted-foreground">
              {imageSpacing === 0
                ? "Imagens serão exibidas juntas sem espaçamento e sem bordas arredondadas"
                : `Imagens terão ${imageSpacing}px de espaçamento entre elas`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="hideBanner" checked={hideBanner} onChange={(e) => setHideBanner(e.target.checked)} className="w-4 h-4 rounded border-input" />
            <Label htmlFor="hideBanner" className="cursor-pointer">
              Ocultar capa no detalhe do projeto (mostrar apenas como ícone)
            </Label>
          </div>

          <div className="space-y-2">
            <BannerUploadWithCrop
              currentBanner={bannerMedia.url}
              onBannerChange={(url) => setBannerMedia({ url, type: 'image' })}
              onImageSelected={handleBannerSelected}
            />
          </div>

          <ImageCropDialog
            open={cropDialogOpen}
            onOpenChange={setCropDialogOpen}
            imageUrl={tempBannerUrl}
            onCropComplete={handleCropComplete}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mídias de Detalhes</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addGridSection}>
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grade de Fotos
                </Button>
                <Button type="button" size="sm" onClick={addDetailMedia}>
                  Adicionar Mídia
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {detailMedia.map((media, index) => (
                <div
                  key={index}
                  className={`relative transition-all ${dragOverIndex === index ? 'ring-2 ring-primary rounded-lg' : ''}`}
                  draggable
                  onDragStart={() => handleItemDragStart(index)}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDrop={(e) => handleItemDrop(e, index)}
                  onDragEnd={handleItemDragEnd}
                >
                  {media.type === 'grid' ? (
                    <div className="flex items-start gap-2">
                      <div className="pt-4 cursor-grab">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <PhotoGridEditor
                          data={media.gridData || { backgroundColor: '#000000', images: [], columns: 3 }}
                          onChange={(gridData) => {
                            const newMedia = [...detailMedia];
                            newMedia[index] = { ...media, gridData };
                            setDetailMedia(newMedia);
                          }}
                          onRemove={() => removeDetailMedia(index)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="pt-4 cursor-grab">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        {media.url ? (
                          <div className="relative">
                            {media.type === 'video' ? (
                              <video src={media.url} className="w-full h-32 object-cover rounded-md" controls />
                            ) : (
                              <img src={media.url} alt={`Detail ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                            )}
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => removeDetailMedia(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <MediaUpload
                            label={`Detalhe ${index + 1}`}
                            acceptVideo={true}
                            onMediaUploaded={(url, type, metadata) => {
                              const newMedia = [...detailMedia];
                              newMedia[index] = { url, type, metadata };
                              setDetailMedia(newMedia);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tecnologias/Softwares</Label>
              <Button type="button" size="sm" onClick={addTechnology}>Adicionar</Button>
            </div>
            {technologies.map((tech, index) => (
              <div key={index} className="flex gap-2">
                <Input value={tech} onChange={(e) => updateTechnology(index, e.target.value)} placeholder="Ex: Photoshop, After Effects" />
                {technologies.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeTechnology(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações e Autoria (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ex: Projeto desenvolvido em parceria com [nome]. Créditos de fotografia: [fotógrafo]. Observações adicionais..."
            />
            <p className="text-sm text-muted-foreground">
              Campo opcional para anotações de observações e créditos de autoria que aparecerão no final do projeto.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Projeto'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;

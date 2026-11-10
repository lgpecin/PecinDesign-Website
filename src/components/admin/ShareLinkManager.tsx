import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "./budgets/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Copy, Trash2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { generateShortToken } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShareLinkManagerProps {
  services: Service[];
}

type ShareLink = {
  id: string;
  name: string;
  share_token: string;
  recipient_name: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

type ServiceLinkItem = {
  id: string;
  link_id: string;
  service_id: string;
};

const ShareLinkManager = ({ services }: ShareLinkManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    recipient_name: "",
    expires_at: "",
    selectedServices: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data: shareLinks = [], isLoading } = useQuery({
    queryKey: ["service_share_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_share_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShareLink[];
    },
  });

  const { data: linkItems = [] } = useQuery({
    queryKey: ["service_link_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_link_items")
        .select("*");

      if (error) throw error;
      return data as ServiceLinkItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Generate short token based on recipient name or link name
      const baseName = formData.recipient_name || formData.name;
      let token = generateShortToken(baseName);
      
      // Check uniqueness and retry up to 5 times if needed
      let attempts = 0;
      let isUnique = false;
      
      while (!isUnique && attempts < 5) {
        const { data: existing } = await supabase
          .from("service_share_links")
          .select("id")
          .eq("share_token", token)
          .single();
        
        if (!existing) {
          isUnique = true;
        } else {
          token = generateShortToken(baseName);
          attempts++;
        }
      }
      
      if (!isUnique) {
        throw new Error("Não foi possível gerar um token único");
      }
      
      const { data: link, error: linkError } = await supabase
        .from("service_share_links")
        .insert({
          name: formData.name,
          recipient_name: formData.recipient_name || null,
          share_token: token,
          expires_at: formData.expires_at || null,
        })
        .select()
        .single();

      if (linkError) throw linkError;

      const items = formData.selectedServices.map((serviceId) => ({
        link_id: link.id,
        service_id: serviceId,
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("service_link_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_share_links"] });
      queryClient.invalidateQueries({ queryKey: ["service_link_items"] });
      toast.success("Link criado com sucesso");
      handleCloseForm();
    },
    onError: () => {
      toast.error("Erro ao criar link");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingLink) return;

      const { error: linkError } = await supabase
        .from("service_share_links")
        .update({
          name: formData.name,
          recipient_name: formData.recipient_name || null,
          expires_at: formData.expires_at || null,
        })
        .eq("id", editingLink.id);

      if (linkError) throw linkError;

      // Delete existing items and recreate
      await supabase
        .from("service_link_items")
        .delete()
        .eq("link_id", editingLink.id);

      const items = formData.selectedServices.map((serviceId) => ({
        link_id: editingLink.id,
        service_id: serviceId,
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("service_link_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_share_links"] });
      queryClient.invalidateQueries({ queryKey: ["service_link_items"] });
      toast.success("Link atualizado com sucesso");
      handleCloseForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar link");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("service_link_items").delete().eq("link_id", id);
      const { error } = await supabase
        .from("service_share_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_share_links"] });
      queryClient.invalidateQueries({ queryKey: ["service_link_items"] });
      toast.success("Link excluído com sucesso");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir link");
    },
  });

  const handleOpenForm = (link?: ShareLink) => {
    if (link) {
      setEditingLink(link);
      const linkServiceIds = linkItems
        .filter((item) => item.link_id === link.id)
        .map((item) => item.service_id);

      setFormData({
        name: link.name,
        recipient_name: link.recipient_name || "",
        expires_at: link.expires_at ? new Date(link.expires_at).toISOString().split('T')[0] : "",
        selectedServices: linkServiceIds,
      });
    } else {
      setEditingLink(null);
      setFormData({
        name: "",
        recipient_name: "",
        expires_at: "",
        selectedServices: [],
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLink(null);
    setFormData({
      name: "",
      recipient_name: "",
      expires_at: "",
      selectedServices: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLink) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/services/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência");
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const getServiceCount = (linkId: string) => {
    return linkItems.filter((item) => item.link_id === linkId).length;
  };

  const handleExportPDF = async (link: ShareLink) => {
    setExportingId(link.id);
    try {
      console.log("Iniciando exportação de PDF...");
      
      // Get services for this link
      const linkServiceIds = linkItems
        .filter((item) => item.link_id === link.id)
        .map((item) => item.service_id);

      const linkServices = services.filter((s) => 
        linkServiceIds.includes(s.id)
      ).sort((a, b) => a.display_order - b.display_order);

      if (linkServices.length === 0) {
        toast.error("Este orçamento não possui serviços");
        setExportingId(null);
        return;
      }

      console.log(`Exportando ${linkServices.length} serviços`);

      // Group services by category
      const servicesByCategory = linkServices.reduce((acc, service) => {
        if (!acc[service.category]) {
          acc[service.category] = [];
        }
        acc[service.category].push(service);
        return acc;
      }, {} as Record<string, Service[]>);

      // Create temporary container for PDF generation
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px";
      container.style.padding = "40px";
      container.style.backgroundColor = "hsl(162, 75%, 8%)";
      container.style.color = "hsl(162, 30%, 90%)";
      container.style.fontFamily = "Arial, sans-serif";

      // Load logo as base64 to avoid CORS issues
      const logoBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
          if (import.meta.env.DEV) console.error("Erro ao carregar logo");
          resolve("");
        };
        img.src = logo;
      });

      // Build HTML content
      let html = `
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="height: 50px; margin-bottom: 20px;" />` : ''}
          <h1 style="font-size: 28px; font-weight: bold; margin: 10px 0; color: hsl(162, 30%, 90%);">Orçamento de Serviços</h1>
          ${link.recipient_name ? `<p style="font-size: 18px; color: hsl(162, 20%, 70%); margin: 5px 0;">Para: ${link.recipient_name}</p>` : ''}
          <p style="font-size: 14px; color: hsl(162, 15%, 60%); margin: 5px 0;">${link.name}</p>
        </div>
      `;

      // Add services by category
      Object.keys(servicesByCategory).sort().forEach((category) => {
        html += `<h2 style="font-size: 22px; font-weight: bold; margin: 25px 0 15px 0; color: hsl(162, 30%, 85%); border-bottom: 2px solid hsl(162, 30%, 30%); padding-bottom: 8px;">${category}</h2>`;
        
        servicesByCategory[category].forEach((service) => {
          html += `
            <div style="border: 2px solid ${service.color || '#6366f1'}; border-radius: 8px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; background-color: hsl(162, 60%, 12%);">
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: hsl(162, 30%, 90%);">${service.name}</h3>
                ${service.description ? `<p style="font-size: 14px; color: hsl(162, 20%, 70%); margin: 0;">${service.description}</p>` : ''}
              </div>
              <div style="display: flex; gap: 10px;">
                <div style="flex: 1; background-color: ${service.color || '#6366f1'}20; padding: 12px; border-radius: 6px;">
                  <div style="font-size: 12px; color: hsl(162, 20%, 70%); margin-bottom: 4px;">Preço</div>
                  <div style="font-size: 20px; font-weight: bold; color: ${service.color || '#6366f1'};">R$ ${service.price.toFixed(2)}</div>
                </div>
                <div style="flex: 1; background-color: hsl(162, 40%, 18%); padding: 12px; border-radius: 6px;">
                  <div style="font-size: 12px; color: hsl(162, 20%, 70%); margin-bottom: 4px;">Prazo</div>
                  <div style="font-size: 16px; font-weight: 600; color: hsl(162, 30%, 85%);">${service.delivery_days} dias úteis</div>
                </div>
              </div>
            </div>
          `;
        });
      });

      container.innerHTML = html;
      document.body.appendChild(container);

      console.log("Gerando canvas...");

      // Generate PDF with better settings
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "hsl(162, 75%, 8%)",
      });

      console.log("Canvas gerado, criando PDF...");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = link.recipient_name
        ? `Orçamento_${link.recipient_name.replace(/\s+/g, "_")}.pdf`
        : `Orçamento_${link.name.replace(/\s+/g, "_")}.pdf`;

      console.log("Salvando PDF:", fileName);
      pdf.save(fileName);
      
      document.body.removeChild(container);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Erro detalhado ao exportar PDF:", error);
      toast.error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Crie links compartilháveis com serviços selecionados para enviar aos clientes
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Link
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando links...
        </div>
      ) : shareLinks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum link criado ainda
        </div>
      ) : (
        <div className="grid gap-4">
          {shareLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{link.name}</CardTitle>
                    {link.recipient_name && (
                      <CardDescription>Para: {link.recipient_name}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(link)}
                      disabled={exportingId === link.id}
                      title="Exportar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(link.share_token)}
                      title="Copiar link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/services/${link.share_token}`, "_blank")}
                      title="Visualizar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(link)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(link.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {getServiceCount(link.id)} serviço(s) incluído(s)
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Editar Link" : "Novo Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Link *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Orçamento Janeiro 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_name">Nome do Cliente</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, recipient_name: e.target.value }))
                }
                placeholder="Nome do destinatário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expires_at: e.target.value }))
                }
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Selecionar Serviços *</Label>
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={formData.selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <label
                      htmlFor={service.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {service.name} - R$ {service.price}
                    </label>
                  </div>
                ))}
              </div>
              {formData.selectedServices.length === 0 && (
                <p className="text-sm text-destructive">
                  Selecione pelo menos um serviço
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name ||
                  formData.selectedServices.length === 0 ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {editingLink ? "Atualizar" : "Criar"} Link
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShareLinkManager;

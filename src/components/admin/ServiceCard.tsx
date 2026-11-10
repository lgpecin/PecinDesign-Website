import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, DollarSign } from "lucide-react";
import * as Icons from "lucide-react";
import { Service } from "./budgets/types";

type ServiceCardProps = {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
};

const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  const IconComponent = service.icon
    ? (Icons as any)[service.icon] || Icons.Folder
    : Icons.Folder;

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all duration-200 border-2 h-full flex flex-col"
      style={{
        borderColor: service.color || "#6366f1",
        opacity: service.is_active ? 1 : 0.5,
      }}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className="p-3 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${service.color}20` }}
        >
          <IconComponent
            className="w-6 h-6"
            style={{ color: service.color || "#6366f1" }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-semibold text-lg mb-1 truncate">
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
            {service.description || ""}
          </p>

          <div className="flex items-center gap-4 text-sm mt-auto">
            <div className="flex items-center gap-1 text-primary font-semibold">
              <DollarSign className="w-4 h-4" />
              R$ {service.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {service.delivery_days} dias
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(service)}
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(service.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ServiceCard;

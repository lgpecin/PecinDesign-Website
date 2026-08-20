import { Button } from '@/components/ui/button';
import { FolderOpen, DollarSign, Settings, BarChart3 } from 'lucide-react';

interface DashboardHomeProps {
  onNavigate: (section: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const mainSections = [
    { 
      id: 'portfolio', 
      label: 'Portfólio', 
      icon: FolderOpen, 
      description: 'Projetos públicos do site',
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/50'
    },
    { 
      id: 'services', 
      label: 'Orçamentos', 
      icon: DollarSign, 
      description: 'Serviços e preços',
      color: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/50'
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: Settings, 
      description: 'Personalizações',
      color: 'from-gray-500/20 to-slate-500/20',
      iconColor: 'text-gray-500',
      borderColor: 'border-gray-500/50'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Painel Administrativo</h1>
        <p className="text-lg text-muted-foreground">Selecione uma seção para começar</p>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`group relative p-6 bg-gradient-to-br ${section.color} border-2 ${section.borderColor} rounded-2xl transition-[transform,box-shadow] duration-200 ease-out md:hover:scale-[1.03] md:hover:shadow-2xl active:scale-[0.99]`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 bg-card/80 backdrop-blur rounded-full group-hover:scale-110 transition-transform border-2 ${section.borderColor}`}>
                  <Icon className={`h-8 w-8 ${section.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{section.label}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
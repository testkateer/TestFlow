import { 
  Navigation,
  MousePointer,
  Type,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';

export const STEP_TYPES = [
  { id: 'navigate', name: 'Git', icon: Navigation, description: 'Belirtilen URL ye git' },
  { id: 'click', name: 'Tıkla', icon: MousePointer, description: 'Element üzerine tıkla' },
  { id: 'input', name: 'Metin Gir', icon: Type, description: 'Alana metin gir' },
  { id: 'wait', name: 'Bekle', icon: Clock, description: 'Belirtilen süre bekle' },
  { id: 'verify', name: 'Doğrula', icon: Eye, description: 'Element varlığını doğrula' },
  { id: 'refresh', name: 'Yenile', icon: RefreshCw, description: 'Sayfayı yenile' }
];

export const getStepTypeById = (id) => {
  return STEP_TYPES.find(stepType => stepType.id === id);
};

export const getStepTypeIcon = (id) => {
  const stepType = getStepTypeById(id);
  return stepType ? stepType.icon : null;
}; 
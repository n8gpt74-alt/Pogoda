import { AlertTriangle, Check, Flower2 } from 'lucide-react';
import Card from '../common/Card';
import WidgetStateCard from '../common/WidgetStateCard';

const PollenWidget = ({ data }) => {
  if (!data || !data.available) {
    return (
      <WidgetStateCard
        title="Пыльца и аллергены"
        icon={Flower2}
        stateIcon={AlertTriangle}
        message="Данные о пыльце недоступны"
        description="Провайдер Open-Meteo не вернул валидные данные для текущей локации."
        tone="warning"
      />
    );
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'Низкий': return 'bg-green-500';
      case 'Умеренный': return 'bg-yellow-500';
      case 'Высокий': return 'bg-orange-500';
      case 'Очень высокий': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getLevelTextColor = (level) => {
    switch (level) {
      case 'Низкий': return 'text-green-400';
      case 'Умеренный': return 'text-yellow-400';
      case 'Высокий': return 'text-orange-400';
      case 'Очень высокий': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <Card title="Пыльца и аллергены" icon={Flower2}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
          <div>
            <p className="text-xs text-slate-400">Общий уровень</p>
            <p className={`text-lg font-bold ${getLevelTextColor(data.overall)}`}>{data.overall}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-100">{data.overallIndex}</p>
            <p className="text-xs text-slate-500">из 100</p>
          </div>
        </div>

        <div className="relative h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500">
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-white shadow"
            style={{ left: `${Math.min(data.overallIndex, 100)}%` }}
          />
        </div>

        <div className="space-y-2">
          {data.types.map((type, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg bg-slate-700/30 p-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${getLevelColor(type.level)}`} />
                <span className="text-sm text-slate-300">{type.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${getLevelTextColor(type.level)}`}>{type.level}</span>
                <span className="w-8 text-right text-sm font-medium text-slate-200">{type.index}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {data.forecast.map((day, index) => (
            <div key={index} className="flex-1 rounded bg-slate-700/30 p-2 text-center">
              <p className="text-xs text-slate-500">{day.day}</p>
              <div className={`mx-auto mt-1 h-2 w-2 rounded-full ${getLevelColor(day.level)}`} />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-slate-700/30 p-3">
          <p className="mb-2 flex items-center gap-1 text-xs text-slate-400">
            <AlertTriangle className="h-3 w-3" /> Рекомендации
          </p>
          <ul className="space-y-1">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 pt-2 text-[11px] text-slate-500">
          <span>Источник: {data.source || 'Open-Meteo'}</span>
          <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    </Card>
  );
};

export default PollenWidget;

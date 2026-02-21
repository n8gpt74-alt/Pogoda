import { Droplets, Snowflake, Sprout, Thermometer, Tractor } from 'lucide-react';
import Card from '../common/Card';
import WidgetStateCard from '../common/WidgetStateCard';

const AgricultureWidget = ({ data }) => {
  if (!data || !data.available) {
    return (
      <WidgetStateCard
        title="Сельское хозяйство"
        icon={Tractor}
        stateIcon={Sprout}
        message="Недостаточно данных для агро-аналитики"
        description="Требуются измерения soil moisture/temperature от провайдера Open-Meteo."
        tone="warning"
        className="col-span-full lg:col-span-2"
      />
    );
  }

  const getConditionColor = (color) => {
    switch (color) {
      case 'green': return 'text-green-400 bg-green-500/20';
      case 'yellow': return 'text-yellow-400 bg-yellow-500/20';
      case 'orange': return 'text-orange-400 bg-orange-500/20';
      case 'red': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Низкий': return 'text-green-400';
      case 'Умеренный': return 'text-yellow-400';
      case 'Высокий': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <Card title="Сельское хозяйство" icon={Tractor} className="col-span-full lg:col-span-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`rounded-lg p-4 ${getConditionColor(data.conditions.color)}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Условия для роста</span>
            <Sprout className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{data.conditions.status}</p>
          <p className="mt-1 text-xs opacity-80">{data.conditions.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-700/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Влажность почвы</span>
            </div>
            <p className="text-lg font-bold text-slate-100">{data.soilMoisture}%</p>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-slate-400">Темп. почвы</span>
            </div>
            <p className="text-lg font-bold text-slate-100">{data.soilTemperature}°C</p>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Риск заморозков</span>
            </div>
            <p className={`text-lg font-bold ${getRiskColor(data.frostRisk)}`}>{data.frostRisk}</p>
          </div>
          <div className="rounded-lg bg-slate-700/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Испарение</span>
            </div>
            <p className="text-lg font-bold text-slate-100">{data.evapotranspiration} мм</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-700/50 p-4">
          <h4 className="mb-3 text-sm font-medium text-slate-300">Полив</h4>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Статус:</span>
            <span className={`text-sm font-medium ${
              data.irrigationNeed === 'Требуется' ? 'text-red-400' :
              data.irrigationNeed === 'Скоро' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {data.irrigationNeed}
            </span>
          </div>
          {data.irrigationAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Рекомендуемый объём:</span>
              <span className="text-sm text-slate-200">{data.irrigationAmount} л/м²</span>
            </div>
          )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-600">
            <div
              className={`h-full rounded-full ${
                data.soilMoisture > 60 ? 'bg-green-500' :
                data.soilMoisture > 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.soilMoisture}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-700/50 p-4">
          <h4 className="mb-3 text-sm font-medium text-slate-300">Опрыскивание</h4>
          <div className={`rounded p-2 ${data.sprayingConditions.suitable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <p className={`text-sm font-medium ${data.sprayingConditions.suitable ? 'text-green-400' : 'text-red-400'}`}>
              {data.sprayingConditions.suitable ? 'Условия подходящие' : 'Не рекомендуется'}
            </p>
            <p className="mt-1 text-xs text-slate-400">{data.sprayingConditions.reason}</p>
          </div>
        </div>

        <div className="col-span-full">
          <h4 className="mb-2 text-sm font-medium text-slate-300">Состояние культур</h4>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {data.crops.map((crop, index) => (
              <div
                key={index}
                className={`rounded p-2 text-center ${crop.status === 'Благоприятно' ? 'bg-green-500/20' : 'bg-orange-500/20'}`}
              >
                <p className="text-sm font-medium text-slate-200">{crop.name}</p>
                <p className={`text-xs ${crop.status === 'Благоприятно' ? 'text-green-400' : 'text-orange-400'}`}>{crop.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-full rounded-lg bg-slate-700/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Градусо-дни роста (GDD)</span>
            <span className="text-sm font-medium text-slate-200">{data.growingDegreeDays} °D</span>
          </div>
        </div>

        <div className="col-span-full flex items-center justify-between border-t border-slate-700 pt-2 text-[11px] text-slate-500">
          <span>Источник: {data.source || 'Open-Meteo'}</span>
          <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    </Card>
  );
};

export default AgricultureWidget;

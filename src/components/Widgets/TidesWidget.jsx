import { Anchor, Waves } from 'lucide-react';
import Card from '../common/Card';
import WidgetStateCard from '../common/WidgetStateCard';

const TidesWidget = ({ data }) => {
  if (!data || !data.available) {
    return (
      <WidgetStateCard
        title="Приливы и отливы"
        icon={Waves}
        stateIcon={Anchor}
        message="Данные о приливах недоступны"
        description={data?.reason || 'Добавьте ключ Stormglass в настройках для загрузки реальных приливов.'}
        tone="warning"
      />
    );
  }

  return (
    <Card title="Приливы и отливы" icon={Waves}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Текущее состояние</p>
            <p className="text-lg font-bold text-blue-300">{data.current === 'rising' ? 'Прилив' : 'Отлив'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Следующий пик</p>
            <p className="text-xl font-bold text-slate-100">{data.nextHigh || '--:--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-500/10 p-3">
            <p className="mb-2 text-xs text-blue-400">Высокая вода</p>
            {data.high?.length ? data.high.map((tide, index) => (
              <div key={`high-${index}`} className="flex justify-between text-sm">
                <span className="text-slate-300">{tide.time}</span>
                <span className="text-slate-400">{tide.height} м</span>
              </div>
            )) : <p className="text-xs text-slate-500">Нет данных</p>}
          </div>

          <div className="rounded-lg bg-cyan-500/10 p-3">
            <p className="mb-2 text-xs text-cyan-400">Низкая вода</p>
            {data.low?.length ? data.low.map((tide, index) => (
              <div key={`low-${index}`} className="flex justify-between text-sm">
                <span className="text-slate-300">{tide.time}</span>
                <span className="text-slate-400">{tide.height} м</span>
              </div>
            )) : <p className="text-xs text-slate-500">Нет данных</p>}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Источник: {data.source || 'Stormglass'}</span>
          <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    </Card>
  );
};

export default TidesWidget;

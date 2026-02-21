import { Database, ShieldCheck } from 'lucide-react';
import Card from '../common/Card';

const STATUS_STYLE = {
  observed: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
  derived: 'text-amber-200 bg-amber-500/15 border-amber-400/30',
  unavailable: 'text-red-200 bg-red-500/15 border-red-400/30',
};

const statusLabel = {
  observed: 'Измерено',
  derived: 'Расчёт',
  unavailable: 'Недоступно',
};

const DataPassportWidget = ({ passport }) => {
  if (!passport) return null;

  const rows = Object.entries(passport)
    .filter(([key]) => key !== 'forecastMode')
    .map(([key, entry]) => ({ key, ...entry }));

  return (
    <Card title="Паспорт данных" icon={Database} className="col-span-full" variant="minimal">
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-blue-300" />
          Прозрачность источников и статуса достоверности по каждому блоку.
        </div>

        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[120px_1fr_auto] items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/35 px-3 py-2 text-xs">
            <span className="font-medium text-slate-200 capitalize">{row.key}</span>
            <div className="min-w-0">
              <div className="truncate text-slate-300">{row.source}</div>
              {row.note && <div className="truncate text-slate-500">{row.note}</div>}
            </div>
            <div className="text-right">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[row.status] || STATUS_STYLE.unavailable}`}>
                {statusLabel[row.status] || 'Недоступно'}
              </span>
              {row.updatedAt && (
                <div className="mt-1 text-[10px] text-slate-500">
                  {new Date(row.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DataPassportWidget;

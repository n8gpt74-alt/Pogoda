import Card from './Card';

const WidgetSkeletonCard = ({
  title = 'Загрузка виджета',
  icon,
  heightClass = 'h-48',
  className = '',
}) => {
  return (
    <Card title={title} icon={icon} className={className} hover={false}>
      <div className={`${heightClass} rounded-lg bg-slate-700/30 animate-pulse`}>
        <div className="h-full w-full bg-gradient-to-r from-transparent via-slate-600/20 to-transparent" />
      </div>
    </Card>
  );
};

export default WidgetSkeletonCard;

import { Component, Suspense, lazy } from 'react';
import { AlertTriangle, CloudRain, Droplets, Globe, Thermometer, Wind } from 'lucide-react';
import Card from '../common/Card';
import LazyWidgetGate from '../common/LazyWidgetGate';
import WidgetSkeletonCard from '../common/WidgetSkeletonCard';

const SafeWeather3D = lazy(() => import('../Widgets/SafeWeather3D'));
const TemperatureChart = lazy(() => import('../Charts/TemperatureChart'));
const HumidityChart = lazy(() => import('../Charts/HumidityChart'));
const PrecipitationChart = lazy(() => import('../Charts/PrecipitationChart'));
const WindChart = lazy(() => import('../Charts/WindChart'));

class HeavyWidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[HeavyWidget] failed to render:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card title={this.props.title} icon={this.props.icon} className={this.props.className} hover={false}>
          <div className="space-y-3 py-8 text-center text-slate-400">
            <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" />
            <p>Не удалось загрузить расширенный виджет.</p>
            <button
              onClick={this.handleRetry}
              className="rounded-lg border border-slate-600/60 bg-slate-700/60 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:bg-slate-600/70"
            >
              Повторить
            </button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

const DeferredWidget = ({
  title,
  icon,
  heightClass,
  className = '',
  rootMargin,
  children,
}) => {
  const fallback = <WidgetSkeletonCard title={title} icon={icon} heightClass={heightClass} className={className} />;

  return (
    <LazyWidgetGate fallback={fallback} className={className} rootMargin={rootMargin}>
      <HeavyWidgetErrorBoundary title={title} icon={icon} className={className}>
        <Suspense fallback={fallback}>{children}</Suspense>
      </HeavyWidgetErrorBoundary>
    </LazyWidgetGate>
  );
};

export const LazySafeWeather3DWidget = ({ condition }) => {
  return (
    <DeferredWidget
      title="3D Визуализация"
      icon={Globe}
      heightClass="h-80 sm:h-96"
      rootMargin="260px 0px"
    >
      <SafeWeather3D condition={condition} />
    </DeferredWidget>
  );
};

export const LazyTemperatureChartWidget = ({ data }) => {
  return (
    <DeferredWidget
      title="Температура"
      icon={Thermometer}
      heightClass="h-64"
      className="col-span-full lg:col-span-2"
      rootMargin="220px 0px"
    >
      <TemperatureChart data={data} />
    </DeferredWidget>
  );
};

export const LazyHumidityChartWidget = ({ data }) => {
  return (
    <DeferredWidget title="Влажность" icon={Droplets} heightClass="h-48" rootMargin="220px 0px">
      <HumidityChart data={data} />
    </DeferredWidget>
  );
};

export const LazyPrecipitationChartWidget = ({ data }) => {
  return (
    <DeferredWidget title="Осадки" icon={CloudRain} heightClass="h-48" rootMargin="220px 0px">
      <PrecipitationChart data={data} />
    </DeferredWidget>
  );
};

export const LazyWindChartWidget = ({ data }) => {
  return (
    <DeferredWidget title="Ветер" icon={Wind} heightClass="h-48" rootMargin="220px 0px">
      <WindChart data={data} />
    </DeferredWidget>
  );
};

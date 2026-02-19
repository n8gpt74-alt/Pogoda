import { Component, Suspense, lazy, useMemo } from 'react';
import { AlertTriangle, Globe } from 'lucide-react';
import Card from '../common/Card';

const Weather3D = lazy(() => import('./Weather3D'));

class Weather3DErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[Weather3D] render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card title="3D Визуализация" icon={Globe}>
          <div className="py-10 text-center text-slate-400 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
            <p>3D-виджет временно недоступен на этом устройстве.</p>
            <p className="text-xs text-slate-500">Основная панель погоды продолжает работать.</p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

const SafeWeather3D = ({ condition }) => {
  const webglSupported = useMemo(() => supportsWebGL(), []);

  if (!webglSupported) {
    return (
      <Card title="3D Визуализация" icon={Globe}>
        <div className="py-10 text-center text-slate-400 space-y-2">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
          <p>WebGL не поддерживается в текущем браузере/устройстве.</p>
        </div>
      </Card>
    );
  }

  return (
    <Weather3DErrorBoundary>
      <Suspense
        fallback={
          <Card title="3D Визуализация" icon={Globe}>
            <div className="py-10 text-center text-slate-400">Загрузка 3D сцены...</div>
          </Card>
        }
      >
        <Weather3D condition={condition} />
      </Suspense>
    </Weather3DErrorBoundary>
  );
};

export default SafeWeather3D;

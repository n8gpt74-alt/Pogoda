import { useState, useEffect, useRef } from 'react';
import { Settings, Key, MapPin, X, Check, AlertCircle } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [stormglassKey, setStormglassKey] = useState('');
  const [useGeolocation, setUseGeolocation] = useState(true);
  const [strictTruthMode, setStrictTruthMode] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('owm_api_key') || '';
      const savedGeo = localStorage.getItem('use_geolocation') !== 'false';
      const savedStormglassKey = localStorage.getItem('stormglass_api_key') || '';
      const savedStrictTruth = localStorage.getItem('strict_truth_mode') !== 'false';
      setApiKey(savedKey);
      setStormglassKey(savedStormglassKey);
      setUseGeolocation(savedGeo);
      setStrictTruthMode(savedStrictTruth);
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Проверка API ключа
    if (apiKey) {
      setStatus({ type: 'loading', message: 'Проверка ключа...' });
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=55.75&lon=37.61&appid=${apiKey}`
        );
        if (!res.ok) {
          setStatus({ type: 'error', message: 'Неверный API ключ' });
          return;
        }
        setStatus({ type: 'success', message: 'Ключ действителен!' });
      } catch {
        setStatus({ type: 'error', message: 'Ошибка проверки ключа' });
        return;
      }
    }

    localStorage.setItem('owm_api_key', apiKey.trim());
    localStorage.setItem('stormglass_api_key', stormglassKey.trim());
    localStorage.setItem('use_geolocation', useGeolocation.toString());
    localStorage.setItem('strict_truth_mode', strictTruthMode.toString());

    setStatus({ type: 'success', message: 'Сохранено!' });
    
    setTimeout(() => {
      onSave();
      onClose();
    }, 1000);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700 animate-modal-open"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
              Настройки
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] hover:bg-slate-700 rounded-lg transition-colors -mr-2"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* API Key */}
          <div>
            <label htmlFor="owm-api-key" className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Key className="w-4 h-4" />
              API ключ OpenWeatherMap
            </label>
            <input
              id="owm-api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите ваш API ключ..."
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Получите бесплатный ключ на{' '}
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                openweathermap.org
              </a>
            </p>
          </div>

          {/* Stormglass API Key */}
          <div>
            <label htmlFor="stormglass-api-key" className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Key className="w-4 h-4" />
              API ключ Stormglass (приливы)
            </label>
            <input
              id="stormglass-api-key"
              type="text"
              value={stormglassKey}
              onChange={(e) => setStormglassKey(e.target.value)}
              placeholder="Опционально: для реальных приливов"
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Без этого ключа виджет приливов будет в режиме "Недоступно".
            </p>
          </div>

          {/* Geolocation Toggle */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Геолокация</span>
              </div>
              <button
                type="button"
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  useGeolocation ? 'bg-blue-500' : 'bg-slate-600'
                }`}
                onClick={() => setUseGeolocation(!useGeolocation)}
                role="switch"
                aria-checked={useGeolocation}
                aria-label="Переключить геолокацию"
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    useGeolocation ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Автоматически определять местоположение
            </p>
          </div>

          {/* Strict Truth Mode */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-300">Strict Truth Mode</span>
                <p className="text-xs text-slate-500 mt-1">Запрещает synthetic/mock значения в production-режиме.</p>
              </div>
              <button
                type="button"
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  strictTruthMode ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
                onClick={() => setStrictTruthMode(!strictTruthMode)}
                role="switch"
                aria-checked={strictTruthMode}
                aria-label="Переключить Strict Truth Mode"
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    strictTruthMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status Message */}
          {status.message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              status.type === 'error' ? 'bg-red-500/20 text-red-400' :
              status.type === 'success' ? 'bg-green-500/20 text-green-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : status.type === 'success' ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm active:scale-95"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

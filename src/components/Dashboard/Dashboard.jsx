import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sun, Moon, Settings, MapPin, Navigation, Bell, AlertTriangle } from 'lucide-react';
import useWeather from '../../hooks/useWeather';
import { FullPageLoader } from '../common/Loader';
import SettingsModal from '../common/SettingsModal';
import WeatherAnimation from '../common/WeatherAnimation';
import PWAInstall from '../common/PWAInstall';
import CitySearch from '../common/CitySearch';
import WeatherAlarm from '../common/WeatherAlarm';
import ThemeSelector from '../common/ThemeSelector';
import ParticleBackground from '../common/ParticleBackground';
import SkipLink from '../common/SkipLink';
import WeatherLiveRegion from '../common/WeatherLiveRegion';
import OfflineIndicator from '../common/OfflineIndicator';
import WeatherAlerts from '../Widgets/WeatherAlerts';
import CurrentWeather from '../CurrentWeather/CurrentWeather';
import Forecast from '../Forecast/Forecast';
import TemperatureChart from '../Charts/TemperatureChart';
import HumidityChart from '../Charts/HumidityChart';
import PrecipitationChart from '../Charts/PrecipitationChart';
import WindChart from '../Charts/WindChart';
import WindRose from '../Widgets/WindRose';
import UVIndex from '../Widgets/UVIndex';
import AirQuality from '../Widgets/AirQuality';
import SafeWeather3D from '../Widgets/SafeWeather3D';
import PollenWidget from '../Widgets/PollenWidget';
import AgricultureWidget from '../Widgets/AgricultureWidget';
import PressureWidget from '../Widgets/PressureWidget';
import OutfitWidget from '../Widgets/OutfitWidget';
import ComfortIndexWidget from '../Widgets/ComfortIndexWidget';
import SunProgressWidget from '../Widgets/SunProgressWidget';
import MoonPhaseWidget from '../Widgets/MoonPhaseWidget';
import ExportWidget from '../Widgets/ExportWidget';
import WeatherStatsWidget from '../Widgets/WeatherStatsWidget';
import WeatherMapWidget from '../Widgets/WeatherMapWidget';
import ActivitiesWidget from '../Widgets/ActivitiesWidget';
import ColdIndexWidget from '../Widgets/ColdIndexWidget';
import LaundryIndexWidget from '../Widgets/LaundryIndexWidget';
import PicnicIndexWidget from '../Widgets/PicnicIndexWidget';
import RunningIndexWidget from '../Widgets/RunningIndexWidget';
import LunarCalendarWidget from '../Widgets/LunarCalendarWidget';
import TidesWidget from '../Widgets/TidesWidget';
import GardeningCalendarWidget from '../Widgets/GardeningCalendarWidget';
import useFavorites from '../../hooks/useFavorites';
import useGeolocation from '../../hooks/useGeolocation';

const Dashboard = ({ isDark, toggleTheme }) => {
  const { data, loading, error, refresh, location, hasApiKey } = useWeather();
  const { location: geoLocation, loading: geoLoading, error: geoError, refetch: refetchGeo } = useGeolocation();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [showSettings, setShowSettings] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update body class for weather-based background
  useEffect(() => {
    const body = document.body;
    const condition = data?.current?.condition?.animation;

    // Remove all weather classes
    body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-snowy', 'weather-thunderstorm', 'weather-fog');

    // Add appropriate class
    if (condition) {
      const weatherClass = `weather-${condition}`;
      body.classList.add(weatherClass);
    }
  }, [data]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSettingsSave = () => {
    refresh();
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.15,
      },
    },
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <WeatherAnimation type="cloudy" size={120} />
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-red-400 text-center max-w-md"
        >
          {error}
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <button
            onClick={() => setShowSettings(true)}
            className="px-5 py-2.5 bg-slate-700/80 backdrop-blur-sm text-white rounded-xl hover:bg-slate-600/80 transition-all card-glass button-press"
          >
            Настройки
          </button>
          <button
            onClick={handleRefresh}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all button-press shadow-lg shadow-blue-500/30"
          >
            Повторить
          </button>
        </motion.div>
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      </div>
    );
  }

  return (
    <>
      {/* Skip Link для доступности */}
      <SkipLink />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Live Region для screen reader */}
      <WeatherLiveRegion data={data?.current} />
      
      {/* Particle Background */}
      <ParticleBackground weatherType={data?.current?.condition?.animation || 'clear'} />

      <div className="min-h-screen p-4 md:p-6 lg:p-8 relative z-10">
        <main id="main-content" tabIndex="-1" className="max-w-[1800px] mx-auto">
          {/* Header - Mobile optimized */}
          <motion.header
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4 safe-top"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Logo and Location */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <motion.div
                className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl ring-2 ring-white/10 shadow-lg shadow-blue-500/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <WeatherAnimation
                  type={data?.current?.condition?.animation || 'cloudy'}
                  size={56}
                />
              </motion.div>
              <div className="min-w-0 flex-1">
                <motion.h1
                  className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Метеостанция
                </motion.h1>
                <motion.div
                  className="flex items-center gap-2 text-sm text-slate-400 mt-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{location?.city}, {location?.country}</span>
                  {!hasApiKey && (
                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium border border-amber-500/30">
                      Demo
                    </span>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Controls */}
            <motion.div
              className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-thin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Geolocation Button */}
              <motion.button
                onClick={refetchGeo}
                disabled={geoLoading}
                className="p-2.5 rounded-xl bg-blue-600/50 backdrop-blur-sm hover:bg-blue-600/70 transition-all flex-shrink-0 card-glass button-press disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Моё местоположение"
                aria-label="Моё местоположение"
              >
                <Navigation className={`w-5 h-5 text-blue-300 ${geoLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              <div className="flex-1 lg:flex-none min-w-[180px] lg:min-w-[200px] lg:w-52">
                <CitySearch onCitySelect={(city) => refresh({ lat: city.lat, lon: city.lon })} />
              </div>
              <ThemeSelector />
              
              {/* Settings Button */}
              <motion.button
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 transition-all flex-shrink-0 card-glass button-press"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Настройки"
                aria-label="Настройки"
              >
                <Settings className="w-5 h-5 text-slate-300" />
              </motion.button>
              
              {/* Alarm Button */}
              <motion.button
                onClick={() => setShowAlarm(true)}
                className="p-2.5 rounded-xl bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 transition-all flex-shrink-0 card-glass button-press relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Будильник погоды"
                aria-label="Будильник погоды"
              >
                <Bell className="w-5 h-5 text-slate-300" />
              </motion.button>
              
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 transition-all flex-shrink-0 card-glass button-press"
                whileHover={{ scale: 1.05, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                title={isDark ? 'Светлая тема' : 'Тёмная тема'}
                aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Sun className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Moon className="w-5 h-5 text-slate-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              
              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 card-glass button-press"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Обновить данные"
                aria-label="Обновить данные"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </motion.div>
          </motion.header>

          {/* Main Grid - Responsive */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Weather Alerts - показываем только если есть предупреждения */}
            <WeatherAlerts alerts={[]} current={data?.current} />

            {/* Row 1: Current Weather (full width on mobile, 2 cols on lg) */}
            <CurrentWeather data={data?.current} location={location} />

            {/* Row 2: Comfort & Pressure */}
            <ComfortIndexWidget current={data?.current} />
            <PressureWidget data={data?.current?.pressure} />

            {/* Row 3: What to wear (full width on mobile) */}
            <OutfitWidget current={data?.current} astronomy={data?.astronomy} />

            {/* Row 4: Forecast (full width) */}
            <Forecast hourlyData={data?.hourly} dailyData={data?.daily} />

            {/* Row 5: Sun & Moon */}
            <SunProgressWidget astronomy={data?.astronomy} />
            <MoonPhaseWidget astronomy={data?.astronomy} />

            {/* Row 6: Temperature Chart (full width on mobile) */}
            <TemperatureChart data={data?.hourly} />

            {/* Row 7: Humidity and Wind Rose */}
            <HumidityChart data={data?.hourly} />
            <WindRose data={data?.windRose} />

            {/* Row 8: 3D Visualization */}
            <SafeWeather3D condition={data?.current?.condition} />

            {/* Row 9: UV and Air Quality */}
            <UVIndex value={data?.current?.uvIndex || 0} />
            <AirQuality data={data?.airQuality} />

            {/* Row 10: Precipitation and Wind Charts */}
            <PrecipitationChart data={data?.hourly} />
            <WindChart data={data?.hourly} />

            {/* Row 11: Pollen Widget */}
            <PollenWidget data={data?.pollen} />

            {/* Row 12: Agriculture Widget */}
            <AgricultureWidget data={data?.agriculture} />

            {/* Row 13: Activities Widget */}
            <ActivitiesWidget current={data?.current} astronomy={data?.astronomy} />

            {/* NEW: Health & Lifestyle Widgets */}
            <ColdIndexWidget current={data?.current} />
            <LaundryIndexWidget current={data?.current} />
            <PicnicIndexWidget current={data?.current} />
            <RunningIndexWidget current={data?.current} />

            {/* NEW: Calendar & Special Widgets */}
            <LunarCalendarWidget astronomy={data?.astronomy} />
            <GardeningCalendarWidget agriculture={data?.agriculture} current={data?.current} />
            <TidesWidget location={location} />

            {/* Row 14: Weather Map */}
            <WeatherMapWidget
              location={location}
              coordinates={location?.coordinates}
            />

            {/* Row 15: Weather Stats */}
            <WeatherStatsWidget location={location} />

            {/* Row 16: Export Widget */}
            <div className="col-span-full">
              <ExportWidget weatherData={data} location={location} />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            className="mt-10 lg:mt-12 text-center text-sm text-slate-500 pb-24 md:pb-8 safe-bottom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Метеорологическая станция v2.0</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span className="text-slate-600">
                {hasApiKey ? 'Данные OpenWeatherMap' : 'Демо-режим (тестовые данные)'}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 text-blue-400 hover:text-blue-300 transition-colors text-xs underline underline-offset-4"
            >
              Настроить API
            </button>
          </motion.footer>
        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />

      <WeatherAlarm
        isOpen={showAlarm}
        onClose={() => setShowAlarm(false)}
        currentWeather={data?.current}
        location={location}
      />

      <PWAInstall />
    </>
  );
};

export default Dashboard;

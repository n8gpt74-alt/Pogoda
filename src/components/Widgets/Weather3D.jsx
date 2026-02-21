import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { AdditiveBlending, BackSide, Color, FrontSide, LoadingManager, TextureLoader } from 'three';
import Card from '../common/Card';
import { Globe } from 'lucide-react';

// Реальные текстуры Земли с CDN
const TEXTURES = {
  // Высококачественные текстуры NASA
  earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  earthNormal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  earthSpecular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
};

// Компонент Земли с загрузкой текстур
const Earth = ({ size = 2.5 }) => {
  const meshRef = useRef();
  const cloudsRef = useRef();
  const [textures, setTextures] = useState(null);
  const [error, setError] = useState(null);

  // Загрузка всех текстур
  useEffect(() => {
    const loader = new TextureLoader();
    const loadingManager = new LoadingManager();

    loadingManager.onLoad = () => {
      setTextures(loadedTextures);
    };

    loadingManager.onError = (url) => {
      console.error('Failed to load texture:', url);
      setError('texture');
    };

    const loadedTextures = {};
    let loadedCount = 0;
    const totalTextures = 4;

    const loadTexture = (name, url) => {
      loader.load(
        url,
        (texture) => {
          loadedTextures[name] = texture;
          loadedCount++;
          if (loadedCount === totalTextures) {
            setTextures(loadedTextures);
          }
        },
        undefined,
        () => {
          loadedCount++;
          if (loadedCount === totalTextures) {
            // Даже если некоторые не загрузились, используем что есть
            setTextures(Object.keys(loadedTextures).length > 0 ? loadedTextures : null);
          }
        }
      );
    };

    loadTexture('earth', TEXTURES.earth);
    loadTexture('normal', TEXTURES.earthNormal);
    loadTexture('specular', TEXTURES.earthSpecular);
    loadTexture('clouds', TEXTURES.clouds);

    return () => {
      // Cleanup
      Object.values(loadedTextures).forEach(tex => tex.dispose());
    };
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.07;
    }
  });

  // Fallback если текстуры не загрузились
  if (error) {
    return (
      <Sphere args={[size, 32, 32]}>
        <meshStandardMaterial color="#1e5799" roughness={0.7} />
      </Sphere>
    );
  }

  // Показываем упрощённую версию пока текстуры грузятся
  if (!textures) {
    return (
      <Sphere args={[size, 32, 32]}>
        <meshStandardMaterial color="#1e5799" roughness={0.7} />
      </Sphere>
    );
  }

  return (
    <group ref={meshRef}>
      {/* Земля с реальными текстурами */}
      <Sphere args={[size, 64, 64]}>
        <meshPhongMaterial
          map={textures.earth}
          normalMap={textures.normal}
          specularMap={textures.specular}
          specular={new Color(0x333333)}
          shininess={15}
        />
      </Sphere>

      {/* Облака */}
      <Sphere ref={cloudsRef} args={[size + 0.02, 64, 64]}>
        <meshStandardMaterial
          map={textures.clouds}
          transparent
          opacity={0.4}
          side={FrontSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Атмосферное свечение */}
      <Sphere args={[size + 0.15, 32, 32]}>
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.1}
          side={BackSide}
        />
      </Sphere>
    </group>
  );
};

// Частицы осадков (дождь/снег) вокруг Земли
const Precipitation = ({ type, earthSize = 2.5 }) => {
  const particlesRef = useRef();
  const velocitiesRef = useRef(null);

  const count = type === 'snow' ? 800 : 1200;
  const speed = type === 'snow' ? 0.01 : 0.15;
  const size = type === 'snow' ? 0.08 : 0.04;
  const color = type === 'snow' ? '#ffffff' : '#60a5fa';
  const shellRadius = earthSize + 1;

  // Инициализация частиц в сферической оболочке вокруг Земли
  if (!velocitiesRef.current) {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Сферические координаты для равномерного распределения
      const theta = Math.random() * Math.PI * 2; // азимутальный угол
      const phi = Math.acos(2 * Math.random() - 1); // полярный угол
      const radius = shellRadius + Math.random() * 1.5; // расстояние от центра

      // Преобразование в декартовы координаты
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Скорость падения для каждой частицы
      velocities[i] = speed * (0.8 + Math.random() * 0.4);
    }

    velocitiesRef.current = { positions, velocities };
  }

  useFrame((state, _delta) => {
    if (!particlesRef.current) return;

    const posAttr = particlesRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const { positions, velocities } = velocitiesRef.current;

    for (let i = 0; i < count; i++) {
      // Движение вниз (по Y)
      positions[i * 3 + 1] -= velocities[i];

      // Для дождя добавляем небольшой наклон от ветра
      if (type === 'rain') {
        positions[i * 3] -= 0.02; // небольшой снос по X
      }

      // Для снега добавляем колебания (дрейф)
      if (type === 'snow') {
        positions[i * 3] += Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
        positions[i * 3 + 2] += Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.003;
      }

      // Если частица упала ниже Земли, перемещаем её наверх
      if (positions[i * 3 + 1] < -shellRadius) {
        positions[i * 3 + 1] = shellRadius;
        // Перераспределяем по горизонтали
        const theta = Math.random() * Math.PI * 2;
        const radius = shellRadius + Math.random() * 1.5;
        positions[i * 3] = radius * Math.cos(theta);
        positions[i * 3 + 2] = radius * Math.sin(theta);
      }

      arr[i * 3] = positions[i * 3];
      arr[i * 3 + 1] = positions[i * 3 + 1];
      arr[i * 3 + 2] = positions[i * 3 + 2];
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={velocitiesRef.current?.positions || new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={type === 'snow' ? 0.7 : 0.6}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Молнии для грозы
const Lightning = () => {
  const meshRef = useRef();
  const [visible, setVisible] = useState(false);

  useFrame((_state) => {
    // Случайные вспышки молний
    if (Math.random() < 0.02) {
      setVisible(true);
      setTimeout(() => setVisible(false), 100 + Math.random() * 200);
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.random() * Math.PI * 2;
    }
  });

  if (!visible) return null;

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <mesh position={[1, 1, 2.5]}>
        <cylinderGeometry args={[0.02, 0.05, 2, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-1.5, 0.5, -2]}>
        <cylinderGeometry args={[0.02, 0.05, 1.5, 8]} />
        <meshBasicMaterial color="#fcd34d" />
      </mesh>
    </group>
  );
};

// Туман
const Fog = () => {
  const fogRef = useRef();
  const count = 30;

  useFrame((state, delta) => {
    if (fogRef.current) {
      fogRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={fogRef}>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 8
        ]}>
          <sphereGeometry args={[0.3 + Math.random() * 0.5, 8, 8]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
};

// Солнце
const Sun = () => {
  const sunRef = useRef();

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <mesh ref={sunRef} position={[4, 3, -2]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
};

const Weather3D = ({ condition }) => {
  const weatherType = condition?.animation;
  const showRain = weatherType === 'rain';
  const showSnow = weatherType === 'snow';
  const showThunderstorm = weatherType === 'thunderstorm';
  const showFog = weatherType === 'fog';
  const showSun = weatherType === 'sunny' || weatherType === 'partly-cloudy';

  const earthSize = 2.8; // Увеличенный размер Земли

  return (
    <Card title="3D Визуализация" icon={Globe}>
      <div className="h-80 sm:h-96 rounded-lg overflow-hidden bg-gradient-to-b from-slate-700 to-slate-800">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-slate-400">
            Загрузка 3D...
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
            <ambientLight intensity={showThunderstorm ? 0.2 : 0.5} />
            <directionalLight position={[5, 5, 5]} intensity={showThunderstorm ? 0.6 : 1.2} />
            <pointLight position={[-5, -5, -5]} intensity={0.3} color="#60a5fa" />

            <Earth size={earthSize} />

            {showSun && <Sun />}
            {showRain && <Precipitation type="rain" earthSize={earthSize} />}
            {showSnow && <Precipitation type="snow" earthSize={earthSize} />}
            {showThunderstorm && (
              <>
                <Precipitation type="rain" earthSize={earthSize} />
                <Lightning />
              </>
            )}
            {showFog && <Fog />}

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Canvas>
        </Suspense>
      </div>
      <div className="mt-2 text-center text-xs text-slate-500">
        Интерактивная 3D модель • Перетащите для вращения
      </div>
    </Card>
  );
};

export default Weather3D;

import React, { useEffect, useRef, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  INITIAL_AMMO_SIDE, 
  INITIAL_AMMO_MIDDLE, 
  WIN_SCORE, 
  POINTS_PER_ROCKET, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_GROWTH_SPEED, 
  MISSILE_SPEED, 
  ROCKET_BASE_SPEED,
  COLORS,
  TRANSLATIONS
} from '../constants';
import { GameStatus, Rocket, Missile, Explosion, Turret, City, Point, Star } from '../types';
import { Target, Shield, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [ammo, setAmmo] = useState({ left: INITIAL_AMMO_SIDE, middle: INITIAL_AMMO_MIDDLE, right: INITIAL_AMMO_SIDE });
  const [shieldsAvailable, setShieldsAvailable] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldHits, setShieldHits] = useState(0);

  // Game Engine Refs
  const engineRef = useRef({
    rockets: [] as Rocket[],
    missiles: [] as Missile[],
    explosions: [] as Explosion[],
    turrets: [] as Turret[],
    cities: [] as City[],
    stars: [] as Star[],
    score: 0,
    level: 1,
    lastSpawnTime: 0,
    spawnInterval: 2000,
    rocketsInRound: 10,
    rocketsSpawned: 0,
    shieldsAvailable: 0,
    shieldActive: false,
    shieldHits: 0,
    isGameOver: false,
    isWon: false,
    animationId: 0,
  });

  const t = TRANSLATIONS[language];

  // Generate initial stars for the background
  useEffect(() => {
    engineRef.current.stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    
    const gameLoop = (time: number) => {
      if (gameState === GameStatus.PLAYING) {
        update(time);
      } else {
        draw();
      }
      engineRef.current.animationId = requestAnimationFrame(gameLoop);
    };
    
    engineRef.current.animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(engineRef.current.animationId);
  }, [gameState]);

  // Initialize Game
  const initGame = () => {
    const engine = engineRef.current;
    engine.score = 0;
    engine.level = 1;
    engine.rockets = [];
    engine.missiles = [];
    engine.explosions = [];
    engine.isGameOver = false;
    engine.isWon = false;
    engine.spawnInterval = 2000;
    engine.rocketsInRound = 10;
    engine.rocketsSpawned = 0;
    engine.shieldsAvailable = 0;
    engine.shieldActive = false;
    engine.shieldHits = 0;

    // 3 Turrets
    engine.turrets = [
      { id: 't-left', x: 50, y: CANVAS_HEIGHT - 40, ammo: INITIAL_AMMO_SIDE, maxAmmo: INITIAL_AMMO_SIDE, destroyed: false },
      { id: 't-mid', x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 40, ammo: INITIAL_AMMO_MIDDLE, maxAmmo: INITIAL_AMMO_MIDDLE, destroyed: false },
      { id: 't-right', x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT - 40, ammo: INITIAL_AMMO_SIDE, maxAmmo: INITIAL_AMMO_SIDE, destroyed: false },
    ];

    // 6 Cities
    engine.cities = [
      { id: 'c1', x: 150, y: CANVAS_HEIGHT - 20, destroyed: false },
      { id: 'c2', x: 250, y: CANVAS_HEIGHT - 20, destroyed: false },
      { id: 'c3', x: 350, y: CANVAS_HEIGHT - 20, destroyed: false },
      { id: 'c4', x: 450, y: CANVAS_HEIGHT - 20, destroyed: false },
      { id: 'c5', x: 550, y: CANVAS_HEIGHT - 20, destroyed: false },
      { id: 'c6', x: 650, y: CANVAS_HEIGHT - 20, destroyed: false },
    ];

    setScore(0);
    setLevel(1);
    setAmmo({ left: INITIAL_AMMO_SIDE, middle: INITIAL_AMMO_MIDDLE, right: INITIAL_AMMO_SIDE });
    setShieldsAvailable(0);
    setShieldActive(false);
    setShieldHits(0);
    setGameState(GameStatus.PLAYING);
  };

  const activateShield = () => {
    const engine = engineRef.current;
    if (engine.shieldsAvailable > 0 && !engine.shieldActive) {
      engine.shieldsAvailable--;
      engine.shieldActive = true;
      engine.shieldHits = 0;
      setShieldsAvailable(engine.shieldsAvailable);
      setShieldActive(true);
      setShieldHits(0);
    }
  };

  const nextRound = () => {
    const engine = engineRef.current;
    
    // Calculate bonus score from remaining ammo
    const remainingAmmo = engine.turrets.reduce((acc, t) => acc + (t.destroyed ? 0 : t.ammo), 0);
    engine.score += remainingAmmo * 5; // 5 points per remaining missile
    setScore(engine.score);

    // Award shield every 5 levels if successful
    if (engine.level % 5 === 0) {
      engine.shieldsAvailable++;
      setShieldsAvailable(engine.shieldsAvailable);
    }

    // Refill ammo
    engine.turrets.forEach(t => {
      if (!t.destroyed) t.ammo = t.maxAmmo;
    });
    setAmmo({
      left: engine.turrets[0].ammo,
      middle: engine.turrets[1].ammo,
      right: engine.turrets[2].ammo
    });

    // Increase difficulty
    engine.level++;
    setLevel(engine.level);
    engine.rocketsInRound = 10 + (engine.level * 2);
    engine.rocketsSpawned = 0;
    engine.spawnInterval = Math.max(400, 2000 - (engine.level * 100));
    
    if (engine.score >= WIN_SCORE) {
      setGameState(GameStatus.WON);
    } else {
      setGameState(GameStatus.PLAYING);
    }
  };

  const spawnRocket = () => {
    const engine = engineRef.current;
    if (engine.rocketsSpawned >= engine.rocketsInRound) return;

    const targets = [...engine.cities, ...engine.turrets].filter(t => !t.destroyed);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const rocket: Rocket = {
      id: Math.random().toString(),
      x: Math.random() * CANVAS_WIDTH,
      y: -20,
      target: { x: target.x, y: target.y },
      speed: ROCKET_BASE_SPEED + (engine.level * 0.1),
      color: COLORS.ROCKET,
    };
    engine.rockets.push(rocket);
    engine.rocketsSpawned++;
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Find best turret (closest with ammo)
    const engine = engineRef.current;
    const availableTurrets = engine.turrets
      .filter(t => !t.destroyed && t.ammo > 0)
      .sort((a, b) => {
        const distA = Math.hypot(a.x - x, a.y - y);
        const distB = Math.hypot(b.x - x, b.y - y);
        return distA - distB;
      });

    if (availableTurrets.length > 0) {
      const turret = availableTurrets[0];
      turret.ammo--;
      
      // Update UI ammo
      setAmmo({
        left: engine.turrets[0].ammo,
        middle: engine.turrets[1].ammo,
        right: engine.turrets[2].ammo
      });

      const missile: Missile = {
        id: Math.random().toString(),
        x: turret.x,
        y: turret.y,
        origin: { x: turret.x, y: turret.y },
        target: { x, y },
        speed: MISSILE_SPEED,
        progress: 0,
      };
      engine.missiles.push(missile);
    }
  };

  const update = (time: number) => {
    const engine = engineRef.current;
    if (gameState !== GameStatus.PLAYING) return;

    // Spawn rockets
    if (time - engine.lastSpawnTime > engine.spawnInterval && engine.rocketsSpawned < engine.rocketsInRound) {
      spawnRocket();
      engine.lastSpawnTime = time;
    }

    // Check round end
    if (engine.rocketsSpawned >= engine.rocketsInRound && engine.rockets.length === 0 && engine.missiles.length === 0 && engine.explosions.length === 0) {
      setGameState(GameStatus.ROUND_END);
      setTimeout(nextRound, 2000);
    }

    // Update Rockets (Reverse loop to allow splicing)
    for (let i = engine.rockets.length - 1; i >= 0; i--) {
      const rocket = engine.rockets[i];
      const dx = rocket.target.x - rocket.x;
      const dy = rocket.target.y - rocket.y;
      const dist = Math.hypot(dx, dy);
      const moveY = (dy / dist) * rocket.speed;
      const nextY = rocket.y + moveY;

      // Check shield collision (if rocket crosses the shield line)
      if (engine.shieldActive && rocket.y < CANVAS_HEIGHT - 60 && nextY >= CANVAS_HEIGHT - 60) {
        engine.shieldHits++;
        setShieldHits(engine.shieldHits);
        
        // Create explosion at shield impact
        engine.explosions.push({
          id: Math.random().toString(),
          x: rocket.x + (dx / dist) * (rocket.speed * 0.5),
          y: CANVAS_HEIGHT - 60,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growing: true,
          alpha: 1
        });

        engine.rockets.splice(i, 1);

        if (engine.shieldHits >= 5) {
          engine.shieldActive = false;
          setShieldActive(false);
        }
        continue;
      }

      if (dist < 5) {
        // Hit target
        const target = [...engine.cities, ...engine.turrets].find(t => t.x === rocket.target.x && t.y === rocket.target.y);
        if (target) target.destroyed = true;
        
        // Create explosion at impact
        engine.explosions.push({
          id: Math.random().toString(),
          x: rocket.x,
          y: rocket.y,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growing: true,
          alpha: 1
        });

        engine.rockets.splice(i, 1);
        
        // Check game over
        if (engine.turrets.every(t => t.destroyed)) {
          engine.isGameOver = true;
          setGameState(GameStatus.LOST);
        }
      } else {
        rocket.x += (dx / dist) * rocket.speed;
        rocket.y += (dy / dist) * rocket.speed;
      }
    }

    // Update Missiles
    for (let i = engine.missiles.length - 1; i >= 0; i--) {
      const missile = engine.missiles[i];
      const dx = missile.target.x - missile.origin.x;
      const dy = missile.target.y - missile.origin.y;
      const totalDist = Math.hypot(dx, dy);
      
      missile.progress += missile.speed / totalDist;
      missile.x = missile.origin.x + dx * missile.progress;
      missile.y = missile.origin.y + dy * missile.progress;

      if (missile.progress >= 1) {
        // Create explosion
        engine.explosions.push({
          id: Math.random().toString(),
          x: missile.target.x,
          y: missile.target.y,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growing: true,
          alpha: 1
        });
        engine.missiles.splice(i, 1);
      }
    }

    // Update Explosions
    for (let i = engine.explosions.length - 1; i >= 0; i--) {
      const exp = engine.explosions[i];
      if (exp.growing) {
        exp.radius += EXPLOSION_GROWTH_SPEED;
        if (exp.radius >= exp.maxRadius) exp.growing = false;
      } else {
        exp.radius -= EXPLOSION_GROWTH_SPEED * 0.5;
        exp.alpha -= 0.02;
        if (exp.radius <= 0 || exp.alpha <= 0) {
          engine.explosions.splice(i, 1);
          continue;
        }
      }

      // Check collision with rockets
      for (let j = engine.rockets.length - 1; j >= 0; j--) {
        const rocket = engine.rockets[j];
        const dist = Math.hypot(rocket.x - exp.x, rocket.y - exp.y);
        if (dist < exp.radius) {
          engine.rockets.splice(j, 1);
          engine.score += POINTS_PER_ROCKET;
          setScore(engine.score);
          
          if (engine.score >= WIN_SCORE) {
            engine.isWon = true;
            setGameState(GameStatus.WON);
          }
        }
      }
    }

    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;

    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Stars
    engine.stars.forEach(star => {
      // Subtle twinkling
      if (Math.random() > 0.98) star.opacity = Math.random() * 0.8 + 0.2;
      
      ctx.globalAlpha = star.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Ground
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);

    // Draw Shield
    if (engine.shieldActive) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]); // Dashed line for shield effect
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 60);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 60);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Cities
    engine.cities.forEach(city => {
      if (!city.destroyed) {
        ctx.fillStyle = COLORS.CITY;
        ctx.fillRect(city.x - 15, city.y - 15, 30, 15);
        // Windows
        ctx.fillStyle = '#111';
        ctx.fillRect(city.x - 10, city.y - 10, 5, 5);
        ctx.fillRect(city.x + 5, city.y - 10, 5, 5);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(city.x - 15, city.y - 5, 30, 5);
      }
    });

    // Draw Turrets
    engine.turrets.forEach(turret => {
      if (!turret.destroyed) {
        ctx.fillStyle = COLORS.TURRET;
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 15, Math.PI, 0);
        ctx.fill();
        // Barrel
        ctx.fillRect(turret.x - 4, turret.y - 25, 8, 15);
      } else {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 10, Math.PI, 0);
        ctx.fill();
      }
    });

    // Draw Rockets
    engine.rockets.forEach(rocket => {
      ctx.strokeStyle = rocket.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      // Trail
      const dx = rocket.target.x - rocket.x;
      const dy = rocket.target.y - rocket.y;
      const dist = Math.hypot(dx, dy);
      ctx.lineTo(rocket.x - (dx/dist) * 20, rocket.y - (dy/dist) * 20);
      ctx.stroke();

      // Head
      ctx.fillStyle = rocket.color;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Missiles
    engine.missiles.forEach(missile => {
      ctx.strokeStyle = COLORS.MISSILE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(missile.origin.x, missile.origin.y);
      ctx.lineTo(missile.x, missile.y);
      ctx.stroke();

      // Target X
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      const tx = missile.target.x;
      const ty = missile.target.y;
      ctx.beginPath();
      ctx.moveTo(tx - 5, ty - 5);
      ctx.lineTo(tx + 5, ty + 5);
      ctx.moveTo(tx + 5, ty - 5);
      ctx.lineTo(tx - 5, ty + 5);
      ctx.stroke();
    });

    // Draw Explosions
    engine.explosions.forEach(exp => {
      ctx.globalAlpha = exp.alpha;
      const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, COLORS.EXPLOSION);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans">
      {/* Header UI */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-white font-mono text-xl">{score.toString().padStart(4, '0')}</span>
            <span className="text-white/40 text-xs ml-2">/ {WIN_SCORE}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white/80 text-sm">{t.level} {level}</span>
          </div>
          
          {/* Shield Button */}
          {shieldsAvailable > 0 && !shieldActive && gameState === GameStatus.PLAYING && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={activateShield}
              className="pointer-events-auto mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl border border-blue-400/50 shadow-lg shadow-blue-600/20 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="font-bold text-sm">{language === 'zh' ? '开启防护罩' : 'Activate Shield'} ({shieldsAvailable})</span>
            </motion.button>
          )}

          {shieldActive && gameState === GameStatus.PLAYING && (
            <div className="mt-2 flex items-center gap-2 bg-blue-900/50 backdrop-blur-md border border-blue-500/50 px-4 py-2 rounded-xl">
              <Shield className="w-5 h-5 text-blue-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                  {language === 'zh' ? '防护罩已开启' : 'Shield Active'}
                </span>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-4 rounded-full ${i < (5 - shieldHits) ? 'bg-blue-400' : 'bg-white/10'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end">
          <button 
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs transition-colors border border-white/10"
          >
            {language === 'zh' ? 'English' : '中文'}
          </button>
          
          <div className="flex gap-2">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase mb-1">L</span>
              <div className="h-12 w-2 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
                <motion.div 
                  initial={{ height: '100%' }}
                  animate={{ height: `${(ammo.left / INITIAL_AMMO_SIDE) * 100}%` }}
                  className="w-full bg-blue-500"
                />
              </div>
            </div>
            <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase mb-1">M</span>
              <div className="h-12 w-2 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
                <motion.div 
                  initial={{ height: '100%' }}
                  animate={{ height: `${(ammo.middle / INITIAL_AMMO_MIDDLE) * 100}%` }}
                  className="w-full bg-blue-500"
                />
              </div>
            </div>
            <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase mb-1">R</span>
              <div className="h-12 w-2 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
                <motion.div 
                  initial={{ height: '100%' }}
                  animate={{ height: `${(ammo.right / INITIAL_AMMO_SIDE) * 100}%` }}
                  className="w-full bg-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative aspect-[4/3] w-full max-w-4xl bg-black shadow-2xl shadow-blue-900/20 border border-white/5">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {/* Overlays */}
        <AnimatePresence>
          {gameState !== GameStatus.PLAYING && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center"
            >
              {gameState === GameStatus.START && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="max-w-md"
                >
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter italic">
                    KITTY<span className="text-blue-500">NOVA</span>
                  </h1>
                  <p className="text-white/60 mb-8 text-lg">{t.instructions}</p>
                  <button
                    onClick={initGame}
                    className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
                  >
                    {t.start}
                  </button>
                </motion.div>
              )}

              {(gameState === GameStatus.WON || gameState === GameStatus.LOST) && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className={`text-6xl font-black mb-2 ${gameState === GameStatus.WON ? 'text-green-400' : 'text-red-500'}`}>
                    {gameState === GameStatus.WON ? t.win : t.loss}
                  </div>
                  <div className="text-white/40 mb-8 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-2xl font-mono">{score}</span>
                  </div>
                  <button
                    onClick={initGame}
                    className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95"
                  >
                    {t.restart}
                  </button>
                </motion.div>
              )}

              {gameState === GameStatus.ROUND_END && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-4xl font-black text-blue-400 mb-2 uppercase italic tracking-widest">
                    {language === 'zh' ? '关卡完成' : 'ROUND CLEAR'}
                  </div>
                  <div className="text-white/60 text-lg">
                    {language === 'zh' ? '正在计算弹药奖励...' : 'Calculating ammo bonus...'}
                  </div>
                  {level % 5 === 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-blue-600/50"
                    >
                      <Shield className="w-5 h-5" />
                      <span>{language === 'zh' ? '获得防护罩奖励！' : 'Shield Awarded!'}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex items-center gap-4 text-white/20 text-xs uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>Protect Cities</span>
        </div>
        <div className="w-1 h-1 bg-white/20 rounded-full" />
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Intercept Rockets</span>
        </div>
        <div className="w-1 h-1 bg-white/20 rounded-full" />
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Lead Your Shots</span>
        </div>
      </div>
    </div>
  );
};

export default Game;

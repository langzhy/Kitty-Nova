export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const INITIAL_AMMO_SIDE = 20;
export const INITIAL_AMMO_MIDDLE = 40;

export const WIN_SCORE = 1000;
export const POINTS_PER_ROCKET = 20;

export const EXPLOSION_MAX_RADIUS = 35;
export const EXPLOSION_GROWTH_SPEED = 1.5;
export const MISSILE_SPEED = 5;
export const ROCKET_BASE_SPEED = 0.5;

export const COLORS = {
  BACKGROUND: '#0a0a0a',
  CITY: '#4ade80',
  TURRET: '#3b82f6',
  ROCKET: '#ef4444',
  MISSILE: '#facc15',
  EXPLOSION: '#f97316',
  TEXT: '#ffffff',
  UI_BG: 'rgba(0, 0, 0, 0.7)',
};

export const TRANSLATIONS = {
  en: {
    title: 'Kitty Nova Defense',
    start: 'Start Game',
    restart: 'Play Again',
    win: 'Mission Accomplished!',
    loss: 'Defense Failed!',
    score: 'Score',
    ammo: 'Ammo',
    level: 'Level',
    target: 'Target: 1000',
    instructions: 'Click to intercept rockets. Protect your cities and turrets.',
  },
  zh: {
    title: 'Kitty新星防御',
    start: '开始游戏',
    restart: '再玩一次',
    win: '任务成功！',
    loss: '防御失败！',
    score: '得分',
    ammo: '弹药',
    level: '关卡',
    target: '目标：1000',
    instructions: '点击拦截火箭。保护你的城市和炮台。',
  }
};

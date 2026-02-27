export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
  WON = 'WON',
  LOST = 'LOST'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface Rocket extends Entity {
  target: Point;
  speed: number;
  color: string;
}

export interface Missile extends Entity {
  target: Point;
  origin: Point;
  speed: number;
  progress: number; // 0 to 1
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growing: boolean;
  alpha: number;
}

export interface Turret extends Entity {
  ammo: number;
  maxAmmo: number;
  destroyed: boolean;
}

export interface City extends Entity {
  destroyed: boolean;
}

export interface Star extends Point {
  size: number;
  opacity: number;
}

export interface GameState {
  score: number;
  level: number;
  status: GameStatus;
  rockets: Rocket[];
  missiles: Missile[];
  explosions: Explosion[];
  turrets: Turret[];
  cities: City[];
  language: 'zh' | 'en';
  shieldsAvailable: number;
  shieldActive: boolean;
  shieldHits: number;
}

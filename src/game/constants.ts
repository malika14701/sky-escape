import { type WorldConfig, WorldType } from './types'
export const LANE_POSITIONS: Record<number, number> = { 0: 0.25, 1: 0.50, 2: 0.75 }
export const PLAYER_Y_FRACTION = 0.78; export const PLAYER_WIDTH = 60; export const PLAYER_HEIGHT = 70
export const LANE_CHANGE_SPEED = 12; export const BASE_GAME_SPEED = 250; export const MAX_GAME_SPEED = 1200
export const SPEED_INCREMENT = 0.5; export const OBSTACLE_BASE_SPEED = 200; export const WARNING_DURATION = 0.8
export const INITIAL_LIVES = 3; export const MAX_LIVES = 5; export const INVULNERABILITY_DURATION = 1.5
export const POWERUP_DURATION = 6; export const POWERUP_SPEED = 180; export const SCORE_PER_METER = 10
export const WORLDS: WorldConfig[] = [
  { type: WorldType.Sky, skyTop: '#1a8fc4', skyBottom: '#87CEEB', cloudColor: '#ffffff', cloudColor2: '#e8f0f8', groundColor: '#5a8f3c', fogColor: 'rgba(200,225,240,0.3)', sunColor: '#FFD700', accentColor: '#ff6b35', lightColor: '#ffffff' },
  { type: WorldType.Mountains, skyTop: '#3b5d8c', skyBottom: '#7eb5d6', cloudColor: '#d4dde8', cloudColor2: '#b8c8d8', groundColor: '#4a6741', fogColor: 'rgba(180,200,220,0.3)', sunColor: '#f0c040', accentColor: '#c0392b', lightColor: '#fefefe' },
  { type: WorldType.Ocean, skyTop: '#1a5276', skyBottom: '#5dade2', cloudColor: '#aed6f1', cloudColor2: '#85c1e9', groundColor: '#1a6e7a', fogColor: 'rgba(100,180,220,0.25)', sunColor: '#f9e79f', accentColor: '#e74c3c', lightColor: '#e8f8ff' },
  { type: WorldType.Desert, skyTop: '#d4a056', skyBottom: '#f0d9a0', cloudColor: '#f5e6cc', cloudColor2: '#e8d5b0', groundColor: '#c4953a', fogColor: 'rgba(220,200,160,0.3)', sunColor: '#ff6b00', accentColor: '#e67e22', lightColor: '#fff8e8' },
  { type: WorldType.NightCity, skyTop: '#0a0a1a', skyBottom: '#1a1a3e', cloudColor: '#2a2a4a', cloudColor2: '#3a3a5a', groundColor: '#0d0d1a', fogColor: 'rgba(20,20,50,0.4)', sunColor: '#f0f0ff', accentColor: '#ff0066', lightColor: '#4466ff' },
  { type: WorldType.ThunderStorm, skyTop: '#1a1a2e', skyBottom: '#3d3d5c', cloudColor: '#4a4a6a', cloudColor2: '#2a2a4a', groundColor: '#1a1a2a', fogColor: 'rgba(30,30,60,0.5)', sunColor: '#ffff44', accentColor: '#ff4400', lightColor: '#8888cc' },
  { type: WorldType.Space, skyTop: '#000005', skyBottom: '#0a0a2e', cloudColor: '#1a1a3a', cloudColor2: '#2a1a4a', groundColor: '#050510', fogColor: 'rgba(0,0,20,0.6)', sunColor: '#ffffff', accentColor: '#ff00ff', lightColor: '#6666ff' },
]

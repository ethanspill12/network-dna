export const HELIX_RADIUS = 1.42
export const HELIX_HEIGHT = 7.2
export const HELIX_TURNS = 2.15

export interface HelixCoordinate {
  x: number
  y: number
  z: number
}

export function getHelixCoordinate(progress: number, side: 0 | 1): HelixCoordinate {
  const angle = progress * Math.PI * 2 * HELIX_TURNS + side * Math.PI
  return {
    x: Math.cos(angle) * HELIX_RADIUS,
    y: (progress - 0.5) * HELIX_HEIGHT,
    z: Math.sin(angle) * HELIX_RADIUS,
  }
}

export function getDnaRungLayout(index: number, count: number) {
  const progress = (index + 0.5) / count
  return {
    progress,
    start: getHelixCoordinate(progress, 0),
    end: getHelixCoordinate(progress, 1),
  }
}

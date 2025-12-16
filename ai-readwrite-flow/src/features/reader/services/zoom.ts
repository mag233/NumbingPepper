export type ZoomConfig = {
  min: number
  max: number
  step: number
}

export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  min: 0.5,
  max: 3,
  step: 0.1,
}

const round2 = (value: number) => Math.round(value * 100) / 100

export const clampZoom = (value: number, config: ZoomConfig = DEFAULT_ZOOM_CONFIG) =>
  Math.min(config.max, Math.max(config.min, round2(value)))

export const zoomIn = (current: number, config: ZoomConfig = DEFAULT_ZOOM_CONFIG) =>
  clampZoom(current + config.step, config)

export const zoomOut = (current: number, config: ZoomConfig = DEFAULT_ZOOM_CONFIG) =>
  clampZoom(current - config.step, config)

export const resetZoom = () => 1


import { type FitMode } from '../../../stores/readerStore'

export type PageRenderSize =
  | { mode: 'width'; width: number }
  | { mode: 'height'; height: number }

type Args = {
  fitMode: FitMode
  baseWidth: number
  zoom: number
  availableHeight?: number
}

const clampMin = (value: number, min: number) => Math.max(min, value)

export const getPageRenderSize = ({ fitMode, baseWidth, zoom, availableHeight }: Args): PageRenderSize => {
  if (fitMode === 'fitPage' && typeof availableHeight === 'number') {
    return { mode: 'height', height: clampMin(Math.round(availableHeight), 240) }
  }
  if (fitMode === 'fitWidth') {
    return { mode: 'width', width: clampMin(Math.round(baseWidth), 240) }
  }
  return { mode: 'width', width: clampMin(Math.round(baseWidth * zoom), 240) }
}


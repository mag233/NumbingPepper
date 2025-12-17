import { describe, expect, it, vi } from 'vitest'
import { selectionToHighlight } from './selectionToHighlight'

type RectLike = {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

const rect = (left: number, top: number, width: number, height: number): RectLike => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

describe('selectionToHighlight', () => {
  it('filters client rects that are outside the page host', () => {
    const host = rect(100, 100, 200, 200)
    const inside = rect(120, 120, 30, 10)
    const outside = rect(10, 10, 30, 10)

    const hostEl = document.createElement('div')
    hostEl.setAttribute('data-arwf-page-host', 'true')
    const pageEl = document.createElement('div')
    pageEl.className = 'react-pdf__Page'
    pageEl.setAttribute('data-page-number', '1')
    hostEl.appendChild(pageEl)
    document.body.appendChild(hostEl)

    const range = {
      commonAncestorContainer: pageEl,
      getClientRects: () => [inside, outside] as unknown as DOMRectList,
    } as unknown as Range

    const selection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => 'hello',
      // Unused Selection members for this test.
      addRange: () => undefined,
      collapse: () => undefined,
      collapseToEnd: () => undefined,
      collapseToStart: () => undefined,
      containsNode: () => false,
      deleteFromDocument: () => undefined,
      empty: () => undefined,
      extend: () => undefined,
      getRangeAt: (index: number) => {
        void index
        return range
      },
      modify: () => undefined,
      removeAllRanges: () => undefined,
      removeRange: () => undefined,
      selectAllChildren: () => undefined,
      setBaseAndExtent: () => undefined,
      setPosition: () => undefined,
      anchorNode: null,
      anchorOffset: 0,
      focusNode: null,
      focusOffset: 0,
      type: 'Range',
    } as unknown as Selection

    const spy = vi.spyOn(window, 'getSelection').mockReturnValue(selection)

    const old = hostEl.getBoundingClientRect
    ;(hostEl as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect = () => host as unknown as DOMRect

    try {
      const info = selectionToHighlight()
      expect(info?.rects.length).toBe(1)
    } finally {
      spy.mockRestore()
      ;(hostEl as unknown as { getBoundingClientRect: typeof old }).getBoundingClientRect = old
      hostEl.remove()
    }
  })
})

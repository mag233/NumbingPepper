import { Extension } from '@tiptap/core'
import type { Transaction } from 'prosemirror-state'
import { Plugin, PluginKey } from 'prosemirror-state'
import type { Node as PMNode } from 'prosemirror-model'
import { Decoration, DecorationSet } from 'prosemirror-view'

export type WriterInsertFlashRange = { from: number; to: number }

type FlashMeta = { type: 'set'; range: WriterInsertFlashRange } | { type: 'clear' }

export const writerInsertFlashPluginKey = new PluginKey<DecorationSet>('writerInsertFlash')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    writerInsertFlash: {
      setWriterInsertFlash: (range: WriterInsertFlashRange) => ReturnType
      clearWriterInsertFlash: () => ReturnType
    }
  }
}

const clampRange = (doc: PMNode, range: WriterInsertFlashRange): WriterInsertFlashRange | null => {
  const minPos = 0
  const maxPos = doc.content.size
  const from = Math.max(minPos, Math.min(maxPos, range.from))
  const to = Math.max(minPos, Math.min(maxPos, range.to))
  if (from >= to) return null
  return { from, to }
}

const getMeta = (tr: Transaction): FlashMeta | null => {
  const raw = tr.getMeta(writerInsertFlashPluginKey)
  if (!raw || typeof raw !== 'object') return null
  const meta = raw as Partial<FlashMeta>
  if (meta.type === 'clear') return { type: 'clear' }
  if (meta.type === 'set' && meta.range && typeof meta.range.from === 'number' && typeof meta.range.to === 'number') {
    return { type: 'set', range: meta.range }
  }
  return null
}

const flashClass = 'rounded-[2px] animate-writer-insert-flash'

export const writerInsertFlashExtension = Extension.create({
  name: 'writerInsertFlash',
  addCommands() {
    return {
      setWriterInsertFlash:
        (range) =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(writerInsertFlashPluginKey, { type: 'set', range } satisfies FlashMeta))
          return true
        },
      clearWriterInsertFlash:
        () =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(writerInsertFlashPluginKey, { type: 'clear' } satisfies FlashMeta))
          return true
        },
    }
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: writerInsertFlashPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, prev) => {
            const meta = getMeta(tr)
            if (meta?.type === 'clear') return DecorationSet.empty
            if (meta?.type === 'set') {
              const clamped = clampRange(tr.doc, meta.range)
              if (!clamped) return DecorationSet.empty
              const deco = Decoration.inline(clamped.from, clamped.to, { class: flashClass })
              return DecorationSet.create(tr.doc, [deco])
            }
            return prev.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations: (state) => writerInsertFlashPluginKey.getState(state) ?? null,
        },
      }),
    ]
  },
})

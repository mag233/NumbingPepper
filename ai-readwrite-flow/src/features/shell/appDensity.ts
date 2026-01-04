export type LayoutDensity = 'comfortable' | 'compact'

type CssVarStyle = Record<`--${string}`, string>

export const densityVars = (density: LayoutDensity): CssVarStyle => {
  if (density === 'compact') {
    return {
      '--app-gap': '0.75rem',
      '--app-pad-x': '1rem',
      '--app-pad-y': '1rem',
      '--app-header-py': '0.5rem',
      '--app-footer-px': '1rem',
      '--app-footer-py': '0.5rem',
      '--card-pad': '0.75rem',
      '--card-header-mb': '0.5rem',
    }
  }
  return {
    '--app-gap': '1rem',
    '--app-pad-x': '1.5rem',
    '--app-pad-y': '1.5rem',
    '--app-header-py': '0.75rem',
    '--app-footer-px': '1rem',
    '--app-footer-py': '0.75rem',
    '--card-pad': '1rem',
    '--card-header-mb': '0.75rem',
  }
}

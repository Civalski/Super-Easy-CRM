export type DemoPreviewTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'

export type DemoPreviewStat = {
  label: string
  value: string
  tone?: DemoPreviewTone
}

export type DemoPreviewChip = {
  label: string
  tone?: DemoPreviewTone
  active?: boolean
}

export type DemoPreviewTab = {
  label: string
  count?: string
  active?: boolean
}

export type DemoPreviewAction = {
  label: string
  tone?: 'primary' | 'secondary' | 'ghost'
}

export type DemoPreviewTableCell =
  | string
  | {
      label: string
      tone?: DemoPreviewTone
      emphasis?: 'strong' | 'muted'
      align?: 'left' | 'right'
    }

export type DemoPreviewTable = {
  type: 'table'
  title: string
  span?: 'half' | 'full'
  columns: string[]
  rows: DemoPreviewTableCell[][]
}

export type DemoPreviewList = {
  type: 'list'
  title: string
  span?: 'half' | 'full'
  items: Array<{
    title: string
    meta: string
    detail?: string
    badge?: string
    tone?: DemoPreviewTone
  }>
}

export type DemoPreviewProgress = {
  type: 'progress'
  title: string
  span?: 'half' | 'full'
  items: Array<{
    label: string
    value: string
    progress: number
    meta?: string
    tone?: DemoPreviewTone
  }>
}

export type DemoPreviewKanban = {
  type: 'kanban'
  title: string
  span?: 'half' | 'full'
  columns: Array<{
    title: string
    cards: Array<{
      title: string
      meta: string
      detail?: string
      badge?: string
      tone?: DemoPreviewTone
    }>
  }>
}

export type DemoPreviewSection =
  | DemoPreviewTable
  | DemoPreviewList
  | DemoPreviewProgress
  | DemoPreviewKanban

export type DemoPreviewDefinition = {
  title: string
  subtitle: string
  stats: DemoPreviewStat[]
  toolbar?: {
    searchPlaceholder?: string
    filters?: DemoPreviewChip[]
    tabs?: DemoPreviewTab[]
    actions?: DemoPreviewAction[]
  }
  sections: DemoPreviewSection[]
}

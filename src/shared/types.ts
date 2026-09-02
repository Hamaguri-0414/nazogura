/** 辞書のグループ（テーマ）。要素の並び順は配列の順序で表現する */
export interface Group {
  id: string
  name: string
  category: string
  note: string
  isPublished: boolean
  /** ひらがなのみ、または半角英字（小文字）のみ */
  elements: string[]
  createdAt: string
  updatedAt: string
}

export interface Dictionary {
  groups: Group[]
}

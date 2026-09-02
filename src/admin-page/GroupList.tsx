import { useMemo, useState } from 'react'
import type { Dictionary, Group } from '../shared/types'

interface Props {
  dict: Dictionary
  onNew: () => void
  onEdit: (group: Group) => void
  onImport: () => void
}

export function GroupList({ dict, onNew, onEdit, onImport }: Props) {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')

  const categories = useMemo(
    () => [...new Set(dict.groups.map((g) => g.category).filter((c) => c !== ''))],
    [dict],
  )

  const filtered = dict.groups.filter((g) => {
    if (category !== '' && g.category !== category) return false
    if (keyword === '') return true
    return g.name.includes(keyword) || g.elements.some((el) => el.includes(keyword))
  })

  return (
    <>
      <h1>グループ一覧</h1>
      <p className="lead">全{dict.groups.length}グループ</p>

      <div className="list-toolbar">
        <input
          type="text"
          placeholder="グループ名・要素で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">カテゴリ: すべて</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="primary" onClick={onNew}>
          + 新規グループ
        </button>
        <button onClick={onImport}>一括インポート</button>
      </div>

      <table className="group-table">
        <thead>
          <tr>
            <th>グループ名</th>
            <th>要素数</th>
            <th>カテゴリ</th>
            <th>公開</th>
            <th>更新日</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((g) => (
            <tr key={g.id} onClick={() => onEdit(g)}>
              <td>
                {g.name}
                <div className="muted elements-preview">{g.elements.join('・')}</div>
              </td>
              <td>{g.elements.length}</td>
              <td>{g.category}</td>
              <td>{g.isPublished ? '公開' : '非公開'}</td>
              <td>{g.updatedAt.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="no-result">該当するグループがありません</p>}
    </>
  )
}

import { useRef, useState } from 'react'
import type { Dictionary, Group } from '../shared/types'
import { toBase } from '../shared/normalize'
import { validateElementName } from '../shared/validate'
import { createGroup, deleteGroup, updateGroup } from './api'

interface Props {
  dict: Dictionary
  /** null なら新規作成 */
  group: Group | null
  onDone: () => void
}

interface ElementRow {
  key: number
  value: string
}

let nextKey = 0
const newRow = (value = ''): ElementRow => ({ key: nextKey++, value })

export function GroupEditor({ dict, group, onDone }: Props) {
  const [name, setName] = useState(group?.name ?? '')
  const [note, setNote] = useState(group?.note ?? '')
  const [isPublished, setIsPublished] = useState(group?.isPublished ?? true)
  const [rows, setRows] = useState<ElementRow[]>(() =>
    group !== null ? group.elements.map((el) => newRow(el)) : [newRow()],
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const focusKey = useRef<number | null>(null)
  const dragIndex = useRef<number | null>(null)

  const updateRow = (key: number, value: string) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, value } : r)))
  }

  const insertAfter = (index: number) => {
    const row = newRow()
    focusKey.current = row.key
    setRows((rs) => [...rs.slice(0, index + 1), row, ...rs.slice(index + 1)])
  }

  const removeRow = (key: number) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs))
  }

  const move = (from: number, to: number) => {
    setRows((rs) => {
      if (to < 0 || to >= rs.length) return rs
      const next = [...rs]
      const [row] = next.splice(from, 1)
      next.splice(to, 0, row)
      return next
    })
  }

  const rowError = (value: string): string | null =>
    value === '' ? null : validateElementName(toBase(value))

  const handleSave = async () => {
    const elements = rows.map((r) => toBase(r.value.trim())).filter((v) => v !== '')
    if (name.trim() === '') {
      setSaveError('グループ名を入力してください')
      return
    }
    if (elements.length === 0) {
      setSaveError('要素を1つ以上入力してください')
      return
    }
    for (const el of elements) {
      const err = validateElementName(el)
      if (err !== null) {
        setSaveError(`要素「${el}」: ${err}`)
        return
      }
    }
    const duplicated = dict.groups.some(
      (g) => g.name === name.trim() && g.id !== group?.id,
    )
    if (
      duplicated &&
      !window.confirm(`「${name.trim()}」という名前のグループは既に存在します。このまま保存しますか？`)
    ) {
      return
    }

    setSaving(true)
    setSaveError(null)
    const input = { name: name.trim(), note, isPublished, elements }
    try {
      if (group === null) {
        await createGroup(input)
      } else {
        await updateGroup(group.id, input)
      }
      onDone()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (group === null) return
    if (!window.confirm(`グループ「${group.name}」を削除します。よろしいですか？`)) return
    try {
      await deleteGroup(group.id)
      onDone()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <>
      <div className="editor-header">
        <h1>{group === null ? '新規グループ' : `グループ編集: ${group.name}`}</h1>
        {group !== null && (
          <button className="danger" onClick={() => void handleDelete()}>
            削除
          </button>
        )}
      </div>

      <div className="card editor-form">
        <label className="form-row">
          グループ名
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          公開する
        </label>

        <div className="form-row">
          <span>
            要素（ひらがな or 半角英字・Enterで次を追加・ドラッグで並べ替え）
          </span>
          {rows.map((row, index) => {
            const err = rowError(row.value)
            return (
              <div
                key={row.key}
                className="element-row"
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== index) {
                    move(dragIndex.current, index)
                  }
                  dragIndex.current = null
                }}
              >
                <span className="drag-handle" title="ドラッグで並べ替え">
                  ≡
                </span>
                <input
                  type="text"
                  className={err !== null ? 'invalid' : undefined}
                  value={row.value}
                  ref={(el) => {
                    if (el !== null && focusKey.current === row.key) {
                      el.focus()
                      focusKey.current = null
                    }
                  }}
                  onChange={(e) => updateRow(row.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      insertAfter(index)
                    }
                  }}
                />
                <button onClick={() => move(index, index - 1)} title="上へ">
                  ↑
                </button>
                <button onClick={() => move(index, index + 1)} title="下へ">
                  ↓
                </button>
                <button onClick={() => removeRow(row.key)} title="削除">
                  ×
                </button>
                {err !== null && <span className="field-error">{err}</span>}
              </div>
            )
          })}
          <div>
            <button onClick={() => insertAfter(rows.length - 1)}>+ 要素を追加</button>
          </div>
        </div>

        <label className="form-row">
          備考
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </label>

        {saveError !== null && <p className="field-error">{saveError}</p>}

        <div className="editor-actions">
          <button onClick={onDone}>キャンセル</button>
          <button className="primary" disabled={saving} onClick={() => void handleSave()}>
            保存
          </button>
        </div>
      </div>
    </>
  )
}

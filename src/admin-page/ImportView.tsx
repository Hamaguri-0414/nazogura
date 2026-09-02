import { useState } from 'react'
import type { Dictionary } from '../shared/types'
import { parseImportText, type ParsedLine } from '../shared/importParser'
import { importGroups, type ImportResult } from './api'

interface Props {
  dict: Dictionary
  onDone: () => void
}

interface PreviewLine extends ParsedLine {
  duplicated: boolean
}

export function ImportView({ dict, onDone }: Props) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<PreviewLine[] | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const existingNames = new Set(dict.groups.map((g) => g.name))

  const handlePreview = () => {
    const lines = parseImportText(text).map((line) => ({
      ...line,
      duplicated: line.ok && existingNames.has(line.groupName!),
    }))
    setPreview(lines)
    setResult(null)
    setError(null)
  }

  const importable = (preview ?? []).filter((l) => l.ok && !l.duplicated)

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    try {
      const res = await importGroups(
        importable.map((l) => ({ name: l.groupName!, elements: l.elements! })),
      )
      setResult(res)
      setPreview(null)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <h1>一括インポート</h1>
      <p className="lead">
        1行1グループで貼り付けてください。形式: <code>グループ名: 要素, 要素, ...</code>
      </p>

      <div className="card">
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'指の名前: おや, ひとさし, なか, くすり, こ\n曜日: にち, げつ, か, すい, もく, きん, ど'}
        />
        <div className="editor-actions">
          <button onClick={onDone}>一覧へ戻る</button>
          <button className="primary" onClick={handlePreview} disabled={text.trim() === ''}>
            プレビュー
          </button>
        </div>
      </div>

      {preview !== null && (
        <div className="card">
          <h2>プレビュー</h2>
          <ul className="preview-list">
            {preview.map((line) => (
              <li
                key={line.lineNo}
                className={!line.ok ? 'preview-error' : line.duplicated ? 'preview-skip' : 'preview-ok'}
              >
                {!line.ok ? (
                  <>
                    × {line.lineNo}行目: {line.error}（{line.raw}）
                  </>
                ) : line.duplicated ? (
                  <>
                    △ {line.lineNo}行目: 「{line.groupName}」は既に存在します（スキップ）
                  </>
                ) : (
                  <>
                    ○ {line.groupName}（{line.elements!.length}要素）
                  </>
                )}
              </li>
            ))}
          </ul>
          {preview.length === 0 && <p className="muted">読み取れる行がありません</p>}
          <div className="editor-actions">
            <span className="muted">取り込み対象: {importable.length}件</span>
            <button
              className="primary"
              disabled={importable.length === 0 || importing}
              onClick={() => void handleImport()}
            >
              取り込み実行
            </button>
          </div>
        </div>
      )}

      {error !== null && <p className="field-error">{error}</p>}

      {result !== null && (
        <div className="card">
          <h2>取り込み結果</h2>
          <p>{result.imported.length}件を取り込みました: {result.imported.join('、')}</p>
          {result.skipped.length > 0 && (
            <ul className="preview-list">
              {result.skipped.map((s, i) => (
                <li key={i} className="preview-skip">
                  △ {s.name}: {s.reason}
                </li>
              ))}
            </ul>
          )}
          <div className="editor-actions">
            <button className="primary" onClick={onDone}>
              一覧へ戻る
            </button>
          </div>
        </div>
      )}
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import type { Dictionary, Group } from '../shared/types'
import { fetchDictionary } from './api'
import { GroupList } from './GroupList'
import { GroupEditor } from './GroupEditor'
import { ImportView } from './ImportView'

type View =
  | { name: 'list' }
  | { name: 'edit'; group: Group | null }
  | { name: 'import' }

export function App() {
  const [dict, setDict] = useState<Dictionary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ name: 'list' })

  const reload = useCallback(() => {
    fetchDictionary()
      .then((d) => {
        setDict(d)
        setLoadError(null)
      })
      .catch((err: Error) => setLoadError(err.message))
  }, [])

  useEffect(reload, [reload])

  const backToList = () => {
    reload()
    setView({ name: 'list' })
  }

  return (
    <>
      <div className="admin-banner">ローカル管理モード - 編集内容は辞書マスターJSONに保存されます</div>
      <header className="site-header">
        <span className="brand">
          Riddles <span>辞書管理</span>
        </span>
      </header>
      <main>
        {loadError !== null && (
          <p className="field-error">
            辞書を読み込めません（{loadError}）。`npm run admin` で起動していますか？
          </p>
        )}
        {dict !== null && view.name === 'list' && (
          <GroupList
            dict={dict}
            onNew={() => setView({ name: 'edit', group: null })}
            onEdit={(group) => setView({ name: 'edit', group })}
            onImport={() => setView({ name: 'import' })}
          />
        )}
        {dict !== null && view.name === 'edit' && (
          <GroupEditor dict={dict} group={view.group} onDone={backToList} />
        )}
        {dict !== null && view.name === 'import' && (
          <ImportView dict={dict} onDone={backToList} />
        )}
      </main>
    </>
  )
}

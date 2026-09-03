import type { ComposeOptions } from '../shared/wordCompose'

/** 両ツール共通の拾い方オプションのチェックボックス群 */
export function ComposeOptionsFields({
  options,
  onChange,
}: {
  options: ComposeOptions
  onChange: (next: ComposeOptions) => void
}) {
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={options.ignoreVariants}
          onChange={(e) => onChange({ ...options, ignoreVariants: e.target.checked })}
        />
        濁音・半濁音・小さい文字は区別しない
      </label>
      <label>
        <input
          type="checkbox"
          checked={options.allowMultiPick}
          onChange={(e) => onChange({ ...options, allowMultiPick: e.target.checked })}
        />
        同じ要素から2文字以上拾うことを許可する
      </label>
    </>
  )
}

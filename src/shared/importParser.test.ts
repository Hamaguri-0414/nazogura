import { describe, expect, it } from 'vitest'
import { parseImportText } from './importParser'

describe('parseImportText', () => {
  it('正常な行をパースできる', () => {
    const [line] = parseImportText('指の名前: おや, ひとさし, なか, くすり, こ')
    expect(line.ok).toBe(true)
    expect(line.groupName).toBe('指の名前')
    expect(line.elements).toEqual(['おや', 'ひとさし', 'なか', 'くすり', 'こ'])
  })

  it('全角コロン・読点・カタカナ・英大文字も受け付けて正規化する', () => {
    const [line] = parseImportText('音階：ド、レ、ミ、FA')
    expect(line.ok).toBe(true)
    expect(line.elements).toEqual(['ど', 'れ', 'み', 'fa'])
  })

  it('空行は無視する', () => {
    const lines = parseImportText('\n指の名前: おや\n\n曜日: にち\n')
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.lineNo)).toEqual([2, 4])
  })

  it('コロンがない行はエラー', () => {
    const [line] = parseImportText('指の名前 おや')
    expect(line.ok).toBe(false)
    expect(line.error).toContain('形式')
  })

  it('使えない文字種を含む要素はエラー', () => {
    const [line] = parseImportText('曜日: 火, すい')
    expect(line.ok).toBe(false)
    expect(line.error).toContain('火')
  })

  it('要素が空の行はエラー', () => {
    const [line] = parseImportText('指の名前:')
    expect(line.ok).toBe(false)
  })
})

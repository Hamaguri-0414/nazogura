// 単語リスト変換スクリプト
// 出典リポジトリ（Hamaguri-0414/wordSearch）の buta014*.dic を
// public/data/words/ 配下の配信用ファイルに変換する。
//
// 使い方: node scripts/convert-words.mjs <dicファイルのあるディレクトリ>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DICTIONARIES = [
  { id: 'core', name: 'コア辞書', src: 'buta014_core.dic' },
  { id: 'common', name: '一般辞書', src: 'buta014_common.dic' },
  { id: 'buta', name: '豚辞書', src: 'buta014.dic' },
]

const WORD_RE = /^[ぁ-ゖー]+$/u

const srcDir = process.argv[2]
if (!srcDir) {
  console.error('使い方: node scripts/convert-words.mjs <dicファイルのあるディレクトリ>')
  process.exit(1)
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/data/words')
mkdirSync(outDir, { recursive: true })

const index = []
for (const dict of DICTIONARIES) {
  const raw = readFileSync(join(srcDir, dict.src), 'utf-8')
  const words = [...new Set(raw.split(/\r?\n/).filter((w) => w !== ''))]
  const invalid = words.filter((w) => !WORD_RE.test(w))
  if (invalid.length > 0) {
    console.error(`${dict.src}: 不正な単語が${invalid.length}件あります`, invalid.slice(0, 5))
    process.exit(1)
  }
  const file = `${dict.id}.txt`
  writeFileSync(join(outDir, file), words.join('\n') + '\n')
  index.push({ id: dict.id, name: dict.name, file, count: words.length })
  console.log(`${dict.name}: ${words.length}語 -> ${file}`)
}

writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n')
console.log('index.json を更新しました')

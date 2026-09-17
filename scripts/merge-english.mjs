// 平易な英単語辞書の統合スクリプト
// english.txt（CEFR-J A1+A2由来、2,117語）と target1200.csv
// （『英単語ターゲット1200』由来、1,400語）を重複なく統合し、
// public/data/words/english-all.txt を生成する。
// english.txt と同じ収録方針（機能語を含まない・英小文字3文字以上）に揃える。
// 詳細: docs/requirements/english-word-dictionary.md
//
// 使い方: node scripts/merge-english.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 英小文字のみ3文字以上（複合語・略語・アポストロフィ入りは除外） */
const WORD_RE = /^[a-z]{3,}$/

/** 出典（ターゲット1200）側の誤植・表記の修正 */
const FIXES = new Map([
  ['e-mail', 'email'],
  ['businesss', 'business'],
  ['devide', 'divide'],
])

/**
 * 機能語の除外リスト（convert-cefrj.mjs の STOP_WORDS と同方針）。
 * ターゲット1200には品詞情報がないため、CEFR-Jで機械的に除外していた
 * 前置詞・接続詞・代名詞・限定詞・談話標識に当たる語を明示的に挙げる。
 */
const FUNCTION_WORDS = new Set([
  // convert-cefrj.mjs の STOP_WORDS と同じもの
  'not', 'very', 'too', 'how', 'when', 'where', 'why', 'there', 'here',
  'then', 'else', 'either', 'also', 'yes', 'yeah', 'okay', 'please',
  'however', 'therefore', 'indeed', 'anyway',
  // 前置詞・接続詞
  'against', 'although', 'because', 'beneath', 'beside', 'between',
  'beyond', 'during', 'except', 'since', 'though', 'through',
  'throughout', 'toward', 'unless', 'until', 'whether', 'while',
  'within', 'without', 'nor', 'per', 'plus',
  // 代名詞・複合不定代名詞
  'another', 'anyone', 'anything', 'everyone', 'everything',
  'nobody', 'none', 'nothing', 'someone', 'something',
  'whatever', 'whenever', 'wherever', 'whichever',
  // 限定詞・数量詞
  'each', 'other', 'such', 'few', 'several', 'least',
  // 談話標識
  'moreover',
])

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wordsDir = join(root, 'public', 'data', 'words')

const sources = ['english.txt', 'target1200.csv']
const merged = new Set()
let skipped = 0
for (const file of sources) {
  const lines = readFileSync(join(wordsDir, file), 'utf-8').split('\n')
  for (const line of lines) {
    const raw = line.trim().toLowerCase()
    if (raw === '') continue
    const word = FIXES.get(raw) ?? raw
    if (!WORD_RE.test(word) || FUNCTION_WORDS.has(word)) {
      skipped++
      continue
    }
    merged.add(word)
  }
}

const words = [...merged].sort()
writeFileSync(join(wordsDir, 'english-all.txt'), words.join('\n') + '\n')
console.log(`english-all.txt: ${words.length}語（除外 ${skipped}語）`)

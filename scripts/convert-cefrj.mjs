// 平易な英単語辞書の変換スクリプト
// CEFR-J Wordlist Version 1.6（東京外国語大学 投野由紀夫研究室）の
// A1・A2レベルから、能力向上ツール（英語版）の答えに使える単語を抽出し、
// public/data/words/english.txt に変換する。
// 詳細: docs/requirements/english-word-dictionary.md
//
// 使い方: node scripts/convert-cefrj.mjs [配布zipのパス]
//   パス省略時は公式サイトからダウンロードする。
//   依存パッケージなし（xlsxの展開に unzip コマンドを使う）。

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ZIP_URL = 'http://www.cefr-j.org/data/CEFRJ_wordlist_ver1.6.zip'
/** 抽出するレベル（≒中学までの語彙） */
const LEVELS = ['A1', 'A2']
/**
 * 残す品詞。冠詞・代名詞・前置詞・be動詞などの機能語を除外する。
 * number（one, eight 等の数詞）は機能語ではないため残す。
 */
const KEEP_POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'number'])
/** 英小文字のみ3文字以上（複合語・略語・アポストロフィ入りは除外） */
const WORD_RE = /^[a-z]{3,}$/
/**
 * 品詞は残す対象だが、文法機能が中心で答えの単語に不向きな語
 * （adverb扱いの否定辞・疑問詞・指示語・応答語・談話標識）
 */
const STOP_WORDS = new Set([
  'not', 'very', 'too', 'how', 'when', 'where', 'why', 'there', 'here',
  'then', 'else', 'either', 'also', 'yes', 'yeah', 'okay', 'please',
  'however', 'therefore', 'indeed', 'anyway',
])

const unescapeXml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/** xlsx（zip）内の1ファイルを文字列として取り出す */
function readZipEntry(zipPath, entry) {
  return execFileSync('unzip', ['-p', zipPath, entry], {
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

/** シート名 → シートXMLのパス を workbook.xml と rels から解決する */
function sheetPaths(xlsxPath) {
  const workbook = readZipEntry(xlsxPath, 'xl/workbook.xml')
  const rels = readZipEntry(xlsxPath, 'xl/_rels/workbook.xml.rels')
  const targetById = new Map(
    [...rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2]]),
  )
  const paths = new Map()
  for (const m of workbook.matchAll(/<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"/g)) {
    const target = targetById.get(m[2])
    if (target !== undefined) paths.set(m[1], `xl/${target}`)
  }
  return paths
}

/** シートXMLを行列（文字列の2次元配列）にする */
function parseSheet(xlsxPath, entry, strings) {
  const xml = readZipEntry(xlsxPath, entry)
  const rows = []
  for (const rowMatch of xml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
    const cells = []
    for (const cellMatch of rowMatch[1].matchAll(
      /<c ([^>]*?)\/?>(?:<v>(.*?)<\/v>)?(?:<\/c>)?/g,
    )) {
      const ref = /r="([A-Z]+)\d+"/.exec(cellMatch[1])?.[1]
      if (ref === undefined) continue
      const type = /t="(\w+)"/.exec(cellMatch[1])?.[1]
      const col = [...ref].reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
      let value = cellMatch[2] ?? ''
      if (type === 's') value = strings[Number(value)] ?? ''
      cells[col] = unescapeXml(value)
    }
    rows.push(cells)
  }
  return rows
}

// --- 配布zipの用意 ---
let zipPath = process.argv[2]
let tempDir = null
if (zipPath === undefined) {
  console.log(`ダウンロード中: ${ZIP_URL}`)
  const res = await fetch(ZIP_URL)
  if (!res.ok) {
    console.error(`ダウンロードに失敗しました: ${res.status}`)
    process.exit(1)
  }
  tempDir = mkdtempSync(join(tmpdir(), 'cefrj-'))
  zipPath = join(tempDir, 'cefrj.zip')
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))
}

// 配布zipの中のxlsxを取り出す
const listing = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf-8' })
const xlsxEntry = listing.split('\n').find((l) => l.endsWith('.xlsx'))
if (xlsxEntry === undefined) {
  console.error('zip内にxlsxが見つかりません')
  process.exit(1)
}
const extractDir = tempDir ?? mkdtempSync(join(tmpdir(), 'cefrj-'))
execFileSync('unzip', ['-o', '-q', zipPath, xlsxEntry, '-d', extractDir])
const xlsxPath = join(extractDir, xlsxEntry)

// --- 抽出 ---
const sharedXml = readZipEntry(xlsxPath, 'xl/sharedStrings.xml')
const strings = [...sharedXml.matchAll(/<si>(.*?)<\/si>/gs)].map((m) =>
  [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((t) => t[1]).join(''),
)
const paths = sheetPaths(xlsxPath)

const kept = new Set()
const droppedPos = new Map()
let totalRows = 0
for (const level of LEVELS) {
  const entry = paths.get(level)
  if (entry === undefined) {
    console.error(`シート ${level} が見つかりません`)
    process.exit(1)
  }
  const [header, ...rows] = parseSheet(xlsxPath, entry, strings)
  if (header[0] !== 'headword' || header[1] !== 'pos') {
    console.error(`${level}: 想定外の列構成です`, header.slice(0, 3))
    process.exit(1)
  }
  totalRows += rows.length
  for (const row of rows) {
    const pos = row[1] ?? ''
    if (!KEEP_POS.has(pos)) {
      droppedPos.set(pos, (droppedPos.get(pos) ?? 0) + 1)
      continue
    }
    // 見出し語は「a.m./A.M./am/AM」のように表記ゆれが / 区切りで並ぶ
    for (const variant of (row[0] ?? '').split('/')) {
      const word = variant.trim().toLowerCase()
      if (WORD_RE.test(word) && !STOP_WORDS.has(word)) kept.add(word)
    }
  }
}

const words = [...kept].sort()
const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public/data/words/english.txt',
)
writeFileSync(outPath, words.join('\n') + '\n')

console.log(`入力: ${LEVELS.join('+')} 全${totalRows}項目`)
console.log(
  '品詞で除外:',
  [...droppedPos.entries()].map(([p, n]) => `${p}(${n})`).join(' '),
)
console.log(`出力: ${words.length}語 -> public/data/words/english.txt`)
if (tempDir !== null) rmSync(tempDir, { recursive: true, force: true })

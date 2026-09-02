/**
 * 増加路探索による二部グラフの最大マッチングのサイズ。
 * candidates[i] = 左側i番目の頂点（答えの文字）が接続できる右側頂点（要素）の一覧。
 */
export function maxMatchingSize(candidates: number[][], elementCount: number): number {
  const elementOwner = new Array<number>(elementCount).fill(-1)
  const tryAssign = (i: number, visited: boolean[]): boolean => {
    for (const j of candidates[i]) {
      if (visited[j]) continue
      visited[j] = true
      if (elementOwner[j] === -1 || tryAssign(elementOwner[j], visited)) {
        elementOwner[j] = i
        return true
      }
    }
    return false
  }
  let size = 0
  for (let i = 0; i < candidates.length; i++) {
    if (tryAssign(i, new Array<boolean>(elementCount).fill(false))) size++
  }
  return size
}

// ============================================================
// ANALYTICS ENGINE - Tính toán thống kê từ lịch sử kỳ quay
// Pure functions, không có side effects
// ============================================================

import type { DrawResult, GameType, Timeframe, AnalyticsResult, HotNumber, ColdNumber, NumberPair } from '../types'
import { getDrawsByTimeframe } from './storage'

/**
 * Tính toán Hot Numbers: Top 10 số xuất hiện nhiều nhất
 * trong khung thời gian đã chọn
 */
function calcHotNumbers(draws: DrawResult[], totalRange: number): HotNumber[] {
  const frequencyMap = new Map<number, number>()

  // Khởi tạo tất cả số về 0
  for (let i = 1; i <= totalRange; i++) {
    frequencyMap.set(i, 0)
  }

  // Đếm tần suất
  for (const draw of draws) {
    for (const num of draw.numbers) {
      frequencyMap.set(num, (frequencyMap.get(num) ?? 0) + 1)
    }
  }

  const totalDraws = draws.length

  // Sort và lấy top 10
  const sorted: HotNumber[] = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([number, count]) => ({
      number,
      count,
      percentage: totalDraws > 0 ? parseFloat(((count / totalDraws) * 100).toFixed(1)) : 0,
    }))

  return sorted
}

/**
 * Tính Max Historical Gan cho một số cụ thể
 * Sliding window qua toàn bộ lịch sử để tìm gap lớn nhất
 */
function calcMaxHistoricalGan(allDraws: DrawResult[], number: number): number {
  let maxGan = 0
  let currentGap = 0

  // Duyệt từ cũ nhất đến mới nhất (reverse)
  const reversed = [...allDraws].reverse()

  for (const draw of reversed) {
    if (draw.numbers.includes(number)) {
      if (currentGap > maxGan) maxGan = currentGap
      currentGap = 0
    } else {
      currentGap++
    }
  }
  // Xử lý gap cuối (từ lần xuất hiện cuối đến hiện tại)
  if (currentGap > maxGan) maxGan = currentGap

  return maxGan
}

/**
 * Tính Current Gan: Số kỳ liên tiếp từ hiện tại chưa xuất hiện
 */
function calcCurrentGan(allDraws: DrawResult[], number: number): number {
  let gan = 0
  // Duyệt từ kỳ mới nhất
  for (const draw of allDraws) {
    if (draw.numbers.includes(number)) break
    gan++
  }
  return gan
}

/**
 * Tính toán Cold Numbers: Top 10 số lâu không xuất hiện nhất
 * Kèm chỉ số Gan hiện tại và Gan lịch sử tối đa
 */
function calcColdNumbers(draws: DrawResult[], allDraws: DrawResult[], totalRange: number): ColdNumber[] {
  const frequencyMap = new Map<number, number>()

  // Khởi tạo
  for (let i = 1; i <= totalRange; i++) {
    frequencyMap.set(i, 0)
  }

  // Đếm tần suất trong timeframe
  for (const draw of draws) {
    for (const num of draw.numbers) {
      frequencyMap.set(num, (frequencyMap.get(num) ?? 0) + 1)
    }
  }

  const coldNumbers: ColdNumber[] = []

  for (let num = 1; num <= totalRange; num++) {
    const count = frequencyMap.get(num) ?? 0
    const currentGan = calcCurrentGan(allDraws, num)
    const maxHistoricalGan = calcMaxHistoricalGan(allDraws, num)

    coldNumbers.push({
      number: num,
      count,
      currentGan,
      maxHistoricalGan,
      isNearPeak: maxHistoricalGan > 0 && currentGan >= maxHistoricalGan * 0.8,
    })
  }

  // Sort theo currentGan giảm dần, lấy top 10
  return coldNumbers
    .sort((a, b) => b.currentGan - a.currentGan)
    .slice(0, 10)
}

/**
 * Tính toán Co-occurrence Pairs: Top 6 cặp số hay đi cùng nhau nhất
 */
function calcTopPairs(draws: DrawResult[]): NumberPair[] {
  const pairMap = new Map<string, number>()

  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b)
    // Generate tất cả C(6,2) = 15 cặp
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`
        pairMap.set(key, (pairMap.get(key) ?? 0) + 1)
      }
    }
  }

  return Array.from(pairMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, count]) => {
      const parts = key.split('-').map(Number)
      return { pair: [parts[0], parts[1]] as [number, number], count }
    })
}

/**
 * Hàm chính: Tính toán toàn bộ analytics từ dữ liệu
 */
export function computeAnalytics(
  allDraws: DrawResult[],
  gameType: GameType,
  timeframe: Timeframe
): AnalyticsResult {
  const totalRange = gameType === 'mega645' ? 45 : 55
  const timeframeDraws = getDrawsByTimeframe(allDraws, timeframe)

  const hotNumbers = calcHotNumbers(timeframeDraws, totalRange)
  const coldNumbers = calcColdNumbers(timeframeDraws, allDraws, totalRange)
  const topPairs = calcTopPairs(timeframeDraws)

  return {
    hotNumbers,
    coldNumbers,
    topPairs,
    totalDraws: allDraws.length,
    timeframeDraws: timeframeDraws.length,
  }
}

/**
 * Lấy Set các số hot từ analytics result (để dùng trong generator)
 */
export function getHotNumberSet(analytics: AnalyticsResult): Set<number> {
  return new Set(analytics.hotNumbers.map(h => h.number))
}

/**
 * Lấy Set các số cold near-peak (để dùng trong generator và checker)
 */
export function getColdNearPeakSet(analytics: AnalyticsResult): Set<number> {
  return new Set(analytics.coldNumbers.filter(c => c.isNearPeak).map(c => c.number))
}

/**
 * Lấy tất cả các cặp số top dưới dạng Set key string
 */
export function getTopPairKeys(analytics: AnalyticsResult): Set<string> {
  const keys = new Set<string>()
  for (const pair of analytics.topPairs) {
    keys.add(`${pair.pair[0]}-${pair.pair[1]}`)
  }
  return keys
}

/**
 * Kiểm tra dãy số có chứa ít nhất 1 cặp top không
 */
export function containsTopPair(numbers: number[], topPairKeys: Set<string>): boolean {
  const sorted = [...numbers].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const key = `${sorted[i]}-${sorted[j]}`
      if (topPairKeys.has(key)) return true
    }
  }
  return false
}

/**
 * Đếm số lượng hot numbers trong dãy
 */
export function countHotInSet(numbers: number[], hotSet: Set<number>): number {
  return numbers.filter(n => hotSet.has(n)).length
}

/**
 * Đếm số lượng cold near-peak trong dãy
 */
export function countColdNearPeakInSet(numbers: number[], coldNearPeakSet: Set<number>): number {
  return numbers.filter(n => coldNearPeakSet.has(n)).length
}

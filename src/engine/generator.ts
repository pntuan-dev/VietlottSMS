// ============================================================
// GENERATOR ENGINE - Tạo 3 bộ số theo 3 chiến thuật
// Sử dụng Weighted Random + 5 Golden Filters
// ============================================================

import type { DrawResult, GameType, GeneratedSet, AnalyticsResult, Strategy } from '../types'
import { applyFilters, applyQuickFilters } from './filters'
import { generateId } from '../utils/storage'
import {
  getHotNumberSet,
  getColdNearPeakSet,
  getTopPairKeys,
  countHotInSet,
  countColdNearPeakInSet,
  containsTopPair,
} from '../utils/analytics'

const MAX_RETRY = 10000

/** Chọn ngẫu nhiên có trọng số từ pool */
function weightedRandom(pool: Array<{ value: number; weight: number }>): number {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of pool) {
    random -= item.weight
    if (random <= 0) return item.value
  }
  return pool[pool.length - 1].value
}

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Tính điểm ưu tiên của một số dựa trên analytics */
function calcWeight(
  num: number,
  hotNumbers: AnalyticsResult['hotNumbers'],
  coldNearPeakSet: Set<number>
): number {
  const hotEntry = hotNumbers.find(h => h.number === num)
  let weight = 1.0

  if (hotEntry) {
    weight = 1.0 + hotEntry.percentage / 10
  }

  if (coldNearPeakSet.has(num)) {
    weight += 0.3
  }

  return weight
}

/**
 * Chiến thuật 1 - "Phong Độ Cao" (Hot & Pair Focus)
 * Ưu tiên 4-5 số từ top hot numbers, đảm bảo ít nhất 1 cặp top
 */
function generateHotStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): number[] | null {
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)
  const topPairKeys = getTopPairKeys(analytics)

  const hotPool = analytics.hotNumbers.map(h => ({
    value: h.number,
    weight: calcWeight(h.number, analytics.hotNumbers, coldNearPeakSet),
  }))
  const neutralPool = allNumbers
    .filter(n => !hotSet.has(n))
    .map(n => ({ value: n, weight: calcWeight(n, analytics.hotNumbers, coldNearPeakSet) }))

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    // Chọn 4-5 từ hot pool
    const hotCount = Math.random() < 0.5 ? 4 : 5
    const selected = new Set<number>()

    const shuffledHot = shuffle(hotPool)
    while (selected.size < hotCount && shuffledHot.length > 0) {
      const picked = weightedRandom(shuffledHot.filter(h => !selected.has(h.value)))
      selected.add(picked)
    }

    // Bổ sung từ neutral pool
    const shuffledNeutral = shuffle(neutralPool)
    while (selected.size < 6 && shuffledNeutral.length > 0) {
      const picked = weightedRandom(shuffledNeutral.filter(n => !selected.has(n.value)))
      selected.add(picked)
    }

    if (selected.size < 6) continue

    const candidate = [...selected]

    // Kiểm tra F2-F5 trước (nhanh)
    if (!applyQuickFilters(candidate, gameType)) continue

    // Kiểm tra có chứa ít nhất 1 cặp top
    if (!containsTopPair(candidate, topPairKeys) && analytics.topPairs.length > 0) continue

    // Kiểm tra F1 (Zero-Repeat - chậm hơn, làm sau)
    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    return candidate.sort((a, b) => a - b)
  }

  return null
}

/**
 * Chiến thuật 2 - "Cân Bằng & Đón Sóng" (Balanced & Overdue)
 * 3 Số Nóng + 2 Số Lạnh gần đỉnh + 1 số trung lập
 */
function generateBalancedStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): number[] | null {
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  const hotPool = analytics.hotNumbers.map(h => ({
    value: h.number,
    weight: calcWeight(h.number, analytics.hotNumbers, coldNearPeakSet),
  }))

  // Cold near-peak được ưu tiên cao, cold thường thấp hơn
  const coldPool = analytics.coldNumbers.map(c => ({
    value: c.number,
    weight: c.isNearPeak ? 3.0 : 1.5,
  }))

  const neutralPool = allNumbers
    .filter(n => !hotSet.has(n) && !analytics.coldNumbers.some(c => c.number === n))
    .map(n => ({ value: n, weight: 1.0 }))

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const selected = new Set<number>()

    // Chọn 3 hot
    const shuffledHot = shuffle(hotPool)
    while (selected.size < 3 && shuffledHot.length > 0) {
      const picked = weightedRandom(shuffledHot.filter(h => !selected.has(h.value)))
      selected.add(picked)
    }

    // Chọn 2 cold (ưu tiên near-peak)
    const shuffledCold = shuffle(coldPool)
    while (selected.size < 5 && shuffledCold.length > 0) {
      const picked = weightedRandom(shuffledCold.filter(c => !selected.has(c.value)))
      selected.add(picked)
    }

    // Chọn 1 neutral
    const shuffledNeutral = shuffle(neutralPool)
    while (selected.size < 6 && shuffledNeutral.length > 0) {
      const picked = weightedRandom(shuffledNeutral.filter(n => !selected.has(n.value)))
      selected.add(picked)
    }

    if (selected.size < 6) continue

    const candidate = [...selected]
    if (!applyQuickFilters(candidate, gameType)) continue

    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    return candidate.sort((a, b) => a - b)
  }

  return null
}

/**
 * Chiến thuật 3 - "Tối Ưu Độc Đắc" (Anti-Split Jackpot)
 * Bắt buộc >= 3-4 số > 31 để tránh chia giải với người chơi số sinh nhật
 */
function generateJackpotStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): number[] | null {
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  // Pool số lớn > 31
  const highPool = allNumbers
    .filter(n => n > 31)
    .map(n => ({ value: n, weight: calcWeight(n, analytics.hotNumbers, coldNearPeakSet) }))

  // Pool tất cả số
  const anyPool = allNumbers.map(n => ({
    value: n,
    weight: calcWeight(n, analytics.hotNumbers, coldNearPeakSet),
  }))

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const selected = new Set<number>()

    // Bắt buộc chọn 3-4 số từ pool > 31
    const highCount = Math.random() < 0.5 ? 3 : 4
    const shuffledHigh = shuffle(highPool)

    while (selected.size < highCount && shuffledHigh.length > 0) {
      const picked = weightedRandom(shuffledHigh.filter(h => !selected.has(h.value)))
      selected.add(picked)
    }

    // Bổ sung từ any pool
    const shuffledAny = shuffle(anyPool)
    while (selected.size < 6 && shuffledAny.length > 0) {
      const picked = weightedRandom(shuffledAny.filter(n => !selected.has(n.value)))
      selected.add(picked)
    }

    if (selected.size < 6) continue

    const candidate = [...selected]
    if (!applyQuickFilters(candidate, gameType)) continue

    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    // Đảm bảo >= 3 số > 31
    const highCount2 = candidate.filter(n => n > 31).length
    if (highCount2 < 3) continue

    return candidate.sort((a, b) => a - b)
  }

  return null
}

/** Tính score cho một GeneratedSet */
function calcScore(
  numbers: number[],
  hotSet: Set<number>,
  coldNearPeakSet: Set<number>
): number {
  let score = 0
  // Cộng điểm hot numbers (mỗi hot = 2 điểm, max 10)
  const hotCount = countHotInSet(numbers, hotSet)
  score += Math.min(hotCount * 2, 10)
  // Cộng điểm cold near-peak (5 điểm nếu có)
  const coldNearPeakCount = countColdNearPeakInSet(numbers, coldNearPeakSet)
  score += Math.min(coldNearPeakCount * 5, 5)
  // Base score: 85 (vì đã pass 5 filters)
  return Math.min(85 + score, 100)
}

/** Hàm chính: Tạo 3 bộ số */
export function generateThreeSets(
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): GeneratedSet[] {
  const totalRange = gameType === 'mega645' ? 45 : 55
  const allNumbers = Array.from({ length: totalRange }, (_, i) => i + 1)
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  const strategies: Array<{
    strategy: Strategy
    strategyName: string
    strategyDesc: string
    fn: () => number[] | null
  }> = [
    {
      strategy: 'hot',
      strategyName: 'Phong Độ Cao',
      strategyDesc: '4-5 số nóng + cặp số tần suất cao',
      fn: () => generateHotStrategy(allNumbers, analytics, allDraws, gameType),
    },
    {
      strategy: 'balanced',
      strategyName: 'Cân Bằng & Đón Sóng',
      strategyDesc: '3 số nóng + 2 số lạnh sắp nổ + 1 trung lập',
      fn: () => generateBalancedStrategy(allNumbers, analytics, allDraws, gameType),
    },
    {
      strategy: 'jackpot',
      strategyName: 'Tối Ưu Độc Đắc',
      strategyDesc: '≥3 số trên 31, né nhóm chọn ngày sinh',
      fn: () => generateJackpotStrategy(allNumbers, analytics, allDraws, gameType),
    },
  ]

  const result: GeneratedSet[] = []

  for (const { strategy, strategyName, strategyDesc, fn } of strategies) {
    const numbers = fn()
    if (!numbers) {
      // Fallback: nếu không tìm được, tạo ngẫu nhiên đơn giản
      const fallback = shuffle(allNumbers).slice(0, 6).sort((a, b) => a - b)
      const filterResult = applyFilters(fallback, allDraws, gameType)
      result.push({
        id: generateId(),
        numbers: fallback,
        strategy,
        strategyName,
        strategyDesc,
        filterResult,
        score: 60,
        containsHotCount: countHotInSet(fallback, hotSet),
        containsColdNearPeakCount: countColdNearPeakInSet(fallback, coldNearPeakSet),
        containsPairCount: analytics.topPairs.filter(p =>
          fallback.includes(p.pair[0]) && fallback.includes(p.pair[1])
        ).length,
      })
      continue
    }

    const filterResult = applyFilters(numbers, allDraws, gameType)
    const score = calcScore(numbers, hotSet, coldNearPeakSet)

    result.push({
      id: generateId(),
      numbers,
      strategy,
      strategyName,
      strategyDesc,
      filterResult,
      score,
      containsHotCount: countHotInSet(numbers, hotSet),
      containsColdNearPeakCount: countColdNearPeakInSet(numbers, coldNearPeakSet),
      containsPairCount: analytics.topPairs.filter(p =>
        numbers.includes(p.pair[0]) && numbers.includes(p.pair[1])
      ).length,
    })
  }

  return result
}

/**
 * Tái tạo một bộ số theo chiến thuật cụ thể (dùng cho nút "Đổi dãy khác")
 */
export function regenerateSet(
  strategy: Strategy,
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): GeneratedSet {
  const totalRange = gameType === 'mega645' ? 45 : 55
  const allNumbers = Array.from({ length: totalRange }, (_, i) => i + 1)
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  const strategyConfigs = {
    hot: {
      strategyName: 'Phong Độ Cao',
      strategyDesc: '4-5 số nóng + cặp số tần suất cao',
      fn: () => generateHotStrategy(allNumbers, analytics, allDraws, gameType),
    },
    balanced: {
      strategyName: 'Cân Bằng & Đón Sóng',
      strategyDesc: '3 số nóng + 2 số lạnh sắp nổ + 1 trung lập',
      fn: () => generateBalancedStrategy(allNumbers, analytics, allDraws, gameType),
    },
    jackpot: {
      strategyName: 'Tối Ưu Độc Đắc',
      strategyDesc: '≥3 số trên 31, né nhóm chọn ngày sinh',
      fn: () => generateJackpotStrategy(allNumbers, analytics, allDraws, gameType),
    },
  }

  const config = strategyConfigs[strategy]
  const numbers = config.fn() ?? shuffle(allNumbers).slice(0, 6).sort((a, b) => a - b)
  const filterResult = applyFilters(numbers, allDraws, gameType)
  const score = calcScore(numbers, hotSet, coldNearPeakSet)

  return {
    id: generateId(),
    numbers,
    strategy,
    strategyName: config.strategyName,
    strategyDesc: config.strategyDesc,
    filterResult,
    score,
    containsHotCount: countHotInSet(numbers, hotSet),
    containsColdNearPeakCount: countColdNearPeakInSet(numbers, coldNearPeakSet),
    containsPairCount: 0,
  }
}

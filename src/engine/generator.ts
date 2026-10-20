// ============================================================
// GENERATOR ENGINE - Bộ máy tạo số thông minh thế hệ mới
// Tích hợp Weighted Poisson Random + Lô Rơi + 8 Bộ Lọc Vàng
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

/**
 * Tính trọng số động cho một quả bóng:
 * - Tần suất xuất hiện (Hot bonus)
 * - Hệ số hồi quy Gan Poisson (Cold Near Peak bonus)
 * - Mối quan hệ liên kết cặp với các số đã chọn trước đó (Co-occurrence bonus)
 */
function calcDynamicWeight(
  num: number,
  hotNumbers: AnalyticsResult['hotNumbers'],
  coldNumbers: AnalyticsResult['coldNumbers'],
  coldNearPeakSet: Set<number>,
  selectedNumbers: number[],
  topPairs: AnalyticsResult['topPairs']
): number {
  let weight = 1.0

  // 1. Tần suất nóng
  const hotEntry = hotNumbers.find(h => h.number === num)
  if (hotEntry) {
    weight += hotEntry.percentage / 8 // Tối đa ~ +2.5
  }

  // 2. Hệ số hồi quy gan cực đại
  const coldEntry = coldNumbers.find(c => c.number === num)
  if (coldEntry && coldNearPeakSet.has(num)) {
    const ganRatio = coldEntry.maxHistoricalGan > 0
      ? coldEntry.currentGan / coldEntry.maxHistoricalGan
      : 0.8
    weight += 0.8 * Math.min(ganRatio, 1.3)
  }

  // 3. Liên kết cặp với các số đã chọn (Conditional probability)
  for (const sel of selectedNumbers) {
    const pairMatch = topPairs.find(
      p => (p.pair[0] === num && p.pair[1] === sel) || (p.pair[1] === num && p.pair[0] === sel)
    )
    if (pairMatch) {
      weight += 1.2 // Tăng mạnh cơ hội về cùng nhau
    }
  }

  return Math.max(weight, 0.2)
}

/**
 * Chiến thuật 1 - "Phong Độ Cao" (Hot & Pair Focus)
 * 4-5 số nóng + đảm bảo cặp số tần suất cao + có thể kèm 1 số lô rơi từ kỳ trước
 */
function generateHotStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): { numbers: number[]; echoNumber?: number } | null {
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)
  const topPairKeys = getTopPairKeys(analytics)
  const latestDraw = allDraws[0] || null

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const selected: number[] = []
    let echoNumber: number | undefined

    // 60% khả năng đón 1 số lô rơi từ kỳ quay trước
    if (latestDraw && Math.random() < 0.6) {
      const candidateEcho = shuffle(latestDraw.numbers.filter(n => hotSet.has(n)))
      if (candidateEcho.length > 0) {
        echoNumber = candidateEcho[0]
        selected.push(echoNumber)
      }
    }

    const hotCount = Math.random() < 0.5 ? 4 : 5

    // Chọn từ hot pool với trọng số liên kết động
    while (selected.length < hotCount) {
      const remainingHot = analytics.hotNumbers
        .filter(h => !selected.includes(h.number))
        .map(h => ({
          value: h.number,
          weight: calcDynamicWeight(
            h.number,
            analytics.hotNumbers,
            analytics.coldNumbers,
            coldNearPeakSet,
            selected,
            analytics.topPairs
          ),
        }))

      if (remainingHot.length === 0) break
      const picked = weightedRandom(remainingHot)
      selected.push(picked)
    }

    // Bổ sung các số còn lại
    while (selected.length < 6) {
      const remainingAll = allNumbers
        .filter(n => !selected.includes(n))
        .map(n => ({
          value: n,
          weight: calcDynamicWeight(
            n,
            analytics.hotNumbers,
            analytics.coldNumbers,
            coldNearPeakSet,
            selected,
            analytics.topPairs
          ),
        }))

      if (remainingAll.length === 0) break
      const picked = weightedRandom(remainingAll)
      selected.push(picked)
    }

    if (selected.length < 6) continue

    const candidate = [...selected].sort((a, b) => a - b)

    if (!applyQuickFilters(candidate, gameType)) continue
    if (!containsTopPair(candidate, topPairKeys) && analytics.topPairs.length > 0) continue

    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    return { numbers: candidate, echoNumber }
  }

  return null
}

/**
 * Chiến thuật 2 - "Cân Bằng & Đón Sóng" (Balanced & Overdue)
 * 3 Số Nóng + 2 Số Lạnh sắp nổ + 1 số trung lập
 */
function generateBalancedStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): { numbers: number[]; echoNumber?: number } | null {
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)
  const latestDraw = allDraws[0] || null

  const coldCandidates = analytics.coldNumbers
    .filter(c => coldNearPeakSet.has(c.number))
    .slice(0, 8)

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const selected: number[] = []
    let echoNumber: number | undefined

    // 50% đón 1 số lô rơi từ kỳ trước
    if (latestDraw && Math.random() < 0.5) {
      const echoList = shuffle(latestDraw.numbers)
      echoNumber = echoList[0]
      selected.push(echoNumber)
    }

    // Chọn số nóng (đến 3 số)
    while (selected.length < 3) {
      const hotPool = analytics.hotNumbers
        .filter(h => !selected.includes(h.number))
        .map(h => ({
          value: h.number,
          weight: calcDynamicWeight(h.number, analytics.hotNumbers, analytics.coldNumbers, coldNearPeakSet, selected, analytics.topPairs),
        }))
      if (hotPool.length === 0) break
      selected.push(weightedRandom(hotPool))
    }

    // Chọn 2 số lạnh sắp chạm đỉnh gan
    while (selected.length < 5 && coldCandidates.length > 0) {
      const coldPool = coldCandidates
        .filter(c => !selected.includes(c.number))
        .map(c => ({
          value: c.number,
          weight: calcDynamicWeight(c.number, analytics.hotNumbers, analytics.coldNumbers, coldNearPeakSet, selected, analytics.topPairs),
        }))
      if (coldPool.length === 0) break
      selected.push(weightedRandom(coldPool))
    }

    // Chọn số trung lập còn lại
    while (selected.length < 6) {
      const neutralPool = allNumbers
        .filter(n => !selected.includes(n) && !hotSet.has(n))
        .map(n => ({
          value: n,
          weight: calcDynamicWeight(n, analytics.hotNumbers, analytics.coldNumbers, coldNearPeakSet, selected, analytics.topPairs),
        }))
      if (neutralPool.length === 0) {
        const anyRemaining = allNumbers.filter(n => !selected.includes(n))
        selected.push(anyRemaining[Math.floor(Math.random() * anyRemaining.length)])
      } else {
        selected.push(weightedRandom(neutralPool))
      }
    }

    if (selected.length < 6) continue

    const candidate = [...selected].sort((a, b) => a - b)
    if (!applyQuickFilters(candidate, gameType)) continue

    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    return { numbers: candidate, echoNumber }
  }

  return null
}

/**
 * Chiến thuật 3 - "Tối Ưu Độc Đắc" (Anti-Split Jackpot)
 * Ép buộc >= 3-4 số > 31 để né nhóm đánh theo ngày sinh nhật
 */
function generateJackpotStrategy(
  allNumbers: number[],
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): { numbers: number[]; echoNumber?: number } | null {
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const selected: number[] = []

    // Bắt buộc 3-4 số lớn > 31
    const highTarget = Math.random() < 0.6 ? 4 : 3
    const highPool = allNumbers.filter(n => n > 31)

    while (selected.length < highTarget) {
      const availableHigh = highPool
        .filter(n => !selected.includes(n))
        .map(n => ({
          value: n,
          weight: calcDynamicWeight(n, analytics.hotNumbers, analytics.coldNumbers, coldNearPeakSet, selected, analytics.topPairs),
        }))
      if (availableHigh.length === 0) break
      selected.push(weightedRandom(availableHigh))
    }

    // Bổ sung các số còn lại
    while (selected.length < 6) {
      const remaining = allNumbers
        .filter(n => !selected.includes(n))
        .map(n => ({
          value: n,
          weight: calcDynamicWeight(n, analytics.hotNumbers, analytics.coldNumbers, coldNearPeakSet, selected, analytics.topPairs),
        }))
      if (remaining.length === 0) break
      selected.push(weightedRandom(remaining))
    }

    if (selected.length < 6) continue

    const candidate = [...selected].sort((a, b) => a - b)
    if (!applyQuickFilters(candidate, gameType)) continue

    const filterResult = applyFilters(candidate, allDraws, gameType)
    if (!filterResult.allPassed) continue

    const highCount = candidate.filter(n => n > 31).length
    if (highCount < 3) continue

    return { numbers: candidate }
  }

  return null
}

/** Tính Chỉ Số Sức Mạnh (Power Index: 88% - 99%) */
function calcPowerIndex(score: number, containsPair: boolean, hasEcho: boolean): number {
  let base = 85 + (score / 100) * 10
  if (containsPair) base += 2.5
  if (hasEcho) base += 1.5
  base += (Math.random() * 2 - 1)
  return Math.min(Math.round(base * 10) / 10, 99.4)
}

/** Tính điểm cơ bản cho một bộ số */
function calcScore(
  numbers: number[],
  hotSet: Set<number>,
  coldNearPeakSet: Set<number>
): number {
  let score = 70 // Base khi pass all filters

  const hotCount = countHotInSet(numbers, hotSet)
  score += Math.min(hotCount * 3, 15)

  const coldCount = countColdNearPeakInSet(numbers, coldNearPeakSet)
  score += Math.min(coldCount * 4, 10)

  return Math.min(score, 98)
}

/**
 * Sinh cùng lúc 3 bộ số theo 3 chiến thuật độc lập
 */
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
    fn: () => { numbers: number[]; echoNumber?: number } | null
  }> = [
    {
      strategy: 'hot',
      strategyName: 'Phong Độ Cao',
      strategyDesc: 'Tập trung 4-5 số nóng + cặp liên kết + đón lô rơi',
      fn: () => generateHotStrategy(allNumbers, analytics, allDraws, gameType),
    },
    {
      strategy: 'balanced',
      strategyName: 'Cân Bằng & Đón Sóng',
      strategyDesc: '3 số nóng + 2 số lạnh chạm ngưỡng nổ + 1 trung lập',
      fn: () => generateBalancedStrategy(allNumbers, analytics, allDraws, gameType),
    },
    {
      strategy: 'jackpot',
      strategyName: 'Tối Ưu Độc Đắc',
      strategyDesc: '≥3-4 số trên 31, né ngày sinh để bảo toàn trọn vẹn Jackpot',
      fn: () => generateJackpotStrategy(allNumbers, analytics, allDraws, gameType),
    },
  ]

  const result: GeneratedSet[] = []

  for (const { strategy, strategyName, strategyDesc, fn } of strategies) {
    const generated = fn()
    const numbers = generated
      ? generated.numbers
      : shuffle(allNumbers).slice(0, 6).sort((a, b) => a - b)
    const echoNumber = generated?.echoNumber

    const filterResult = applyFilters(numbers, allDraws, gameType)
    const score = calcScore(numbers, hotSet, coldNearPeakSet)
    const containsPairCount = analytics.topPairs.filter(p =>
      numbers.includes(p.pair[0]) && numbers.includes(p.pair[1])
    ).length

    const powerIndex = calcPowerIndex(score, containsPairCount > 0, !!echoNumber)

    result.push({
      id: generateId(),
      numbers,
      strategy,
      strategyName,
      strategyDesc,
      filterResult,
      score,
      powerIndex,
      echoNumber,
      containsHotCount: countHotInSet(numbers, hotSet),
      containsColdNearPeakCount: countColdNearPeakInSet(numbers, coldNearPeakSet),
      containsPairCount,
    })
  }

  return result
}

/** Tái sinh một bộ số theo chiến thuật */
export function regenerateSet(
  target: GeneratedSet | Strategy,
  analytics: AnalyticsResult,
  allDraws: DrawResult[],
  gameType: GameType
): GeneratedSet {
  const strategy: Strategy = typeof target === 'string' ? target : target.strategy
  const strategyInfo: Record<Strategy, { name: string; desc: string }> = {
    hot: { name: 'Phong Độ Cao', desc: 'Tập trung 4-5 số nóng + cặp liên kết + đón lô rơi' },
    balanced: { name: 'Cân Bằng Đón Sóng', desc: '3 số nóng + 2 số lạnh chạm ngưỡng nổ + 1 trung lập' },
    jackpot: { name: 'Tối Ưu Độc Đắc', desc: '≥3-4 số trên 31, né ngày sinh để bảo toàn trọn vẹn Jackpot' },
  }
  const strategyName = typeof target === 'string' ? strategyInfo[strategy].name : target.strategyName
  const strategyDesc = typeof target === 'string' ? strategyInfo[strategy].desc : target.strategyDesc

  const totalRange = gameType === 'mega645' ? 45 : 55
  const allNumbers = Array.from({ length: totalRange }, (_, i) => i + 1)
  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)

  let generated: { numbers: number[]; echoNumber?: number } | null = null

  if (strategy === 'hot') {
    generated = generateHotStrategy(allNumbers, analytics, allDraws, gameType)
  } else if (strategy === 'balanced') {
    generated = generateBalancedStrategy(allNumbers, analytics, allDraws, gameType)
  } else {
    generated = generateJackpotStrategy(allNumbers, analytics, allDraws, gameType)
  }

  const numbers = generated
    ? generated.numbers
    : shuffle(allNumbers).slice(0, 6).sort((a, b) => a - b)
  const echoNumber = generated?.echoNumber

  const filterResult = applyFilters(numbers, allDraws, gameType)
  const score = calcScore(numbers, hotSet, coldNearPeakSet)
  const containsPairCount = analytics.topPairs.filter(p =>
    numbers.includes(p.pair[0]) && numbers.includes(p.pair[1])
  ).length
  const powerIndex = calcPowerIndex(score, containsPairCount > 0, !!echoNumber)

  return {
    id: generateId(),
    numbers,
    strategy,
    strategyName,
    strategyDesc,
    filterResult,
    score,
    powerIndex,
    echoNumber,
    containsHotCount: countHotInSet(numbers, hotSet),
    containsColdNearPeakCount: countColdNearPeakInSet(numbers, coldNearPeakSet),
    containsPairCount,
  }
}

// ============================================================
// GOLDEN PROBABILITY FILTERS - Bộ lọc xác suất chuyên sâu cho dãy 6 số
// ============================================================

import type { DrawResult, GameType, FilterResult } from '../types'

/**
 * F1: Zero-Repeat Check
 * - Không trùng 6/6 với bất kỳ kỳ nào trong toàn bộ lịch sử
 * - Không trùng quá 4/6 với 20 kỳ gần nhất
 */
function filterZeroRepeat(numbers: number[], allDraws: DrawResult[]): boolean {
  const sortedInput = [...numbers].sort((a, b) => a - b)
  const inputKey = sortedInput.join(',')

  const recent20 = allDraws.slice(0, 20)

  for (let i = 0; i < allDraws.length; i++) {
    const draw = allDraws[i]
    const drawKey = [...draw.numbers].sort((a, b) => a - b).join(',')

    // Kiểm tra trùng 6/6
    if (drawKey === inputKey) return false

    // Kiểm tra trùng >4/6 trong 20 kỳ gần nhất
    if (i < 20) {
      let matchCount = 0
      for (const n of sortedInput) {
        if (recent20[i].numbers.includes(n)) matchCount++
      }
      if (matchCount > 4) return false
    }
  }

  return true
}

/**
 * F2: Tỷ lệ Chẵn/Lẻ
 * Chấp nhận: 2:4, 3:3, 4:2
 * Loại bỏ: 0:6, 6:0, 1:5, 5:1
 */
function filterEvenOdd(numbers: number[]): boolean {
  const evenCount = numbers.filter(n => n % 2 === 0).length
  return evenCount >= 2 && evenCount <= 4
}

/**
 * F3: Tỷ lệ Tài/Xỉu (Nhỏ/Lớn)
 * Mega 6/45: Nhỏ = 1-22, Lớn = 23-45
 * Power 6/55: Nhỏ = 1-27, Lớn = 28-55
 * Chấp nhận: 2:4, 3:3, 4:2
 */
function filterHighLow(numbers: number[], gameType: GameType): boolean {
  const threshold = gameType === 'mega645' ? 22 : 27
  const lowCount = numbers.filter(n => n <= threshold).length
  return lowCount >= 2 && lowCount <= 4
}

/**
 * F4: Bell-Curve Sum Filter
 * Mega 6/45: Tổng nằm trong [105, 170]
 * Power 6/55: Tổng nằm trong [130, 210]
 */
function filterBellCurveSum(numbers: number[], gameType: GameType): boolean {
  const sum = numbers.reduce((a, b) => a + b, 0)
  if (gameType === 'mega645') {
    return sum >= 105 && sum <= 170
  }
  return sum >= 130 && sum <= 210
}

/**
 * F5: Giới hạn Số Liên Tiếp
 * Không có chuỗi >= 3 số liên tiếp nhau
 */
function filterConsecutive(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b)
  let consecutiveCount = 1

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      consecutiveCount++
      if (consecutiveCount >= 3) return false
    } else {
      consecutiveCount = 1
    }
  }

  return true
}

/**
 * F6: Phân tán đầu số (Decade / Dozen Spread)
 * - Phải trải rộng ít nhất 3 hàng chục khác nhau
 * - Không có quá 3 số trong cùng 1 hàng chục
 */
export function filterDecadeSpread(numbers: number[]): boolean {
  const decadeMap = new Map<number, number>()
  for (const n of numbers) {
    const decade = Math.floor(n / 10)
    decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1)
  }

  // Ít nhất 3 đầu số khác nhau
  if (decadeMap.size < 3) return false

  // Không đầu số nào dồn quá 3 quả bóng
  for (const count of decadeMap.values()) {
    if (count > 3) return false
  }

  return true
}

/**
 * F7: Khoảng cách biên Span (Max - Min)
 * Loại bỏ các dãy số quá co cụm hoặc dồn lệch biên
 */
export function filterSpanSpread(numbers: number[], gameType: GameType): boolean {
  const sorted = [...numbers].sort((a, b) => a - b)
  const span = sorted[sorted.length - 1] - sorted[0]
  if (gameType === 'mega645') {
    return span >= 18 && span <= 42
  }
  return span >= 22 && span <= 52
}

/**
 * F8: Giới hạn chữ số tận cùng (Last Digit Limit)
 * Không quá 2 số có cùng chữ số tận cùng
 */
export function filterLastDigitLimit(numbers: number[]): boolean {
  const digitMap = new Map<number, number>()
  for (const n of numbers) {
    const lastDigit = n % 10
    const count = (digitMap.get(lastDigit) || 0) + 1
    if (count > 2) return false
    digitMap.set(lastDigit, count)
  }
  return true
}

/**
 * Hàm chính: Chạy tất cả bộ lọc và trả về FilterResult
 */
export function applyFilters(numbers: number[], allDraws: DrawResult[], gameType: GameType): FilterResult {
  const sorted = [...numbers].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const evenCount = sorted.filter(n => n % 2 === 0).length
  const oddCount = 6 - evenCount
  const threshold = gameType === 'mega645' ? 22 : 27
  const lowCount = sorted.filter(n => n <= threshold).length
  const highCount = 6 - lowCount
  const span = sorted[sorted.length - 1] - sorted[0]

  const zeroRepeat = filterZeroRepeat(sorted, allDraws)
  const evenOdd = filterEvenOdd(sorted)
  const highLow = filterHighLow(sorted, gameType)
  const bellCurveSum = filterBellCurveSum(sorted, gameType)
  const consecutive = filterConsecutive(sorted)
  const decadeSpread = filterDecadeSpread(sorted)
  const spanSpread = filterSpanSpread(sorted, gameType)
  const lastDigitLimit = filterLastDigitLimit(sorted)

  const allPassed =
    zeroRepeat &&
    evenOdd &&
    highLow &&
    bellCurveSum &&
    consecutive &&
    decadeSpread &&
    spanSpread &&
    lastDigitLimit

  return {
    zeroRepeat,
    evenOdd,
    highLow,
    bellCurveSum,
    consecutive,
    decadeSpread,
    spanSpread,
    lastDigitLimit,
    allPassed,
    sum,
    evenCount,
    oddCount,
    highCount,
    lowCount,
    span,
  }
}

/**
 * Kiểm tra nhanh không cần DrawResult (dùng trong generator vòng lặp)
 */
export function applyQuickFilters(numbers: number[], gameType: GameType): boolean {
  return (
    filterEvenOdd(numbers) &&
    filterHighLow(numbers, gameType) &&
    filterBellCurveSum(numbers, gameType) &&
    filterConsecutive(numbers) &&
    filterDecadeSpread(numbers) &&
    filterSpanSpread(numbers, gameType) &&
    filterLastDigitLimit(numbers)
  )
}

/**
 * Tính nhãn Chẵn/Lẻ
 */
export function getEvenOddLabel(evenCount: number): string {
  return `${evenCount}C/${6 - evenCount}L`
}

/**
 * Tính nhãn Tài/Xỉu
 */
export function getHighLowLabel(lowCount: number): string {
  return `${lowCount}N/${6 - lowCount}L`
}

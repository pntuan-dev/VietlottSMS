// ============================================================
// 5 GOLDEN FILTERS - Bộ lọc xác suất cho dãy 6 số
// Tất cả là pure functions, trả về FilterResult
// ============================================================

import type { DrawResult, GameType, FilterResult } from '../types'

/**
 * F1: Zero-Repeat Check
 * - Không trùng 6/6 với bất kỳ kỳ nào trong lịch sử
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
  // Chấp nhận 2:4, 3:3, 4:2 (evenCount từ 2 đến 4)
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
  // Chấp nhận 2:4, 3:3, 4:2 (lowCount từ 2 đến 4)
  return lowCount >= 2 && lowCount <= 4
}

/**
 * F4: Bell-Curve Sum Filter
 * Mega 6/45: Tổng phải nằm trong [105, 170]
 * Power 6/55: Tổng phải nằm trong [130, 210]
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
 * Ví dụ: 14-15 OK, nhưng 14-15-16 thì LOẠI
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
 * Hàm chính: Chạy tất cả 5 bộ lọc và trả về FilterResult
 */
export function applyFilters(numbers: number[], allDraws: DrawResult[], gameType: GameType): FilterResult {
  const sorted = [...numbers].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const evenCount = sorted.filter(n => n % 2 === 0).length
  const oddCount = 6 - evenCount
  const threshold = gameType === 'mega645' ? 22 : 27
  const lowCount = sorted.filter(n => n <= threshold).length
  const highCount = 6 - lowCount

  const zeroRepeat = filterZeroRepeat(sorted, allDraws)
  const evenOdd = filterEvenOdd(sorted)
  const highLow = filterHighLow(sorted, gameType)
  const bellCurveSum = filterBellCurveSum(sorted, gameType)
  const consecutive = filterConsecutive(sorted)

  return {
    zeroRepeat,
    evenOdd,
    highLow,
    bellCurveSum,
    consecutive,
    allPassed: zeroRepeat && evenOdd && highLow && bellCurveSum && consecutive,
    sum,
    evenCount,
    oddCount,
    highCount,
    lowCount,
  }
}

/**
 * Kiểm tra nhanh không cần DrawResult (dùng trong generator vòng lặp)
 * Bỏ qua F1 (Zero-Repeat) để tăng tốc độ, chỉ kiểm tra F2-F5
 */
export function applyQuickFilters(numbers: number[], gameType: GameType): boolean {
  return (
    filterEvenOdd(numbers) &&
    filterHighLow(numbers, gameType) &&
    filterBellCurveSum(numbers, gameType) &&
    filterConsecutive(numbers)
  )
}

/**
 * Tính nhãn Chẵn/Lẻ đẹp
 */
export function getEvenOddLabel(evenCount: number): string {
  return `${evenCount}C/${6 - evenCount}L`
}

/**
 * Tính nhãn Tài/Xỉu đẹp
 */
export function getHighLowLabel(lowCount: number): string {
  return `${lowCount}N/${6 - lowCount}L`
}

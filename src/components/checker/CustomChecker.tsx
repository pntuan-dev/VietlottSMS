// ============================================================
// COMPONENT: CustomChecker - Kiểm tra và chấm điểm dãy số
// Tối ưu hóa toàn diện cho Mobile với Touch Grid Selector
// ============================================================

import React, { useState, useCallback } from 'react'
import {
  Search, AlertCircle, CheckCircle, XCircle, Trophy,
  Bookmark, Sparkles, Dices, RotateCcw,
  LayoutGrid, Keyboard
} from 'lucide-react'
import type { CheckerResult, GameType, DrawResult, AnalyticsResult, ScoreBreakdown, HistoryMatch } from '../../types'
import { LottoBall } from '../balls/LottoBall'
import { applyFilters, getEvenOddLabel, getHighLowLabel } from '../../engine/filters'
import { getHotNumberSet, getColdNearPeakSet } from '../../utils/analytics'
import { formatNumber } from '../../utils/storage'

interface CustomCheckerProps {
  draws: DrawResult[]
  gameType: GameType
  analytics: AnalyticsResult
  onSaveNumbers?: (numbers: number[]) => void
}

/** Tính điểm và breakdown */
function calcCheckerResult(
  numbers: number[],
  draws: DrawResult[],
  gameType: GameType,
  analytics: AnalyticsResult
): CheckerResult {
  const sorted = [...numbers].sort((a, b) => a - b)
  const filterResult = applyFilters(sorted, draws, gameType)

  const hotSet = getHotNumberSet(analytics)
  const coldNearPeakSet = getColdNearPeakSet(analytics)
  const hotNumbersInSet = sorted.filter(n => hotSet.has(n))
  const coldNearPeakInSet = sorted.filter(n => coldNearPeakSet.has(n))

  const zeroRepeatScore = filterResult.zeroRepeat ? 25 : 0
  const evenOddScore = (() => {
    if (filterResult.evenCount === 3) return 15
    if (filterResult.evenCount === 2 || filterResult.evenCount === 4) return 10
    return 0
  })()
  const highLowScore = (() => {
    if (filterResult.lowCount === 3) return 15
    if (filterResult.lowCount === 2 || filterResult.lowCount === 4) return 10
    return 0
  })()
  const bellCurveScore = filterResult.bellCurveSum ? 20 : 0
  const consecutiveScore = filterResult.consecutive ? 10 : 0
  const hotNumberBonus = Math.min(hotNumbersInSet.length * 2, 10)
  const coldNearPeakBonus = Math.min(coldNearPeakInSet.length * 5, 5)

  const total = zeroRepeatScore + evenOddScore + highLowScore + bellCurveScore + consecutiveScore + hotNumberBonus + coldNearPeakBonus

  const scoreBreakdown: ScoreBreakdown = {
    zeroRepeatScore,
    evenOddScore,
    highLowScore,
    bellCurveScore,
    consecutiveScore,
    hotNumberBonus,
    coldNearPeakBonus,
    total,
  }

  // Kiểm tra lịch sử trùng khớp
  const historyMatches: HistoryMatch[] = []
  for (const draw of draws) {
    const matchedNumbers = sorted.filter(n => draw.numbers.includes(n))
    const matchCount = matchedNumbers.length

    if (matchCount >= 3) {
      const prize = (() => {
        if (matchCount === 6) return 'Jackpot'
        if (matchCount === 5) return 'Giải Nhất'
        if (matchCount === 4) return 'Giải Nhì'
        if (matchCount === 3) return 'Giải Ba'
        return null
      })()
      historyMatches.push({
        drawId: draw.draw_id,
        date: draw.date,
        matchCount,
        matchedNumbers,
        prize,
      })
    }
  }

  historyMatches.sort((a, b) => b.matchCount - a.matchCount)
  const bestMatch = historyMatches.length > 0 ? historyMatches[0] : null

  return {
    numbers: sorted,
    filterResult,
    score: total,
    historyMatches,
    bestMatch,
    hotNumbersInSet,
    coldNearPeakInSet,
    scoreBreakdown,
  }
}

export const CustomChecker: React.FC<CustomCheckerProps> = ({
  draws,
  gameType,
  analytics,
  onSaveNumbers,
}) => {
  const [inputMode, setInputMode] = useState<'touch' | 'keyboard'>('touch')
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [inputValues, setInputValues] = useState<string[]>(['', '', '', '', '', ''])
  const [result, setResult] = useState<CheckerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const isMega = gameType === 'mega645'
  const maxNum = gameType === 'mega645' ? 45 : 55
  const allBallNumbers = Array.from({ length: maxNum }, (_, i) => i + 1)

  // Xử lý chạm chọn số trên Grid
  const handleToggleNumber = (num: number) => {
    setError(null)
    setSavedSuccess(false)

    if (selectedNumbers.includes(num)) {
      const updated = selectedNumbers.filter(n => n !== num)
      setSelectedNumbers(updated)
      setResult(null)
    } else {
      if (selectedNumbers.length >= 6) {
        setError('Bạn đã chọn đủ 6 số. Hãy chạm vào một số để bỏ chọn nếu muốn đổi.')
        return
      }
      const updated = [...selectedNumbers, num].sort((a, b) => a - b)
      setSelectedNumbers(updated)

      // Nếu đã đủ 6 số, tự động phân tích ngay lập tức!
      if (updated.length === 6) {
        const checkerResult = calcCheckerResult(updated, draws, gameType, analytics)
        setResult(checkerResult)
      } else {
        setResult(null)
      }
    }
  }

  // Chọn ngẫu nhiên 6 số
  const handleLuckyPick = () => {
    setError(null)
    setSavedSuccess(false)
    const shuffled = [...allBallNumbers].sort(() => 0.5 - Math.random())
    const picked = shuffled.slice(0, 6).sort((a, b) => a - b)
    setSelectedNumbers(picked)
    setInputValues(picked.map(n => n.toString()))
    const checkerResult = calcCheckerResult(picked, draws, gameType, analytics)
    setResult(checkerResult)
  }

  // Reset
  const handleClear = () => {
    setSelectedNumbers([])
    setInputValues(['', '', '', '', '', ''])
    setResult(null)
    setError(null)
    setSavedSuccess(false)
  }

  // Xử lý nhập bằng bàn phím
  const handleInputChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2)
    const newValues = [...inputValues]
    newValues[index] = cleaned
    setInputValues(newValues)
    setResult(null)
    setError(null)
    setSavedSuccess(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      e.preventDefault()
      const nextInput = document.getElementById(`checker-input-${Math.min(index + 1, 5)}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    }
  }

  const handleCheckKeyboard = useCallback(() => {
    setError(null)
    const numbers = inputValues.map(v => parseInt(v, 10))
    const invalidNumbers = numbers.filter(n => isNaN(n) || n < 1 || n > maxNum)

    if (numbers.some(isNaN)) {
      setError(`Vui lòng nhập đủ 6 số từ 1 đến ${maxNum}`)
      return
    }
    if (invalidNumbers.length > 0) {
      setError(`Số ${invalidNumbers.join(', ')} nằm ngoài phạm vi 1-${maxNum}`)
      return
    }
    const uniqueNumbers = new Set(numbers)
    if (uniqueNumbers.size !== 6) {
      setError('Các số phải khác nhau')
      return
    }

    const sorted = numbers.sort((a, b) => a - b)
    setSelectedNumbers(sorted)
    const checkerResult = calcCheckerResult(sorted, draws, gameType, analytics)
    setResult(checkerResult)
  }, [inputValues, draws, gameType, analytics, maxNum])

  const handleSave = () => {
    if (!result) return
    onSaveNumbers?.(result.numbers)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Input Selector Card */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4 sm:p-6 backdrop-blur-md">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isMega ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
              <Search className={`w-4 h-4 ${isMega ? 'text-red-400' : 'text-yellow-400'}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Kiểm Tra Dãy Số Của Bạn</h2>
              <p className="text-xs text-gray-400">Chọn 6 số từ 1–{maxNum} để chấm điểm toán học</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
            <button
              onClick={() => setInputMode('touch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputMode === 'touch'
                  ? isMega ? 'bg-red-600/30 text-red-300 border border-red-500/40' : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Chạm Chọn Số</span>
            </button>
            <button
              onClick={() => setInputMode('keyboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputMode === 'keyboard'
                  ? isMega ? 'bg-red-600/30 text-red-300 border border-red-500/40' : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Gõ Bàn Phím</span>
            </button>
          </div>
        </div>

        {/* Selected Balls Preview Bar */}
        <div className="bg-gray-950/80 rounded-2xl border border-gray-800/80 p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <span>Đã chọn:</span>
              <strong className={`font-bold ${selectedNumbers.length === 6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {selectedNumbers.length}/6 số
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLuckyPick}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg transition-all"
              >
                <Dices className="w-3 h-3 text-amber-400" />
                <span>Chọn ngẫu nhiên</span>
              </button>
              {selectedNumbers.length > 0 && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-300 bg-gray-800/60 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>

          {/* 6 Preview Balls */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 min-h-[50px]">
            {Array.from({ length: 6 }).map((_, idx) => {
              const num = selectedNumbers[idx]
              return num ? (
                <button
                  key={`sel-${num}`}
                  onClick={() => handleToggleNumber(num)}
                  className="transition-transform hover:scale-105 active:scale-95"
                  title="Chạm để bỏ chọn"
                >
                  <LottoBall number={num} gameType={gameType} size="md" isHighlighted={true} />
                </button>
              ) : (
                <div
                  key={`empty-${idx}`}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-xs text-gray-600 font-bold"
                >
                  {idx + 1}
                </div>
              )
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: Touch Grid (Tối ưu tuyệt đối cho mobile) */}
        {inputMode === 'touch' && (
          <div className="space-y-3">
            <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1.5 sm:gap-2 max-h-[300px] overflow-y-auto p-1 pr-2">
              {allBallNumbers.map(n => {
                const isSelected = selectedNumbers.includes(n)
                const isHot = analytics.hotNumbers.slice(0, 10).some(h => h.number === n)
                return (
                  <button
                    key={`grid-${n}`}
                    onClick={() => handleToggleNumber(n)}
                    className={`
                      h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center
                      transition-all duration-150 touch-manipulation active:scale-95 relative
                      ${isSelected
                        ? isMega
                          ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-md shadow-red-500/40 ring-2 ring-red-400'
                          : 'bg-gradient-to-br from-yellow-500 to-amber-500 text-gray-950 shadow-md shadow-yellow-500/40 ring-2 ring-yellow-400'
                        : 'bg-gray-800/90 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700/60'
                      }
                    `}
                  >
                    <span>{formatNumber(n)}</span>
                    {isHot && !isSelected && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400" />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              💡 Chạm vào số để chọn. Chạm đủ 6 số hệ thống sẽ tự động phân tích và chấm điểm ngay!
            </p>
          </div>
        )}

        {/* MODE 2: Keyboard Inputs */}
        {inputMode === 'keyboard' && (
          <div className="space-y-4">
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {inputValues.map((val, index) => (
                <input
                  key={index}
                  id={`checker-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  placeholder={`${(index + 1).toString().padStart(2, '0')}`}
                  maxLength={2}
                  className={`
                    w-11 h-11 sm:w-12 sm:h-12 text-center text-sm font-bold rounded-xl
                    bg-gray-800 border transition-all text-white placeholder-gray-700
                    focus:outline-none focus:ring-2
                    ${val
                      ? isMega ? 'border-red-500/50 focus:ring-red-500/40' : 'border-yellow-500/50 focus:ring-yellow-500/40'
                      : 'border-gray-700 focus:ring-gray-500/40'
                    }
                  `}
                />
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleCheckKeyboard}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-xs sm:text-sm font-bold text-white transition-all active:scale-95
                  ${isMega
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 shadow-lg shadow-yellow-500/30 font-extrabold'
                  }
                `}
              >
                <Search className="w-4 h-4" />
                <span>Phân Tích Ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {result && (
        <div className="space-y-4 slide-in-up">
          {/* Main Score Card */}
          <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Kết quả phân tích</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  Điểm Tối Ưu Toán Học
                </h3>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${
                  result.score >= 80 ? 'text-emerald-400' :
                  result.score >= 65 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {result.score}<span className="text-base text-gray-500 font-medium">/100</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  result.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                  result.score >= 65 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {result.score >= 85 ? 'Rất Tiềm Năng' : result.score >= 70 ? 'Khá Tốt' : 'Cần Cân Nhắc'}
                </span>
              </div>
            </div>

            {/* Dãy bóng phân tích */}
            <div className="flex justify-center items-center gap-2 sm:gap-3 py-3 border-y border-gray-800/80 my-3">
              {result.numbers.map((num, i) => (
                <LottoBall
                  key={`res-${num}`}
                  number={num}
                  gameType={gameType}
                  size="md"
                  isHighlighted={result.hotNumbersInSet.includes(num)}
                  animationDelay={i * 70}
                />
              ))}
            </div>

            {/* Nút lưu vé */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                disabled={savedSuccess}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  savedSuccess
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-gray-800 hover:bg-gray-750 text-white border-gray-700'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã lưu vào Kho Vé</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Lưu bộ số này</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Breakdown 8 Tiêu chí vàng */}
          <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-4 sm:p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Chi Tiết 8 Bộ Lọc Xác Suất
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: 'Không trùng 6/6 lịch sử (F1)', pass: result.filterResult.zeroRepeat, score: result.scoreBreakdown.zeroRepeatScore, max: 25 },
                { label: `Chẵn/Lẻ ${getEvenOddLabel(result.filterResult.evenCount)} (F2)`, pass: result.filterResult.evenOdd, score: result.scoreBreakdown.evenOddScore, max: 15 },
                { label: `Nhỏ/Lớn ${getHighLowLabel(result.filterResult.lowCount)} (F3)`, pass: result.filterResult.highLow, score: result.scoreBreakdown.highLowScore, max: 15 },
                { label: `Tổng điểm ${result.filterResult.sum} (F4)`, pass: result.filterResult.bellCurveSum, score: result.scoreBreakdown.bellCurveScore, max: 20 },
                { label: 'Không dồn liên tiếp ≥3 (F5)', pass: result.filterResult.consecutive, score: result.scoreBreakdown.consecutiveScore, max: 10 },
                { label: 'Phân tán đầu số (F6)', pass: result.filterResult.decadeSpread ?? true, score: 5, max: 5 },
                { label: `Khoảng cách biên Δ${result.filterResult.span ?? 0} (F7)`, pass: result.filterResult.spanSpread ?? true, score: 5, max: 5 },
                { label: 'Giới hạn trùng đuôi (F8)', pass: result.filterResult.lastDigitLimit ?? true, score: 5, max: 5 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/50 border border-gray-800/60">
                  <div className="flex items-center gap-2">
                    {item.pass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-gray-300 font-medium">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.pass ? 'text-emerald-400' : 'text-gray-500'}`}>
                    +{item.pass ? item.score : 0}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lịch Sử Trúng Thưởng */}
          <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-4 sm:p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Đối Chiếu Toàn Bộ Lịch Sử ({draws.length} kỳ quay)
            </h4>

            {result.historyMatches.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                Dãy số này chưa từng trúng giải thưởng nào ($\ge 3$ số trùng) trong lịch sử {draws.length} kỳ quay.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-medium">Hạng giải cao nhất từng nổ:</span>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {result.bestMatch?.prize} ({result.bestMatch?.matchCount}/6 số trùng)
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {result.historyMatches.slice(0, 8).map((match, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Kỳ #{match.drawId}</span>
                        <span className="text-gray-500">({match.date})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Trùng: {match.matchedNumbers.map(n => formatNumber(n)).join(', ')}</span>
                        <span className="font-bold text-emerald-400">{match.prize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

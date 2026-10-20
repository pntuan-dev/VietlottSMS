// ============================================================
// COMPONENT: CustomChecker - Kiểm tra và chấm điểm dãy số
// ============================================================

import React, { useState, useCallback } from 'react'
import { Search, AlertCircle, CheckCircle, XCircle, Trophy, TrendingUp, Flame, Snowflake } from 'lucide-react'
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

  // Tính điểm từng tiêu chí
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

  // Sort theo match count cao nhất
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
  const [inputValues, setInputValues] = useState<string[]>(['', '', '', '', '', ''])
  const [result, setResult] = useState<CheckerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMega = gameType === 'mega645'
  const maxNum = gameType === 'mega645' ? 45 : 55

  const handleInputChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2)
    const newValues = [...inputValues]
    newValues[index] = cleaned
    setInputValues(newValues)
    setResult(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      e.preventDefault()
      const nextInput = document.getElementById(`checker-input-${Math.min(index + 1, 5)}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    }
  }

  const handleCheck = useCallback(() => {
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

    if (draws.length < 5) {
      setError('Cần ít nhất 5 kỳ quay để kiểm tra lịch sử.')
      return
    }

    const checkerResult = calcCheckerResult(numbers, draws, gameType, analytics)
    setResult(checkerResult)
  }, [inputValues, draws, gameType, analytics, maxNum])

  const handleClear = () => {
    setInputValues(['', '', '', '', '', ''])
    setResult(null)
    setError(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/15 border-green-500/30'
    if (score >= 60) return 'bg-yellow-500/15 border-yellow-500/30'
    if (score >= 40) return 'bg-orange-500/15 border-orange-500/30'
    return 'bg-red-500/15 border-red-500/30'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Xuất sắc'
    if (score >= 70) return 'Tốt'
    if (score >= 55) return 'Trung bình'
    if (score >= 40) return 'Yếu'
    return 'Rất yếu'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Input Section */}
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className={`p-2 rounded-xl ${isMega ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <Search className={`w-4 h-4 ${isMega ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Kiểm Tra Dãy Số Của Bạn</h2>
            <p className="text-xs text-gray-500">Nhập 6 số từ 1–{maxNum} để phân tích độ tối ưu</p>
          </div>
        </div>

        {/* 6 Number Inputs */}
        <div className="flex justify-center gap-2 mb-4">
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
                w-12 h-12 text-center text-sm font-bold rounded-xl
                bg-gray-800 border transition-all duration-200
                text-white placeholder-gray-700
                focus:outline-none focus:ring-2
                ${val
                  ? isMega
                    ? 'border-red-500/50 focus:ring-red-500/40 focus:border-red-400'
                    : 'border-yellow-500/50 focus:ring-yellow-500/40 focus:border-yellow-400'
                  : 'border-gray-700 focus:ring-gray-500/40 focus:border-gray-500'
                }
              `}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            id="btn-check-numbers"
            onClick={handleCheck}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white transition-all duration-200
              ${isMega
                ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 shadow-lg shadow-yellow-500/30'
              }
            `}
          >
            <Search className="w-4 h-4" />
            Phân Tích Ngay
          </button>
          <button
            id="btn-clear-checker"
            onClick={handleClear}
            className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white
              text-sm font-medium border border-gray-700 transition-all duration-200"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-4 slide-in-up">
          {/* Score Card */}
          <div className={`rounded-2xl border p-5 ${getScoreBg(result.score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Điểm Tối Ưu</h3>
                <p className="text-xs text-gray-500">Thang điểm 100</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getScoreColor(result.score)}`}>
                  {result.score}
                </div>
                <div className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                  {getScoreLabel(result.score)}
                </div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="mt-3 h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.score >= 80 ? 'bg-green-500' :
                  result.score >= 60 ? 'bg-yellow-500' :
                  result.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            {/* Numbers Display */}
            <div className="flex justify-center gap-2 mt-4">
              {result.numbers.map((num, i) => (
                <LottoBall
                  key={num}
                  number={num}
                  gameType={gameType}
                  size="md"
                  isHighlighted={result.hotNumbersInSet.includes(num)}
                  animationDelay={i * 80}
                />
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chi Tiết Điểm</h4>
            <div className="space-y-2">
              {[
                { label: 'Chưa từng xổ (F1)', score: result.scoreBreakdown.zeroRepeatScore, max: 25, pass: result.filterResult.zeroRepeat },
                { label: `Chẵn/Lẻ ${getEvenOddLabel(result.filterResult.evenCount)} (F2)`, score: result.scoreBreakdown.evenOddScore, max: 15, pass: result.filterResult.evenOdd },
                { label: `Tài/Xỉu ${getHighLowLabel(result.filterResult.lowCount)} (F3)`, score: result.scoreBreakdown.highLowScore, max: 15, pass: result.filterResult.highLow },
                { label: `Tổng điểm ${result.filterResult.sum} (F4)`, score: result.scoreBreakdown.bellCurveScore, max: 20, pass: result.filterResult.bellCurveSum },
                { label: 'Không liên tiếp (F5)', score: result.scoreBreakdown.consecutiveScore, max: 10, pass: result.filterResult.consecutive },
                { label: `${result.scoreBreakdown.hotNumberBonus > 0 ? result.hotNumbersInSet.length + ' số nóng bonus' : 'Không có số nóng'}`, score: result.scoreBreakdown.hotNumberBonus, max: 10, pass: result.scoreBreakdown.hotNumberBonus > 0 },
                { label: `${result.scoreBreakdown.coldNearPeakBonus > 0 ? result.coldNearPeakInSet.length + ' số gan đỉnh bonus' : 'Không có số sắp nổ'}`, score: result.scoreBreakdown.coldNearPeakBonus, max: 5, pass: result.scoreBreakdown.coldNearPeakBonus > 0 },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.pass
                    ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  }
                  <span className="flex-1 text-xs text-gray-300">{item.label}</span>
                  <span className={`text-xs font-bold ${item.score > 0 ? 'text-white' : 'text-gray-600'}`}>
                    +{item.score}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hot/Cold in set */}
          {(result.hotNumbersInSet.length > 0 || result.coldNearPeakInSet.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {result.hotNumbersInSet.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-medium text-red-400">Số Nóng Trong Bộ</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hotNumbersInSet.map(n => (
                      <span key={n} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        {formatNumber(n)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.coldNearPeakInSet.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Snowflake className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Số Sắp Nổ</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.coldNearPeakInSet.map(n => (
                      <span key={n} className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        {formatNumber(n)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Matches */}
          <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">Lịch Sử Trùng Khớp</h4>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                result.historyMatches.length > 0
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-700 text-gray-500'
              }`}>
                {result.historyMatches.length} lần
              </span>
            </div>

            {result.historyMatches.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                <p className="text-sm text-green-400 font-medium">Chưa từng trùng 3+ số trong lịch sử</p>
                <p className="text-xs text-gray-600 mt-1">Dãy số hoàn toàn mới mẻ</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.historyMatches.slice(0, 10).map((match) => (
                  <div key={match.drawId} className={`
                    flex items-center gap-3 p-2.5 rounded-xl
                    ${match.matchCount >= 5 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      match.matchCount >= 4 ? 'bg-purple-500/10 border border-purple-500/20' :
                      'bg-gray-800/50 border border-gray-700/30'
                    }
                  `}>
                    {match.prize && (
                      <Trophy className={`w-4 h-4 shrink-0 ${
                        match.matchCount >= 5 ? 'text-yellow-400' : 'text-purple-400'
                      }`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-300">
                        Kỳ #{match.drawId} — {match.date}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.matchedNumbers.map(n => (
                          <span key={n} className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded font-mono">
                            {formatNumber(n)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-white">{match.matchCount}/6</div>
                      {match.prize && (
                        <div className={`text-[10px] font-medium ${
                          match.matchCount >= 5 ? 'text-yellow-400' : 'text-purple-400'
                        }`}>
                          {match.prize}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          {onSaveNumbers && (
            <button
              id="btn-save-checked-numbers"
              onClick={() => onSaveNumbers(result.numbers)}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${isMega
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 hover:border-red-400/60'
                  : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400/60'
                }
              `}
            >
              Lưu Bộ Số Này Vào Kho Vé
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomChecker

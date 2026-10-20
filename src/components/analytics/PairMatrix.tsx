// ============================================================
// COMPONENT: PairMatrix - Top 6 cặp số hay đi cùng nhau
// ============================================================

import React from 'react'
import { Link2, Layers } from 'lucide-react'
import type { AnalyticsResult, GameType } from '../../types'
import { LottoBall } from '../balls/LottoBall'
import { formatNumber } from '../../utils/storage'

interface PairMatrixProps {
  analytics: AnalyticsResult
  gameType: GameType
}

export const PairMatrix: React.FC<PairMatrixProps> = ({ analytics, gameType }) => {
  const isMega = gameType === 'mega645'
  const { topPairs, timeframeDraws } = analytics

  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Link2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Ma Trận Cặp Số</h3>
            <p className="text-xs text-gray-500">Top 6 cặp hay xuất hiện cùng nhau</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Layers className="w-3 h-3" />
          <span>C(6,2) pairs</span>
        </div>
      </div>

      {/* Pairs Grid */}
      {topPairs.length === 0 ? (
        <p className="text-center text-gray-600 text-sm py-8">Chưa có dữ liệu</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {topPairs.map((pair, index) => {
            const maxCount = topPairs[0]?.count ?? 1
            const relativeWidth = Math.round((pair.count / maxCount) * 100)
            const probability = timeframeDraws > 0
              ? ((pair.count / timeframeDraws) * 100).toFixed(1)
              : '0.0'

            return (
              <div
                key={`${pair.pair[0]}-${pair.pair[1]}`}
                className={`
                  relative overflow-hidden rounded-xl p-3
                  bg-gray-800/60 border border-gray-700/50
                  hover:border-purple-500/30 transition-all duration-200
                  card-hover
                `}
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 opacity-10 rounded-xl"
                  style={{
                    width: `${relativeWidth}%`,
                    background: isMega
                      ? 'linear-gradient(135deg, #ef4444, #f97316)'
                      : 'linear-gradient(135deg, #eab308, #22c55e)',
                  }}
                />

                <div className="relative flex items-center gap-2.5">
                  {/* Rank badge */}
                  <span className="text-xs font-bold text-gray-600 w-4">
                    #{index + 1}
                  </span>

                  {/* Pair balls */}
                  <div className="flex items-center gap-1">
                    <LottoBall
                      number={pair.pair[0]}
                      gameType={gameType}
                      size="sm"
                      animationDelay={index * 80}
                    />
                    <Link2 className="w-3 h-3 text-gray-600 shrink-0" />
                    <LottoBall
                      number={pair.pair[1]}
                      gameType={gameType}
                      size="sm"
                      animationDelay={index * 80 + 40}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex-1 text-right">
                    <div className={`text-sm font-bold ${isMega ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {pair.count}x
                    </div>
                    <div className="text-[10px] text-gray-600">{probability}%</div>
                  </div>
                </div>

                {/* Pair label */}
                <div className="relative mt-1.5 text-[10px] text-gray-600 text-center">
                  {formatNumber(pair.pair[0])} & {formatNumber(pair.pair[1])}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info note */}
      <p className="mt-3 text-[11px] text-gray-600 text-center">
        Tỷ lệ cùng xuất hiện trong {timeframeDraws} kỳ phân tích
      </p>
    </div>
  )
}

export default PairMatrix

// ============================================================
// COMPONENT: HotNumbers - Hiển thị top 10 số nóng
// ============================================================

import React from 'react'
import { Flame, TrendingUp } from 'lucide-react'
import type { AnalyticsResult, GameType } from '../../types'
import { LottoBall } from '../balls/LottoBall'

interface HotNumbersProps {
  analytics: AnalyticsResult
  gameType: GameType
}

export const HotNumbers: React.FC<HotNumbersProps> = ({ analytics, gameType }) => {
  const isMega = gameType === 'mega645'
  const { hotNumbers, timeframeDraws } = analytics

  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-500/20 rounded-lg">
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Số Nóng</h3>
            <p className="text-xs text-gray-500">Top 10 xuất hiện nhiều nhất</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TrendingUp className="w-3 h-3" />
          <span>{timeframeDraws} kỳ</span>
        </div>
      </div>

      {/* Numbers Grid */}
      <div className="space-y-2">
        {hotNumbers.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-6">Chưa có dữ liệu</p>
        ) : (
          hotNumbers.map((item, index) => {
            const maxPercentage = hotNumbers[0]?.percentage ?? 1
            const relativeWidth = Math.round((item.percentage / maxPercentage) * 100)

            return (
              <div key={item.number} className="flex items-center gap-3">
                {/* Rank */}
                <span className="w-5 text-right text-xs font-medium text-gray-600">
                  #{index + 1}
                </span>

                {/* Ball */}
                <LottoBall
                  number={item.number}
                  gameType={gameType}
                  size="sm"
                  animationDelay={index * 60}
                />

                {/* Bar */}
                <div className="flex-1 relative">
                  <div className="h-5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 flex items-center ${
                        isMega
                          ? 'bg-gradient-to-r from-red-700 to-orange-500'
                          : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                      }`}
                      style={{ width: `${relativeWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold ${isMega ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {item.count}x
                  </span>
                  <span className="text-xs text-gray-600 ml-1">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default HotNumbers

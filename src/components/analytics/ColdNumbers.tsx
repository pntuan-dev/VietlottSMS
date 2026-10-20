// ============================================================
// COMPONENT: ColdNumbers - Hiển thị top 10 số lạnh + Gan tracker
// ============================================================

import React from 'react'
import { Snowflake, AlertTriangle, Clock } from 'lucide-react'
import type { AnalyticsResult, GameType } from '../../types'
import { LottoBall } from '../balls/LottoBall'

interface ColdNumbersProps {
  analytics: AnalyticsResult
  gameType: GameType
}

export const ColdNumbers: React.FC<ColdNumbersProps> = ({ analytics, gameType }) => {
  const { coldNumbers } = analytics

  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Snowflake className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Số Lạnh & Chu Kỳ Gan</h3>
            <p className="text-xs text-gray-500">Top 10 lâu không xuất hiện</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-500">
          <AlertTriangle className="w-3 h-3" />
          <span>Sắp chạm đỉnh</span>
        </div>
      </div>

      {/* Numbers List */}
      <div className="space-y-2.5">
        {coldNumbers.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-6">Chưa có dữ liệu</p>
        ) : (
          coldNumbers.map((item, index) => {
            const ganProgress = item.maxHistoricalGan > 0
              ? Math.min(Math.round((item.currentGan / item.maxHistoricalGan) * 100), 100)
              : 0

            return (
              <div key={item.number} className={`
                rounded-xl p-2.5 border transition-colors duration-200
                ${item.isNearPeak
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-gray-800/40 border-gray-700/40'
                }
              `}>
                <div className="flex items-center gap-2.5">
                  {/* Rank */}
                  <span className="w-4 text-xs text-gray-600">#{index + 1}</span>

                  {/* Ball */}
                  <LottoBall
                    number={item.number}
                    gameType={gameType}
                    size="sm"
                    animationDelay={index * 60}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">
                          Gan hiện tại:
                          <span className={`ml-1 font-bold ${
                            item.isNearPeak ? 'text-amber-400' : 'text-white'
                          }`}>
                            {item.currentGan} kỳ
                          </span>
                        </span>
                        {item.isNearPeak && (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Đỉnh: {item.maxHistoricalGan}
                      </span>
                    </div>

                    {/* Gan progress bar */}
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.isNearPeak
                            ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                            : 'bg-gradient-to-r from-blue-700 to-blue-500'
                        }`}
                        style={{ width: `${ganProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-gray-600">0</span>
                      <span className={`text-[10px] font-medium ${
                        item.isNearPeak ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {ganProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Sắp chạm đỉnh (≥80%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Đang gan bình thường</span>
        </div>
      </div>
    </div>
  )
}

export default ColdNumbers

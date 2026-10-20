// ============================================================
// COMPONENT: TicketSet - Một bộ số đã tạo với actions
// ============================================================

import React, { useState } from 'react'
import { RefreshCw, Copy, Bookmark, CheckCircle, Flame, Snowflake, Target, Shield } from 'lucide-react'
import type { GeneratedSet, GameType } from '../../types'
import { LottoBall } from '../balls/LottoBall'
import { formatForSMS } from '../../utils/storage'
import { getEvenOddLabel, getHighLowLabel } from '../../engine/filters'

interface TicketSetProps {
  set: GeneratedSet
  index: number
  gameType: GameType
  onRegenerate: () => void
  onSave: () => void
  isRegenerating?: boolean
}

const STRATEGY_ICONS = {
  hot: <Flame className="w-3.5 h-3.5" />,
  balanced: <Target className="w-3.5 h-3.5" />,
  jackpot: <Shield className="w-3.5 h-3.5" />,
}

export const TicketSet: React.FC<TicketSetProps> = ({
  set,
  index,
  gameType,
  onRegenerate,
  onSave,
  isRegenerating = false,
}) => {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const isMega = gameType === 'mega645'

  const gradientClass = {
    hot: isMega
      ? 'from-red-600/20 to-orange-600/10 border-red-600/30'
      : 'from-yellow-600/20 to-amber-600/10 border-yellow-600/30',
    balanced: isMega
      ? 'from-blue-600/15 to-purple-600/10 border-blue-600/30'
      : 'from-teal-600/15 to-green-600/10 border-teal-600/30',
    jackpot: isMega
      ? 'from-purple-600/15 to-pink-600/10 border-purple-600/30'
      : 'from-green-600/15 to-emerald-600/10 border-green-600/30',
  }[set.strategy]

  const handleCopy = async () => {
    const text = formatForSMS(set.numbers)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSave = () => {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const { filterResult } = set
  const strategyLabel = {
    hot: 'Phong Độ Cao',
    balanced: 'Cân Bằng',
    jackpot: 'Độc Đắc',
  }[set.strategy]

  const strategyColor = {
    hot: isMega ? 'text-red-400 bg-red-500/15' : 'text-yellow-400 bg-yellow-500/15',
    balanced: isMega ? 'text-blue-400 bg-blue-500/15' : 'text-teal-400 bg-teal-500/15',
    jackpot: isMega ? 'text-purple-400 bg-purple-500/15' : 'text-green-400 bg-green-500/15',
  }[set.strategy]

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br
        ${gradientClass} p-4 slide-in-up card-hover
      `}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Strategy Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${strategyColor}`}>
          {STRATEGY_ICONS[set.strategy]}
          <span>{strategyLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            set.score >= 90 ? 'bg-green-500/20 text-green-400' :
            set.score >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {set.score}/100
          </div>
        </div>
      </div>

      {/* Strategy Description */}
      <p className="text-xs text-gray-500 mb-3">{set.strategyDesc}</p>

      {/* Balls Row */}
      <div className="flex justify-center gap-2 mb-3.5">
        {set.numbers.map((num, i) => (
          <LottoBall
            key={num}
            number={num}
            gameType={gameType}
            size="lg"
            animationDelay={index * 120 + i * 80}
          />
        ))}
      </div>

      {/* SMS Format */}
      <div className="text-center text-xs font-mono text-gray-500 mb-3 tracking-widest">
        {formatForSMS(set.numbers)}
      </div>

      {/* Filter Stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-3.5">
        <div className="bg-gray-800/60 rounded-lg p-1.5 text-center">
          <div className="text-xs text-gray-500 leading-none mb-0.5">Tổng</div>
          <div className={`text-xs font-bold ${isMega ? 'text-orange-400' : 'text-yellow-400'}`}>
            {filterResult.sum}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-1.5 text-center">
          <div className="text-xs text-gray-500 leading-none mb-0.5">C/L</div>
          <div className="text-xs font-bold text-blue-400">
            {getEvenOddLabel(filterResult.evenCount)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-1.5 text-center">
          <div className="text-xs text-gray-500 leading-none mb-0.5">N/Lớn</div>
          <div className="text-xs font-bold text-purple-400">
            {getHighLowLabel(filterResult.lowCount)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-1.5 text-center">
          <div className="text-xs text-gray-500 leading-none mb-0.5">Lịch sử</div>
          <div className="text-xs font-bold text-green-400">
            {filterResult.zeroRepeat ? '✓ Mới' : '✗'}
          </div>
        </div>
      </div>

      {/* Hot/Cold indicators */}
      {(set.containsHotCount > 0 || set.containsColdNearPeakCount > 0) && (
        <div className="flex gap-2 mb-3">
          {set.containsHotCount > 0 && (
            <div className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 rounded-full px-2 py-0.5">
              <Flame className="w-2.5 h-2.5" />
              <span>{set.containsHotCount} số nóng</span>
            </div>
          )}
          {set.containsColdNearPeakCount > 0 && (
            <div className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 rounded-full px-2 py-0.5">
              <Snowflake className="w-2.5 h-2.5" />
              <span>{set.containsColdNearPeakCount} sắp nổ</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          id={`btn-regen-${set.strategy}`}
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white
            text-xs font-medium border border-gray-600/50 hover:border-gray-500
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          Đổi dãy
        </button>
        <button
          id={`btn-copy-${set.strategy}`}
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white
            text-xs font-medium border border-gray-600/50 hover:border-gray-500
            transition-all duration-200"
        >
          {copied
            ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Đã copy!</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Copy SMS</span></>
          }
        </button>
        <button
          id={`btn-save-${set.strategy}`}
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            text-xs font-medium border transition-all duration-200
            ${saved
              ? 'bg-green-600/20 text-green-400 border-green-500/40'
              : isMega
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/40 hover:border-red-400/60'
                : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border-yellow-500/40 hover:border-yellow-400/60'
            }`}
        >
          {saved
            ? <><CheckCircle className="w-3.5 h-3.5" /><span>Đã lưu!</span></>
            : <><Bookmark className="w-3.5 h-3.5" /><span>Lưu vé</span></>
          }
        </button>
      </div>
    </div>
  )
}

export default TicketSet

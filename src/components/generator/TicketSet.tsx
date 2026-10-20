// ============================================================
// COMPONENT: TicketSet - Một bộ số đã tạo với actions
// ============================================================

import React, { useState } from 'react'
import { RefreshCw, Copy, Bookmark, CheckCircle, Flame, Snowflake, Target, Shield, Sparkles, Repeat } from 'lucide-react'
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
    balanced: 'Cân Bằng Đón Sóng',
    jackpot: 'Tối Ưu Độc Đắc',
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
        ${gradientClass} p-4 sm:p-5 slide-in-up card-hover flex flex-col justify-between
      `}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div>
        {/* Strategy Header */}
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${strategyColor}`}>
            {STRATEGY_ICONS[set.strategy]}
            <span>{strategyLabel}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {set.powerIndex && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {set.powerIndex}%
              </span>
            )}
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              set.score >= 90 ? 'bg-green-500/20 text-green-400' :
              set.score >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {set.score}đ
            </div>
          </div>
        </div>

        {/* Strategy Description */}
        <p className="text-xs text-gray-400 mb-3.5 leading-relaxed">{set.strategyDesc}</p>

        {/* Balls Row - Responsive cho mobile */}
        <div className="flex justify-center items-center gap-1.5 sm:gap-2.5 mb-3.5 flex-nowrap overflow-x-auto py-1">
          {set.numbers.map((num, i) => (
            <LottoBall
              key={num}
              number={num}
              gameType={gameType}
              size="lg"
              isHighlighted={num === set.echoNumber}
              animationDelay={index * 120 + i * 80}
            />
          ))}
        </div>

        {/* SMS Format & Echo Info */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-center text-xs font-mono text-gray-300 bg-gray-900/60 px-2.5 py-1 rounded-md border border-gray-800 tracking-wider">
            {formatForSMS(set.numbers)}
          </span>
          {set.echoNumber && (
            <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
              <Repeat className="w-3 h-3" />
              Lô rơi #{set.echoNumber.toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Filter Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-3.5">
          <div className="bg-gray-800/60 rounded-xl p-2 text-center border border-gray-800/50">
            <div className="text-[10px] text-gray-500 leading-none mb-1">Tổng điểm</div>
            <div className={`text-xs font-bold ${isMega ? 'text-orange-400' : 'text-yellow-400'}`}>
              {filterResult.sum}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-2 text-center border border-gray-800/50">
            <div className="text-[10px] text-gray-500 leading-none mb-1">Chẵn/Lẻ</div>
            <div className="text-xs font-bold text-blue-400">
              {getEvenOddLabel(filterResult.evenCount)}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-2 text-center border border-gray-800/50">
            <div className="text-[10px] text-gray-500 leading-none mb-1">Nhỏ/Lớn</div>
            <div className="text-xs font-bold text-purple-400">
              {getHighLowLabel(filterResult.lowCount)}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-2 text-center border border-gray-800/50">
            <div className="text-[10px] text-gray-500 leading-none mb-1">Biên độ</div>
            <div className="text-xs font-bold text-emerald-400">
              Δ{filterResult.span || (set.numbers[5] - set.numbers[0])}
            </div>
          </div>
        </div>

        {/* Hot/Cold badges */}
        {(set.containsHotCount > 0 || set.containsColdNearPeakCount > 0 || set.containsPairCount > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {set.containsHotCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] bg-red-500/10 text-red-400 rounded-full px-2 py-0.5 border border-red-500/20">
                <Flame className="w-3 h-3" />
                <span>{set.containsHotCount} số nóng</span>
              </div>
            )}
            {set.containsColdNearPeakCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 rounded-full px-2 py-0.5 border border-amber-500/20">
                <Snowflake className="w-3 h-3" />
                <span>{set.containsColdNearPeakCount} số chạm đỉnh gan</span>
              </div>
            )}
            {set.containsPairCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 rounded-full px-2 py-0.5 border border-blue-500/20">
                <Target className="w-3 h-3" />
                <span>{set.containsPairCount} cặp tần suất cao</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Touch friendly */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          id={`btn-regen-${set.strategy}`}
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white
            text-xs font-medium border border-gray-700 hover:border-gray-600
            transition-all duration-200 disabled:opacity-50 active:scale-95 touch-manipulation"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Đổi số</span>
        </button>

        <button
          id={`btn-copy-${set.strategy}`}
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            bg-gray-800/80 hover:bg-gray-700 text-gray-200 hover:text-white
            text-xs font-semibold border border-gray-700 hover:border-gray-600
            transition-all duration-200 active:scale-95 touch-manipulation"
        >
          {copied
            ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Đã chép</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Copy SMS</span></>
          }
        </button>

        <button
          id={`btn-save-${set.strategy}`}
          onClick={handleSave}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            text-xs font-semibold border transition-all duration-200 active:scale-95 touch-manipulation
            ${saved
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
              : isMega
                ? 'bg-red-600/30 hover:bg-red-600/40 text-red-200 border-red-500/50'
                : 'bg-yellow-600/30 hover:bg-yellow-600/40 text-yellow-200 border-yellow-500/50'
            }`}
        >
          {saved
            ? <><CheckCircle className="w-3.5 h-3.5" /><span>Đã lưu</span></>
            : <><Bookmark className="w-3.5 h-3.5" /><span>Lưu vé</span></>
          }
        </button>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENT: Header - Header chính + bộ điều khiển
// ============================================================

import React from 'react'
import { Trophy, Database, Clock, TrendingUp, Zap } from 'lucide-react'
import type { GameType, Timeframe } from '../../types'
import { getTimeframeOptions } from '../../utils/storage'

interface HeaderProps {
  gameType: GameType
  timeframe: Timeframe
  totalDraws: number
  onGameTypeChange: (type: GameType) => void
  onTimeframeChange: (t: Timeframe) => void
  onOpenDataManager: () => void
}

export const Header: React.FC<HeaderProps> = ({
  gameType,
  timeframe,
  totalDraws,
  onGameTypeChange,
  onTimeframeChange,
  onOpenDataManager,
}) => {
  const isMega = gameType === 'mega645'
  const timeframeOptions = getTimeframeOptions()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/60 backdrop-blur-xl"
      style={{ background: 'rgba(10, 13, 20, 0.92)' }}>
      {/* Top bar: Logo + Stats */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`p-2 rounded-xl ${isMega ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <Trophy
              className={`w-5 h-5 ${isMega ? 'text-red-400' : 'text-yellow-400'}`}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              Vietlott SMS
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Smart Analyzer & Generator
            </p>
          </div>
        </div>

        {/* Game Type Switcher */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            id="btn-mega645"
            onClick={() => onGameTypeChange('mega645')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isMega
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Mega 6/45
            </span>
          </button>
          <button
            id="btn-power655"
            onClick={() => onGameTypeChange('power655')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              !isMega
                ? 'bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg shadow-yellow-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Power 6/55
            </span>
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="hidden md:flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
            {timeframeOptions.map(opt => (
              <button
                key={String(opt.value)}
                id={`btn-timeframe-${opt.value}`}
                onClick={() => onTimeframeChange(opt.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                  timeframe === opt.value
                    ? isMega
                      ? 'bg-red-600/30 text-red-300 border border-red-600/50'
                      : 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats + Data Manager button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Database className="w-3.5 h-3.5" />
            <span className={`font-semibold ${isMega ? 'text-red-400' : 'text-yellow-400'}`}>
              {totalDraws}
            </span>
            <span>kỳ</span>
          </div>
          <button
            id="btn-open-data-manager"
            onClick={onOpenDataManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
              border border-gray-700 hover:border-gray-500
              transition-all duration-200"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Mobile Timeframe Selector */}
      <div className="md:hidden px-4 pb-2 flex items-center gap-1 overflow-x-auto">
        <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        {timeframeOptions.map(opt => (
          <button
            key={String(opt.value)}
            onClick={() => onTimeframeChange(opt.value)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
              timeframe === opt.value
                ? isMega
                  ? 'bg-red-600/30 text-red-300 border border-red-600/50'
                  : 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </header>
  )
}

export default Header

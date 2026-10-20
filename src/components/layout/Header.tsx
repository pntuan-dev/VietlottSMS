// ============================================================
// COMPONENT: Header - Header chính với Mobile Optimizer & Auto-Sync
// ============================================================

import React from 'react'
import { Trophy, Database, Clock, TrendingUp, Zap, RefreshCw } from 'lucide-react'
import type { GameType, Timeframe } from '../../types'
import { getTimeframeOptions } from '../../utils/storage'

interface HeaderProps {
  gameType: GameType
  timeframe: Timeframe
  totalDraws: number
  isSyncing?: boolean
  onGameTypeChange: (type: GameType) => void
  onTimeframeChange: (t: Timeframe) => void
  onOpenDataManager: () => void
  onSync?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  gameType,
  timeframe,
  totalDraws,
  isSyncing = false,
  onGameTypeChange,
  onTimeframeChange,
  onOpenDataManager,
  onSync,
}) => {
  const isMega = gameType === 'mega645'
  const timeframeOptions = getTimeframeOptions()

  return (
    <header
      className="sticky top-0 z-40 border-b border-gray-800/80 backdrop-blur-xl"
      style={{ background: 'rgba(10, 13, 20, 0.94)' }}
    >
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isMega ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${isMega ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
              Vietlott SMS
            </h1>
            <p className="text-[9px] sm:text-[10px] text-gray-400 leading-none">
              Smart Generator
            </p>
          </div>
        </div>

        {/* Game Type Switcher - Touch friendly */}
        <div className="flex items-center gap-1 bg-gray-950 rounded-xl p-1 border border-gray-800 shrink-0">
          <button
            id="btn-mega645"
            onClick={() => onGameTypeChange('mega645')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 touch-manipulation active:scale-95 ${
              isMega
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md shadow-red-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Mega 6/45</span>
            </span>
          </button>

          <button
            id="btn-power655"
            onClick={() => onGameTypeChange('power655')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 touch-manipulation active:scale-95 ${
              !isMega
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 shadow-md shadow-yellow-500/30 font-extrabold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Power 6/55</span>
            </span>
          </button>
        </div>

        {/* Timeframe Selector (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex items-center gap-1 bg-gray-950 rounded-lg p-1 border border-gray-800">
            {timeframeOptions.map(opt => (
              <button
                key={String(opt.value)}
                id={`btn-timeframe-${opt.value}`}
                onClick={() => onTimeframeChange(opt.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeframe === opt.value
                    ? isMega
                      ? 'bg-red-600/30 text-red-300 border border-red-500/40'
                      : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Actions: Sync + Data Manager */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Đồng Bộ Nhanh */}
          <button
            id="btn-sync-data"
            onClick={onSync}
            disabled={isSyncing}
            title="Đồng bộ kỳ quay mới nhất từ máy chủ"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
              bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white
              border border-gray-700 transition-all active:scale-95 touch-manipulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Đang kéo...' : 'Đồng bộ'}</span>
          </button>

          {/* Dữ liệu modal */}
          <button
            id="btn-open-data-manager"
            onClick={onOpenDataManager}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
              bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white
              border border-gray-700 transition-all active:scale-95 touch-manipulation"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-gray-200">{totalDraws}</span>
            <span className="hidden sm:inline">kỳ</span>
          </button>
        </div>
      </div>

      {/* Timeframe Bar on Mobile & Tablet */}
      <div className="lg:hidden px-3 sm:px-4 py-1.5 border-t border-gray-800/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Khung:
        </span>
        <div className="flex items-center gap-1">
          {timeframeOptions.map(opt => (
            <button
              key={`mob-${String(opt.value)}`}
              onClick={() => onTimeframeChange(opt.value)}
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                timeframe === opt.value
                  ? isMega
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                  : 'text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Header

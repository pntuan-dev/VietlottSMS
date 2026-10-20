// ============================================================
// COMPONENT: TabNav - Navigation tabs với Mobile Bottom Bar
// ============================================================

import React from 'react'
import { Sparkles, BarChart3, Search, BookMarked } from 'lucide-react'
import type { TabType, GameType } from '../../types'

interface TabNavProps {
  activeTab: TabType
  gameType: GameType
  savedCount: number
  onTabChange: (tab: TabType) => void
}

const TABS: Array<{ id: TabType; label: string; icon: React.ReactNode; shortLabel: string }> = [
  { id: 'generator', label: 'Gợi Ý Số', shortLabel: 'Gợi Ý', icon: <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" /> },
  { id: 'analytics', label: 'Thống Kê', shortLabel: 'Thống Kê', icon: <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4" /> },
  { id: 'checker', label: 'Kiểm Tra Số', shortLabel: 'Kiểm Tra', icon: <Search className="w-5 h-5 sm:w-4 sm:h-4" /> },
  { id: 'vault', label: 'Kho Vé', shortLabel: 'Kho Vé', icon: <BookMarked className="w-5 h-5 sm:w-4 sm:h-4" /> },
]

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  gameType,
  savedCount,
  onTabChange,
}) => {
  const isMega = gameType === 'mega645'

  const handleSelectTab = (tabId: TabType) => {
    onTabChange(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* 1. TOP TAB NAV (Dành cho Tablet & Desktop md+) */}
      <nav className="hidden md:block border-b border-gray-800/80 bg-gray-950/60 backdrop-blur-md sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-semibold
                    border-b-2 transition-all duration-200
                    ${isActive
                      ? isMega
                        ? 'border-red-500 text-orange-400 bg-red-500/5'
                        : 'border-yellow-400 text-yellow-300 bg-yellow-500/5'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                    }
                  `}
                >
                  <span className={isActive ? (isMega ? 'text-red-400' : 'text-yellow-400') : 'text-gray-500'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.id === 'vault' && savedCount > 0 && (
                    <span className={`
                      text-xs font-bold px-1.5 py-0.5 rounded-full leading-none
                      ${isMega ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'}
                    `}>
                      {savedCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* 2. MOBILE BOTTOM BAR CỐ ĐỊNH (Dành cho điện thoại < md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0d14]/95 backdrop-blur-xl border-t border-gray-800/90 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-4 items-center h-16 px-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={`mobile-${tab.id}`}
                id={`tab-mobile-${tab.id}`}
                onClick={() => handleSelectTab(tab.id)}
                className={`
                  flex flex-col items-center justify-center h-full relative transition-all duration-150 active:scale-95 touch-manipulation
                  ${isActive
                    ? isMega ? 'text-orange-400 font-bold' : 'text-yellow-300 font-bold'
                    : 'text-gray-500 font-medium hover:text-gray-300'
                  }
                `}
              >
                <div className="relative mb-0.5">
                  {tab.icon}
                  {tab.id === 'vault' && savedCount > 0 && (
                    <span className={`
                      absolute -top-1.5 -right-2 text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight
                      ${isMega ? 'bg-red-500 text-white shadow-sm shadow-red-500/50' : 'bg-yellow-500 text-gray-950 shadow-sm shadow-yellow-500/50'}
                    `}>
                      {savedCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{tab.shortLabel}</span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isMega ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default TabNav

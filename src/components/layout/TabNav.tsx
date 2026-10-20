// ============================================================
// COMPONENT: TabNav - Navigation tabs chính
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
  { id: 'generator', label: 'Gợi Ý Số', shortLabel: 'Gợi Ý', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'analytics', label: 'Thống Kê', shortLabel: 'Thống Kê', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'checker', label: 'Kiểm Tra Số', shortLabel: 'Kiểm Tra', icon: <Search className="w-4 h-4" /> },
  { id: 'vault', label: 'Kho Vé', shortLabel: 'Kho Vé', icon: <BookMarked className="w-4 h-4" /> },
]

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  gameType,
  savedCount,
  onTabChange,
}) => {
  const isMega = gameType === 'mega645'

  return (
    <nav className="border-b border-gray-800/60 bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? isMega
                      ? 'border-red-500 text-orange-400'
                      : 'border-yellow-400 text-yellow-300'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }
                `}
              >
                <span className={`transition-colors duration-200 ${
                  isActive
                    ? isMega ? 'text-red-400' : 'text-yellow-400'
                    : 'text-gray-600'
                }`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:block">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.id === 'vault' && savedCount > 0 && (
                  <span className={`
                    text-xs font-bold px-1.5 py-0.5 rounded-full leading-none
                    ${isMega
                      ? 'bg-red-500/30 text-red-300'
                      : 'bg-yellow-500/30 text-yellow-300'
                    }
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
  )
}

export default TabNav

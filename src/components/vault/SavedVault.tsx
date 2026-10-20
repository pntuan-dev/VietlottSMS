// ============================================================
// COMPONENT: SavedVault - Kho vé đã lưu + Auto-match
// ============================================================

import React, { useState } from 'react'
import { BookMarked, Trash2, Trophy, CheckCircle, XCircle, RefreshCw, Calendar, Tag, AlertTriangle } from 'lucide-react'
import type { SavedTicket, DrawResult, GameType } from '../../types'
import { LottoBall } from '../balls/LottoBall'
import { formatForSMS } from '../../utils/storage'

interface SavedVaultProps {
  tickets: SavedTicket[]
  draws: DrawResult[]
  gameType: GameType
  onDelete: (id: string) => void
  onClearAll: () => void
  onAutoMatch: () => void
}

export const SavedVault: React.FC<SavedVaultProps> = ({
  tickets,
  draws,
  gameType,
  onDelete,
  onClearAll,
  onAutoMatch,
}) => {
  const [confirmClear, setConfirmClear] = useState(false)
  const isMega = gameType === 'mega645'
  const latestDraw = draws[0]

  const getMatchBadge = (count: number) => {
    if (count >= 6) return { label: 'Jackpot! 🏆', className: 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 animate-pulse' }
    if (count >= 5) return { label: 'Giải Nhất', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' }
    if (count >= 4) return { label: 'Giải Nhì', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' }
    if (count >= 3) return { label: 'Giải Ba', className: 'bg-green-500/20 text-green-300 border border-green-500/30' }
    if (count >= 2) return { label: `${count}/6 trùng`, className: 'bg-gray-700 text-gray-400' }
    if (count === 1) return { label: '1/6 trùng', className: 'bg-gray-700/50 text-gray-500' }
    return { label: 'Không trùng', className: 'bg-gray-800/50 text-gray-600' }
  }

  const getStrategyLabel = (strategy?: string) => {
    if (!strategy) return null
    const map: Record<string, string> = {
      hot: 'Phong Độ Cao',
      balanced: 'Cân Bằng',
      jackpot: 'Độc Đắc',
    }
    return map[strategy] ?? strategy
  }

  const myGameTickets = tickets.filter(t => t.gameType === gameType)

  if (myGameTickets.length === 0) {
    return (
      <div className="text-center py-20 space-y-4 max-w-md mx-auto">
        <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center ${
          isMega ? 'bg-red-500/10' : 'bg-yellow-500/10'
        }`}>
          <BookMarked className={`w-10 h-10 ${isMega ? 'text-red-500/40' : 'text-yellow-500/40'}`} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-400 mb-1">Kho Vé Trống</h3>
          <p className="text-sm text-gray-600">
            Chưa có vé nào cho {isMega ? 'Mega 6/45' : 'Power 6/55'}.<br />
            Tạo bộ số và nhấn <strong className="text-gray-400">"Lưu vé"</strong> để thêm vào đây.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {myGameTickets.length} vé đang nuôi —{' '}
            <span className={isMega ? 'text-red-400' : 'text-yellow-400'}>
              {isMega ? 'Mega 6/45' : 'Power 6/55'}
            </span>
          </h2>
          {latestDraw && (
            <p className="text-xs text-gray-500 mt-0.5">
              Kỳ mới nhất: #{latestDraw.draw_id} ({latestDraw.date}) —{' '}
              {latestDraw.numbers.map(n => n.toString().padStart(2, '0')).join(' ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {latestDraw && (
            <button
              id="btn-auto-match"
              onClick={onAutoMatch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 border
                ${isMega
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/40'
                  : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border-yellow-500/40'
                }
              `}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Dò số tự động
            </button>
          )}

          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onClearAll(); setConfirmClear(false) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Xác nhận xóa
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              id="btn-clear-all-tickets"
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400
                border border-gray-700 hover:border-red-500/40 transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {myGameTickets.map((ticket, index) => {
          const matchResult = ticket.autoMatchResult
          const matchBadge = matchResult ? getMatchBadge(matchResult.matchCount) : null
          const strategyLabel = getStrategyLabel(ticket.strategy)

          return (
            <div
              key={ticket.id}
              className={`
                relative bg-gray-900/60 rounded-2xl border p-4 slide-in-up card-hover
                ${matchResult && matchResult.matchCount >= 3
                  ? 'border-yellow-500/30 shadow-md shadow-yellow-500/10'
                  : 'border-gray-800'
                }
              `}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Label & Strategy */}
              <div className="flex items-start justify-between mb-2.5 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className={`w-3 h-3 shrink-0 ${isMega ? 'text-red-400' : 'text-yellow-400'}`} />
                    <span className="text-xs font-medium text-gray-300 truncate">{ticket.label}</span>
                  </div>
                  {strategyLabel && (
                    <span className="text-[10px] text-gray-600 mt-0.5 block">{strategyLabel}</span>
                  )}
                </div>
                <button
                  onClick={() => onDelete(ticket.id)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                  title="Xóa vé"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Balls */}
              <div className="flex justify-center gap-1.5 mb-2.5">
                {ticket.numbers.map(num => (
                  <LottoBall
                    key={num}
                    number={num}
                    gameType={gameType}
                    size="sm"
                    isMatched={matchResult?.matchedNumbers?.includes(num) ?? false}
                  />
                ))}
              </div>

              {/* SMS Format */}
              <p className="text-center text-[10px] font-mono text-gray-600 mb-2.5">
                {formatForSMS(ticket.numbers)}
              </p>

              {/* Match Result */}
              {matchResult ? (
                <div className={`rounded-lg px-2.5 py-1.5 ${matchBadge?.className ?? ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {matchResult.matchCount >= 3
                        ? <Trophy className="w-3.5 h-3.5" />
                        : matchResult.matchCount > 0
                          ? <CheckCircle className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />
                      }
                      <span className="text-xs font-bold">{matchBadge?.label}</span>
                    </div>
                    <span className="text-[10px] opacity-70">
                      Kỳ #{matchResult.drawId}
                    </span>
                  </div>
                  {matchResult.matchedNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchResult.matchedNumbers.map(n => (
                        <span key={n} className="text-[9px] bg-white/10 px-1 rounded font-mono">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Chưa dò số — nhấn "Dò số tự động"</span>
                </div>
              )}

              {/* Saved date */}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-700">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(ticket.savedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SavedVault

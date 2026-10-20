// ============================================================
// HOOK: useSavedTickets - Quản lý vé đã lưu
// ============================================================

import { useState, useCallback } from 'react'
import type { SavedTicket, GameType, DrawResult } from '../types'
import {
  getSavedTickets,
  saveTicket,
  deleteTicket as deleteTicketStorage,
  generateId,
} from '../utils/storage'

export function useSavedTickets() {
  const [tickets, setTickets] = useState<SavedTicket[]>(() => getSavedTickets())

  /** Lưu vé mới */
  const addTicket = useCallback((
    numbers: number[],
    gameType: GameType,
    label: string,
    strategy?: SavedTicket['strategy']
  ) => {
    const ticket: SavedTicket = {
      id: generateId(),
      gameType,
      numbers: [...numbers].sort((a, b) => a - b),
      savedAt: new Date().toISOString(),
      label,
      strategy,
    }
    saveTicket(ticket)
    setTickets(getSavedTickets())
    return ticket
  }, [])

  /** Xóa vé */
  const deleteTicket = useCallback((id: string) => {
    const updated = deleteTicketStorage(id)
    setTickets(updated)
  }, [])

  /** Xóa tất cả vé */
  const clearAll = useCallback(() => {
    const updated: SavedTicket[] = []
    localStorage.setItem('vietlott_saved_tickets', JSON.stringify(updated))
    setTickets(updated)
  }, [])

  /**
   * Đối chiếu tự động tất cả vé với kỳ xổ mới nhất
   * Trả về số lượng vé có ít nhất 1 số trùng
   */
  const autoMatchWithLatest = useCallback((latestDraw: DrawResult) => {
    const allTickets = getSavedTickets()
    let matchedCount = 0

    const updated = allTickets.map(ticket => {
      const matchedNumbers = ticket.numbers.filter(n => latestDraw.numbers.includes(n))
      const matchCount = matchedNumbers.length

      if (matchCount > 0) matchedCount++

      return {
        ...ticket,
        autoMatchResult: {
          drawId: latestDraw.draw_id,
          drawDate: latestDraw.date,
          matchCount,
          matchedNumbers,
          checkedAt: new Date().toISOString(),
        },
      }
    })

    localStorage.setItem('vietlott_saved_tickets', JSON.stringify(updated))
    setTickets(updated)
    return matchedCount
  }, [])

  /** Reload từ localStorage */
  const reload = useCallback(() => {
    setTickets(getSavedTickets())
  }, [])

  return {
    tickets,
    addTicket,
    deleteTicket,
    clearAll,
    autoMatchWithLatest,
    reload,
  }
}

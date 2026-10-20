// ============================================================
// HOOK: useLotteryData - Quản lý toàn bộ dữ liệu kỳ quay
// ============================================================

import { useState, useCallback } from 'react'
import type { DrawResult, GameType } from '../types'
import {
  getDraws,
  addDraw as addDrawToStorage,
  mergeDraws,
  resetToSeed,
} from '../utils/storage'

export interface LotteryDataState {
  draws: DrawResult[]
  gameType: GameType
  isLoading: boolean
  error: string | null
}

export interface LotteryDataActions {
  setGameType: (type: GameType) => void
  addDraw: (draw: DrawResult) => void
  importDraws: (newDraws: DrawResult[]) => void
  resetData: () => void
  clearError: () => void
}

export function useLotteryData(initialGameType: GameType = 'mega645') {
  const [gameType, setGameTypeState] = useState<GameType>(initialGameType)
  const [draws, setDraws] = useState<DrawResult[]>(() => getDraws(initialGameType))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Chuyển đổi loại game */
  const setGameType = useCallback((type: GameType) => {
    setGameTypeState(type)
    setDraws(getDraws(type))
    setError(null)
  }, [])

  /** Thêm một kỳ quay mới */
  const addDraw = useCallback((draw: DrawResult) => {
    const updated = addDrawToStorage(gameType, draw)
    setDraws(updated)
  }, [gameType])

  /** Import danh sách kỳ quay (merge với existing) */
  const importDraws = useCallback((newDraws: DrawResult[]) => {
    setIsLoading(true)
    try {
      const merged = mergeDraws(gameType, newDraws)
      setDraws(merged)
      setError(null)
    } catch (e) {
      setError(`Lỗi khi import: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [gameType])

  /** Reset về seed data */
  const resetData = useCallback(() => {
    const seed = resetToSeed(gameType)
    setDraws(seed)
    setError(null)
  }, [gameType])

  /** Xóa thông báo lỗi */
  const clearError = useCallback(() => setError(null), [])

  return {
    draws,
    gameType,
    isLoading,
    error,
    setGameType,
    addDraw,
    importDraws,
    resetData,
    clearError,
  }
}

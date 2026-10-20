// ============================================================
// HOOK: useAnalytics - Tính toán analytics từ dữ liệu
// ============================================================

import { useMemo } from 'react'
import type { DrawResult, GameType, Timeframe, AnalyticsResult } from '../types'
import { computeAnalytics } from '../utils/analytics'

export function useAnalytics(
  draws: DrawResult[],
  gameType: GameType,
  timeframe: Timeframe
): AnalyticsResult {
  return useMemo(() => {
    if (draws.length === 0) {
      return {
        hotNumbers: [],
        coldNumbers: [],
        topPairs: [],
        totalDraws: 0,
        timeframeDraws: 0,
      }
    }
    return computeAnalytics(draws, gameType, timeframe)
  }, [draws, gameType, timeframe])
}

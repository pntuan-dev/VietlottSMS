// ============================================================
// TYPES - Toàn bộ TypeScript type definitions cho ứng dụng
// ============================================================

/** Loại trò chơi xổ số */
export type GameType = 'mega645' | 'power655'

/** Khung thời gian phân tích */
export type Timeframe = 30 | 100 | 'all'

/** Chiến thuật tạo số */
export type Strategy = 'hot' | 'balanced' | 'jackpot'

/** Tab hiển thị */
export type TabType = 'generator' | 'analytics' | 'checker' | 'vault'

/** Một kỳ quay xổ số */
export interface DrawResult {
  draw_id: string
  date: string
  numbers: number[]   // 6 số chính, sort tăng dần
  bonus?: number      // Power 6/55 có số bonus
}

/** Thông tin tần suất một số */
export interface HotNumber {
  number: number
  count: number
  percentage: number
}

/** Thông tin số lạnh + gan */
export interface ColdNumber {
  number: number
  count: number
  currentGan: number
  maxHistoricalGan: number
  isNearPeak: boolean  // currentGan >= 80% maxHistoricalGan
}

/** Thông tin cặp số hay đi cùng nhau */
export interface NumberPair {
  pair: [number, number]
  count: number
}

/** Kết quả phân tích thống kê */
export interface AnalyticsResult {
  hotNumbers: HotNumber[]
  coldNumbers: ColdNumber[]
  topPairs: NumberPair[]
  totalDraws: number
  timeframeDraws: number
}

/** Trạng thái vượt qua các bộ lọc vàng */
export interface FilterResult {
  zeroRepeat: boolean
  evenOdd: boolean
  highLow: boolean
  bellCurveSum: boolean
  consecutive: boolean
  decadeSpread?: boolean
  spanSpread?: boolean
  lastDigitLimit?: boolean
  allPassed: boolean
  sum: number
  evenCount: number
  oddCount: number
  highCount: number
  lowCount: number
  span?: number
}

/** Một bộ số được tạo ra */
export interface GeneratedSet {
  id: string
  numbers: number[]
  strategy: Strategy
  strategyName: string
  strategyDesc: string
  filterResult: FilterResult
  score: number
  powerIndex?: number
  echoNumber?: number
  containsHotCount: number
  containsColdNearPeakCount: number
  containsPairCount: number
}

/** Lịch sử trùng khớp khi kiểm tra */
export interface HistoryMatch {
  drawId: string
  date: string
  matchCount: number
  matchedNumbers: number[]
  prize: string | null // "Jackpot" | "Giải Nhất" | "Giải Nhì" | "Giải Ba" | null
}

/** Kết quả kiểm tra bộ số do người dùng nhập */
export interface CheckerResult {
  numbers: number[]
  filterResult: FilterResult
  score: number
  historyMatches: HistoryMatch[]
  bestMatch: HistoryMatch | null
  hotNumbersInSet: number[]
  coldNearPeakInSet: number[]
  scoreBreakdown: ScoreBreakdown
}

/** Chi tiết điểm số */
export interface ScoreBreakdown {
  zeroRepeatScore: number      // 25 điểm
  evenOddScore: number         // max 15 điểm
  highLowScore: number         // max 15 điểm
  bellCurveScore: number       // 20 điểm
  consecutiveScore: number     // 10 điểm
  hotNumberBonus: number       // max 10 điểm
  coldNearPeakBonus: number    // max 5 điểm
  total: number
}

/** Vé đã lưu của người dùng */
export interface SavedTicket {
  id: string
  gameType: GameType
  numbers: number[]
  savedAt: string
  label: string
  strategy?: Strategy
  autoMatchResult?: AutoMatchResult
}

/** Kết quả đối chiếu tự động với kỳ xổ mới nhất */
export interface AutoMatchResult {
  drawId: string
  drawDate: string
  matchCount: number
  matchedNumbers: number[]
  checkedAt: string
}

/** Cấu hình ưu tiên người dùng */
export interface UserPreferences {
  gameType: GameType
  timeframe: Timeframe
  activeTab: TabType
}

/** Props chung cho Modal */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

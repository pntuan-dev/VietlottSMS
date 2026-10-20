// ============================================================
// STORAGE UTILS - Helpers cho localStorage
// ============================================================

import type { DrawResult, GameType, SavedTicket, UserPreferences, Timeframe, TabType } from '../types'
import { MEGA645_SEED } from '../data/mega645.seed'
import { POWER655_SEED } from '../data/power655.seed'

const KEYS = {
  mega645: 'vietlott_mega645_draws',
  power655: 'vietlott_power655_draws',
  savedTickets: 'vietlott_saved_tickets',
  preferences: 'vietlott_preferences',
}

/** Lấy danh sách kỳ quay từ localStorage (hoặc seed nếu chưa có) */
export function getDraws(gameType: GameType): DrawResult[] {
  const key = KEYS[gameType]
  const raw = localStorage.getItem(key)
  if (!raw) {
    // Lần đầu: lưu seed vào localStorage rồi trả về
    const seed = gameType === 'mega645' ? MEGA645_SEED : POWER655_SEED
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as DrawResult[]
    return parsed
  } catch {
    return gameType === 'mega645' ? MEGA645_SEED : POWER655_SEED
  }
}

/** Lưu danh sách kỳ quay vào localStorage */
export function saveDraws(gameType: GameType, draws: DrawResult[]): void {
  // Sort giảm dần theo draw_id trước khi lưu
  const sorted = [...draws].sort((a, b) => b.draw_id.localeCompare(a.draw_id))
  // Deduplicate theo draw_id
  const unique = sorted.filter((draw, index, self) =>
    index === self.findIndex(d => d.draw_id === draw.draw_id)
  )
  localStorage.setItem(KEYS[gameType], JSON.stringify(unique))
}

/** Thêm một kỳ quay mới vào đầu danh sách */
export function addDraw(gameType: GameType, draw: DrawResult): DrawResult[] {
  const existing = getDraws(gameType)
  // Kiểm tra trùng draw_id
  const isDuplicate = existing.some(d => d.draw_id === draw.draw_id)
  if (isDuplicate) {
    return existing
  }
  const updated = [draw, ...existing].sort((a, b) => b.draw_id.localeCompare(a.draw_id))
  saveDraws(gameType, updated)
  return updated
}

/** Merge danh sách kỳ quay mới vào existing (dùng cho import) */
export function mergeDraws(gameType: GameType, newDraws: DrawResult[]): DrawResult[] {
  const existing = getDraws(gameType)
  const combined = [...existing, ...newDraws]
  saveDraws(gameType, combined)
  return getDraws(gameType)
}

/** Lấy danh sách vé đã lưu */
export function getSavedTickets(): SavedTicket[] {
  const raw = localStorage.getItem(KEYS.savedTickets)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SavedTicket[]
  } catch {
    return []
  }
}

/** Lưu một vé mới */
export function saveTicket(ticket: SavedTicket): void {
  const existing = getSavedTickets()
  const updated = [ticket, ...existing]
  localStorage.setItem(KEYS.savedTickets, JSON.stringify(updated))
}

/** Xóa một vé theo id */
export function deleteTicket(id: string): SavedTicket[] {
  const existing = getSavedTickets()
  const updated = existing.filter(t => t.id !== id)
  localStorage.setItem(KEYS.savedTickets, JSON.stringify(updated))
  return updated
}

/** Cập nhật một vé (dùng cho auto-match) */
export function updateTicket(id: string, partial: Partial<SavedTicket>): SavedTicket[] {
  const existing = getSavedTickets()
  const updated = existing.map(t => t.id === id ? { ...t, ...partial } : t)
  localStorage.setItem(KEYS.savedTickets, JSON.stringify(updated))
  return updated
}

/** Lấy preferences người dùng */
export function getPreferences(): UserPreferences {
  const raw = localStorage.getItem(KEYS.preferences)
  if (!raw) {
    return { gameType: 'mega645', timeframe: 100, activeTab: 'generator' }
  }
  try {
    return JSON.parse(raw) as UserPreferences
  } catch {
    return { gameType: 'mega645', timeframe: 100, activeTab: 'generator' }
  }
}

/** Lưu preferences */
export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = getPreferences()
  const updated = { ...current, ...prefs }
  localStorage.setItem(KEYS.preferences, JSON.stringify(updated))
}

/** Reset toàn bộ dữ liệu về seed */
export function resetToSeed(gameType: GameType): DrawResult[] {
  const seed = gameType === 'mega645' ? MEGA645_SEED : POWER655_SEED
  localStorage.setItem(KEYS[gameType], JSON.stringify(seed))
  return seed
}

/** Lấy N kỳ gần nhất theo timeframe */
export function getDrawsByTimeframe(draws: DrawResult[], timeframe: Timeframe): DrawResult[] {
  if (timeframe === 'all') return draws
  return draws.slice(0, timeframe)
}

/** Format số thành chuỗi 2 chữ số (ví dụ: 6 → "06") */
export function formatNumber(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Format dãy số thành chuỗi SMS (ví dụ: "06 16 23 31 36 44") */
export function formatForSMS(numbers: number[]): string {
  return numbers.map(formatNumber).join(' ')
}

/** Generate unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/** Validate một DrawResult */
export function validateDraw(draw: unknown, gameType: GameType): draw is DrawResult {
  if (!draw || typeof draw !== 'object') return false
  const d = draw as Record<string, unknown>
  if (typeof d.draw_id !== 'string') return false
  if (typeof d.date !== 'string') return false
  if (!Array.isArray(d.numbers)) return false
  if (d.numbers.length !== 6) return false
  const maxNum = gameType === 'mega645' ? 45 : 55
  for (const n of d.numbers) {
    if (typeof n !== 'number' || n < 1 || n > maxNum) return false
  }
  return true
}

/** Lấy timeframe label */
export function getTimeframeLabel(timeframe: Timeframe): string {
  if (timeframe === 30) return '30 kỳ gần nhất'
  if (timeframe === 100) return '100 kỳ gần nhất'
  return 'Toàn bộ lịch sử'
}

/** Lấy timeframe option label cho display */
export function getTimeframeOptions(): Array<{ value: Timeframe; label: string }> {
  return [
    { value: 30, label: '30 kỳ (Ngắn hạn)' },
    { value: 100, label: '100 kỳ (Trung hạn)' },
    { value: 'all', label: 'Tất cả (Dài hạn)' },
  ]
}

/** Parse tab param thành TabType */
export function parseTabType(value: string): TabType {
  const validTabs: TabType[] = ['generator', 'analytics', 'checker', 'vault']
  return validTabs.includes(value as TabType) ? (value as TabType) : 'generator'
}

// ============================================================
// APP - Root Component của Vietlott SMS Smart Analyzer & Generator
// Tối ưu hóa toàn diện cho Mobile + Tự Động Kéo Dữ Liệu Mới Nhất
// ============================================================

import { useState, useCallback, useEffect, useTransition } from 'react'
import type { GameType, Timeframe, TabType, Strategy } from './types'
import { useLotteryData } from './hooks/useLotteryData'
import { useAnalytics } from './hooks/useAnalytics'
import { useSavedTickets } from './hooks/useSavedTickets'
import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { LottoBall } from './components/balls/LottoBall'
import { GeneratorPanel } from './components/generator/GeneratorPanel'
import { HotNumbers } from './components/analytics/HotNumbers'
import { ColdNumbers } from './components/analytics/ColdNumbers'
import { PairMatrix } from './components/analytics/PairMatrix'
import { CustomChecker } from './components/checker/CustomChecker'
import { SavedVault } from './components/vault/SavedVault'
import { DataManager } from './components/data/DataManager'
import { getPreferences, savePreferences } from './utils/storage'
import { syncLatestData } from './utils/syncService'
import { Sparkles, Calendar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function App() {
  const initialPrefs = getPreferences()

  const [gameType, setGameTypeState] = useState<GameType>(initialPrefs.gameType || 'mega645')
  const [timeframe, setTimeframe] = useState<Timeframe>(initialPrefs.timeframe || 100)
  const [activeTab, setActiveTabState] = useState<TabType>(initialPrefs.activeTab || 'generator')
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [, startTransition] = useTransition()

  // Custom Hooks quản lý dữ liệu
  const {
    draws,
    setGameType: setGameTypeInHook,
    addDraw,
    importDraws,
    resetData,
  } = useLotteryData(gameType)

  const analytics = useAnalytics(draws, gameType, timeframe)
  const { tickets, addTicket, deleteTicket, clearAll, autoMatchWithLatest } = useSavedTickets()

  // Toast thông báo
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 3200)
  }, [])

  // Hàm đồng bộ dữ liệu (tự động kéo thêm kỳ mới nhất so với dữ liệu trên máy)
  const handleSyncData = useCallback(async (isSilent = false) => {
    setIsSyncing(true)
    try {
      const syncResult = await syncLatestData(gameType)
      if (syncResult.success && syncResult.newDrawsCount > 0) {
        // Có kỳ quay mới -> Reload lại dữ liệu trong hook
        setGameTypeInHook(gameType)
        showToast(syncResult.message)
      } else if (!isSilent) {
        showToast(syncResult.message)
      }
    } catch {
      if (!isSilent) {
        showToast('Không thể kết nối máy chủ, đang dùng dữ liệu lưu tại máy.')
      }
    } finally {
      setIsSyncing(false)
    }
  }, [gameType, setGameTypeInHook, showToast])

  // TỰ ĐỘNG KÉO THÊM DỮ LIỆU MỚI NHẤT KHI VÀO ỨNG DỤNG HOẶC CHUYỂN GAME
  useEffect(() => {
    handleSyncData(true)
  }, [handleSyncData])

  // Chuyển đổi loại game (Mega 6/45 <-> Power 6/55)
  const handleGameTypeChange = useCallback(
    (type: GameType) => {
      startTransition(() => {
        setGameTypeState(type)
        setGameTypeInHook(type)
        savePreferences({ gameType: type })
      })
    },
    [setGameTypeInHook]
  )

  // Đổi khung thời gian phân tích
  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
    savePreferences({ timeframe: tf })
  }, [])

  // Đổi tab
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTabState(tab)
    savePreferences({ activeTab: tab })
  }, [])

  // Xử lý lưu vé từ GeneratorPanel
  const handleSaveTicketFromGenerator = useCallback(
    (numbers: number[], strategy: Strategy) => {
      const strategyNames: Record<Strategy, string> = {
        hot: 'Phong Độ Cao',
        balanced: 'Cân Bằng Đón Sóng',
        jackpot: 'Tối Ưu Độc Đắc',
      }
      addTicket(numbers, gameType, `Gợi ý: ${strategyNames[strategy]}`, strategy)
      showToast('Đã lưu vé vào Kho Vé thành công!')
    },
    [addTicket, gameType, showToast]
  )

  // Xử lý lưu vé từ CustomChecker
  const handleSaveTicketFromChecker = useCallback(
    (numbers: number[]) => {
      addTicket(numbers, gameType, 'Vé tự kiểm tra')
      showToast('Đã lưu bộ số vào Kho Vé thành công!')
    },
    [addTicket, gameType, showToast]
  )

  // Đối chiếu vé tự động với kết quả kỳ mới nhất
  const handleAutoMatch = useCallback(() => {
    if (draws.length === 0) return
    const matchedCount = autoMatchWithLatest(draws[0])
    showToast(`Đã đối chiếu! Có ${matchedCount} vé có số trùng khớp giải thưởng.`)
  }, [draws, autoMatchWithLatest, showToast])

  const latestDraw = draws[0] || null
  const isMega = gameType === 'mega645'

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-50 flex justify-center md:justify-end pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-900/95 border border-emerald-500/40 text-emerald-300 rounded-2xl shadow-2xl backdrop-blur-xl text-xs sm:text-sm font-semibold animate-bounce pointer-events-auto max-w-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Sticky có nút đồng bộ */}
      <Header
        gameType={gameType}
        timeframe={timeframe}
        totalDraws={draws.length}
        isSyncing={isSyncing}
        onGameTypeChange={handleGameTypeChange}
        onTimeframeChange={handleTimeframeChange}
        onOpenDataManager={() => setIsDataManagerOpen(true)}
        onSync={() => handleSyncData(false)}
      />

      {/* Desktop/Tablet Top Tab Nav */}
      <TabNav
        activeTab={activeTab}
        gameType={gameType}
        savedCount={tickets.filter((t) => t.gameType === gameType).length}
        onTabChange={handleTabChange}
      />

      {/* Main Container - Thêm pb-24 trên mobile để không bị Bottom Bar che khuất */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 pb-24 md:pb-8">
        {/* Banner Kỳ Quay Mới Nhất */}
        {latestDraw && (
          <section className="relative overflow-hidden rounded-2xl border border-gray-800/80 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-gray-900/90 p-4 sm:p-6 backdrop-blur-md shadow-xl">
            <div
              className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15 ${
                isMega ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                      isMega
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Kỳ mới nhất #{latestDraw.draw_id}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {latestDraw.date}
                  </span>

                  <button
                    onClick={() => handleSyncData(false)}
                    disabled={isSyncing}
                    className="flex items-center gap-1 text-[10px] font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/20 transition-all active:scale-95"
                    title="Kéo thêm kết quả mới nhất"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang kéo...' : 'Cập nhật'}</span>
                  </button>
                </div>

                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                  Kết Quả Xổ Số {isMega ? 'Mega 6/45' : 'Power 6/55'}
                </h2>
              </div>

              {/* Dãy bóng kỳ mới nhất - Tối ưu flex co giãn trên mobile */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 py-1">
                {latestDraw.numbers.map((num, idx) => (
                  <LottoBall
                    key={`${num}-${idx}`}
                    number={num}
                    gameType={gameType}
                    size="lg"
                    isHighlighted={true}
                    animationDelay={idx * 60}
                  />
                ))}

                {/* Bóng Bonus nếu là Power 6/55 */}
                {!isMega && latestDraw.bonus !== undefined && (
                  <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-gray-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-amber-400 font-bold mb-0.5 uppercase tracking-wider">Bonus</span>
                      <LottoBall
                        number={latestDraw.bonus}
                        gameType={gameType}
                        size="lg"
                        isHighlighted={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'generator' && (
            <GeneratorPanel
              analytics={analytics}
              draws={draws}
              gameType={gameType}
              onSaveTicket={handleSaveTicketFromGenerator}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Bảng Thống Kê Xác Suất
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        isMega ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {timeframe === 'all' ? 'Toàn bộ lịch sử' : `${timeframe} kỳ gần nhất`}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400">
                    Tần suất xuất hiện, chu kỳ gan cực đại và các cặp số thường về cùng nhau
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <HotNumbers analytics={analytics} gameType={gameType} />
                <ColdNumbers analytics={analytics} gameType={gameType} />
                <PairMatrix analytics={analytics} gameType={gameType} />
              </div>
            </div>
          )}

          {activeTab === 'checker' && (
            <CustomChecker
              draws={draws}
              gameType={gameType}
              analytics={analytics}
              onSaveNumbers={handleSaveTicketFromChecker}
            />
          )}

          {activeTab === 'vault' && (
            <SavedVault
              tickets={tickets}
              draws={draws}
              gameType={gameType}
              onDelete={deleteTicket}
              onClearAll={clearAll}
              onAutoMatch={handleAutoMatch}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800/80 bg-gray-950/80 py-6 px-4 text-center text-xs text-gray-500 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-medium text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Cú pháp SMS chuẩn Vietlott SMS: Gửi 9969 (Soạn: 645/655 K1 S [Dãy 6 số])
          </p>
          <p className="text-[11px]">
            Hệ thống phân tích toán học xác suất thống kê • Dữ liệu tự động lưu trữ bảo mật tại trình duyệt của bạn (localStorage).
          </p>
          <p className="text-gray-600 text-[10px]">
            © {new Date().getFullYear()} Vietlott SMS Smart Analyzer & Generator • Serverless SPA
          </p>
        </div>
      </footer>

      {/* Data Management Modal */}
      <DataManager
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
        gameType={gameType}
        totalDraws={draws.length}
        latestDraw={latestDraw}
        onImport={(newDraws) => {
          importDraws(newDraws)
          showToast(`Đã nạp thành công ${newDraws.length} kỳ quay!`)
          setIsDataManagerOpen(false)
        }}
        onAddDraw={(newDraw) => {
          addDraw(newDraw)
          showToast(`Đã thêm kỳ quay #${newDraw.draw_id} thành công!`)
          setIsDataManagerOpen(false)
        }}
        onReset={() => {
          resetData()
          showToast('Đã khôi phục dữ liệu về mặc định (Seed Data)!')
          setIsDataManagerOpen(false)
        }}
      />
    </div>
  )
}

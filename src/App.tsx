// ============================================================
// APP - Root Component của Vietlott SMS Smart Analyzer & Generator
// ============================================================

import { useState, useCallback, useTransition } from 'react'
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
import { Sparkles, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

export default function App() {
  // Lấy cấu hình đã lưu trước đó từ localStorage
  const initialPrefs = getPreferences()

  const [gameType, setGameTypeState] = useState<GameType>(initialPrefs.gameType || 'mega645')
  const [timeframe, setTimeframe] = useState<Timeframe>(initialPrefs.timeframe || 100)
  const [activeTab, setActiveTabState] = useState<TabType>(initialPrefs.activeTab || 'generator')
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
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

  // Hiển thị toast thông báo
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 3000)
  }, [])

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
        balanced: 'Cân Bằng & Đón Sóng',
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
    showToast(`Đã đối chiếu! Có ${matchedCount} vé có số trùng khớp.`)
  }, [draws, autoMatchWithLatest, showToast])

  const latestDraw = draws[0] || null
  const isMega = gameType === 'mega645'

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce transition-all">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-900/95 border border-emerald-500/40 text-emerald-300 rounded-xl shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Sticky */}
      <Header
        gameType={gameType}
        timeframe={timeframe}
        totalDraws={draws.length}
        onGameTypeChange={handleGameTypeChange}
        onTimeframeChange={handleTimeframeChange}
        onOpenDataManager={() => setIsDataManagerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Kỳ Quay Mới Nhất */}
        {latestDraw && (
          <section className="relative overflow-hidden rounded-2xl border border-gray-800/80 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-gray-900/90 p-5 sm:p-6 backdrop-blur-md shadow-lg">
            <div
              className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15 ${
                isMega ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                      isMega
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Kỳ quay mới nhất #{latestDraw.draw_id}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {latestDraw.date}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Kết Quả Xổ Số {isMega ? 'Mega 6/45' : 'Power 6/55'}
                </h2>
              </div>

              {/* Dãy bóng kỳ mới nhất */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-1">
                {latestDraw.numbers.map((num, idx) => (
                  <LottoBall
                    key={`${num}-${idx}`}
                    number={num}
                    gameType={gameType}
                    size="lg"
                    isHighlighted={true}
                    animationDelay={idx * 80}
                  />
                ))}

                {/* Bóng Bonus nếu là Power 6/55 */}
                {!isMega && latestDraw.bonus !== undefined && (
                  <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-amber-400 font-semibold mb-0.5">Bonus</span>
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

        {/* Tab Navigation */}
        <TabNav
          activeTab={activeTab}
          gameType={gameType}
          savedCount={tickets.filter((t) => t.gameType === gameType).length}
          onTabChange={handleTabChange}
        />

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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Bảng Thống Kê Xác Suất
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        isMega ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {timeframe === 'all' ? 'Toàn bộ lịch sử' : `${timeframe} kỳ gần nhất`}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Phân tích tần suất xuất hiện, chu kỳ gan cực đại và các cặp số thường về cùng nhau
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <footer className="mt-12 border-t border-gray-800/80 bg-gray-950/80 py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="flex items-center justify-center gap-2 font-medium text-gray-400">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Cú pháp SMS chuẩn Vietlott SMS: Gửi 9969 (Soạn: 645/655 K1 S [Dãy 6 số])
          </p>
          <p>
            Ứng dụng hỗ trợ phân tích xác suất thống kê toán học, không đảm bảo trúng thưởng 100%. Hãy tham gia có trách nhiệm.
          </p>
          <p className="text-gray-600">
            © {new Date().getFullYear()} Vietlott SMS Smart Analyzer & Generator • Hoạt động Client-side Serverless
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
          showToast(`Đã import thành công ${newDraws.length} kỳ quay!`)
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

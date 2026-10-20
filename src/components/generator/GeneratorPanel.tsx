// ============================================================
// COMPONENT: GeneratorPanel - Khu vực tạo số chính
// ============================================================

import React, { useState, useCallback } from 'react'
import { Sparkles, Cpu, AlertCircle } from 'lucide-react'
import type { GeneratedSet, AnalyticsResult, GameType, Strategy, DrawResult } from '../../types'

import { generateThreeSets, regenerateSet } from '../../engine/generator'
import { TicketSet } from './TicketSet'

interface GeneratorPanelProps {
  analytics: AnalyticsResult
  draws: DrawResult[]
  gameType: GameType
  onSaveTicket: (numbers: number[], strategy: Strategy) => void
}

export const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  analytics,
  draws,
  gameType,
  onSaveTicket,
}) => {
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMega = gameType === 'mega645'

  const handleGenerate = useCallback(() => {
    if (draws.length < 10) {
      setError('Cần ít nhất 10 kỳ quay để phân tích. Vui lòng import thêm dữ liệu.')
      return
    }
    setIsGenerating(true)
    setError(null)

    // Dùng setTimeout để không block UI
    setTimeout(() => {
      try {
        const sets = generateThreeSets(analytics, draws, gameType)
        setGeneratedSets(sets)
      } catch (e) {
        setError(`Lỗi tạo số: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setIsGenerating(false)
      }
    }, 50)
  }, [analytics, draws, gameType])

  const handleRegenerate = useCallback((index: number, strategy: Strategy) => {
    setRegeneratingIndex(index)
    setTimeout(() => {
      try {
        const newSet = regenerateSet(strategy, analytics, draws, gameType)
        setGeneratedSets(prev => {
          const updated = [...prev]
          updated[index] = newSet
          return updated
        })
      } catch (e) {
        console.error('Lỗi tái tạo số:', e)
      } finally {
        setRegeneratingIndex(null)
      }
    }, 50)
  }, [analytics, draws, gameType])

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="text-center">
        <button
          id="btn-generate-sets"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`
            relative overflow-hidden group
            px-10 py-4 rounded-2xl text-base font-bold
            transition-all duration-300
            disabled:opacity-60 disabled:cursor-not-allowed
            ${isMega
              ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-xl shadow-red-500/40 hover:shadow-red-500/60'
              : 'bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 shadow-xl shadow-yellow-500/40 hover:shadow-yellow-500/60'
            }
            text-white hover:scale-105 active:scale-95
          `}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          <span className="relative flex items-center gap-3">
            {isGenerating ? (
              <>
                <Cpu className="w-5 h-5 animate-pulse" />
                Đang phân tích & tạo số...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tạo Bộ Số Tối Ưu
              </>
            )}
          </span>
        </button>

        <p className="mt-2.5 text-xs text-gray-500">
          Áp dụng 5 bộ lọc xác suất vàng • 3 chiến thuật thông minh
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Generated Sets */}
      {generatedSets.length === 0 && !isGenerating && (
        <div className="text-center py-16 space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${
            isMega ? 'bg-red-500/10' : 'bg-yellow-500/10'
          }`}>
            <Sparkles className={`w-8 h-8 ${isMega ? 'text-red-500/50' : 'text-yellow-500/50'}`} />
          </div>
          <p className="text-gray-500 text-sm">
            Nhấn nút để tạo 3 bộ số tối ưu
          </p>
          <p className="text-gray-600 text-xs max-w-xs mx-auto">
            Hệ thống phân tích {draws.length} kỳ lịch sử và áp dụng thuật toán thống kê
          </p>
        </div>
      )}

      {generatedSets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {generatedSets.map((set, index) => (
            <TicketSet
              key={set.id}
              set={set}
              index={index}
              gameType={gameType}
              isRegenerating={regeneratingIndex === index}
              onRegenerate={() => handleRegenerate(index, set.strategy)}
              onSave={() => onSaveTicket(set.numbers, set.strategy)}
            />
          ))}
        </div>
      )}

      {/* Filter Legend */}
      {generatedSets.length > 0 && (
        <div className="bg-gray-900/40 rounded-xl border border-gray-800/50 p-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            5 Bộ Lọc Xác Suất Vàng Đã Áp Dụng
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              { label: 'Chưa từng xổ', desc: 'Không trùng 6/6 lịch sử' },
              { label: 'Chẵn/Lẻ', desc: 'Tỷ lệ 2:4, 3:3 hoặc 4:2' },
              { label: 'Tài/Xỉu', desc: 'Nhỏ/Lớn cân bằng' },
              { label: 'Tổng chuẩn', desc: isMega ? '105–170' : '130–210' },
              { label: 'Liên tiếp', desc: 'Tối đa 2 số liên tiếp' },
            ].map((filter) => (
              <div key={filter.label} className="flex items-start gap-2">
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  isMega ? 'bg-red-500/20' : 'bg-yellow-500/20'
                }`}>
                  <span className={`text-[9px] font-bold ${isMega ? 'text-red-400' : 'text-yellow-400'}`}>✓</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-300">{filter.label}</div>
                  <div className="text-[10px] text-gray-600">{filter.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratorPanel

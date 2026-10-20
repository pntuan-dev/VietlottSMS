// ============================================================
// COMPONENT: DataManager - Quản lý dữ liệu JSON/CSV
// ============================================================

import React, { useState, useRef } from 'react'
import {
  Database, Upload, Link, Plus, RotateCcw, X,
  CheckCircle, AlertCircle, Loader2, Calendar, Hash
} from 'lucide-react'
import type { DrawResult, GameType, ModalProps } from '../../types'
import { parseFile, fetchFromURL } from '../../utils/parser'
import { formatNumber } from '../../utils/storage'

interface DataManagerProps extends ModalProps {
  gameType: GameType
  totalDraws: number
  latestDraw: DrawResult | null
  onImport: (draws: DrawResult[]) => void
  onAddDraw: (draw: DrawResult) => void
  onReset: () => void
}

interface AddDrawForm {
  draw_id: string
  date: string
  numbers: string[]
  bonus: string
}

export const DataManager: React.FC<DataManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  totalDraws,
  latestDraw,
  onImport,
  onAddDraw,
  onReset,
}) => {
  const [activeSection, setActiveSection] = useState<'import' | 'fetch' | 'add' | 'reset'>('import')
  const [fetchUrl, setFetchUrl] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMega = gameType === 'mega645'

  const [addForm, setAddForm] = useState<AddDrawForm>({
    draw_id: '',
    date: new Date().toISOString().split('T')[0],
    numbers: ['', '', '', '', '', ''],
    bonus: '',
  })
  const [addError, setAddError] = useState<string | null>(null)

  if (!isOpen) return null

  const resetMessages = () => {
    setImportErrors([])
    setImportSuccess(null)
    setAddError(null)
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    resetMessages()

    const result = await parseFile(file, gameType)
    if (result.data.length > 0) {
      onImport(result.data)
      setImportSuccess(`✓ Import thành công ${result.data.length} kỳ quay!`)
    }
    if (result.errors.length > 0) {
      setImportErrors(result.errors.slice(0, 5))
    }
    setIsImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFetch = async () => {
    if (!fetchUrl.trim()) return
    setIsFetching(true)
    resetMessages()

    const result = await fetchFromURL(fetchUrl.trim(), gameType)
    if (result.data.length > 0) {
      onImport(result.data)
      setImportSuccess(`✓ Fetch thành công ${result.data.length} kỳ quay từ URL!`)
    }
    if (result.errors.length > 0) {
      setImportErrors(result.errors.slice(0, 5))
    }
    setIsFetching(false)
  }

  const handleAddDraw = () => {
    setAddError(null)
    const maxNum = gameType === 'mega645' ? 45 : 55

    if (!addForm.draw_id.trim()) {
      setAddError('Vui lòng nhập mã kỳ quay')
      return
    }
    if (!addForm.date) {
      setAddError('Vui lòng chọn ngày quay')
      return
    }

    const numbers = addForm.numbers.map(v => parseInt(v, 10))
    if (numbers.some(isNaN)) {
      setAddError('Vui lòng nhập đủ 6 số')
      return
    }
    if (numbers.some(n => n < 1 || n > maxNum)) {
      setAddError(`Các số phải nằm trong khoảng 1–${maxNum}`)
      return
    }
    if (new Set(numbers).size !== 6) {
      setAddError('Các số phải khác nhau')
      return
    }

    const draw: DrawResult = {
      draw_id: addForm.draw_id.trim(),
      date: addForm.date,
      numbers: [...numbers].sort((a, b) => a - b),
    }

    if (gameType === 'power655' && addForm.bonus.trim()) {
      const bonus = parseInt(addForm.bonus, 10)
      if (!isNaN(bonus) && bonus >= 1 && bonus <= 55) {
        draw.bonus = bonus
      }
    }

    onAddDraw(draw)
    setImportSuccess(`✓ Đã thêm kỳ #${draw.draw_id} vào lịch sử!`)
    setAddForm({
      draw_id: '',
      date: new Date().toISOString().split('T')[0],
      numbers: ['', '', '', '', '', ''],
      bonus: '',
    })
  }

  const updateAddNumber = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2)
    const newNumbers = [...addForm.numbers]
    newNumbers[index] = cleaned
    setAddForm(prev => ({ ...prev, numbers: newNumbers }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-gray-800 bg-gradient-to-r ${
          isMega ? 'from-red-950/50 to-orange-950/30' : 'from-yellow-950/50 to-amber-950/30'
        }`}>
          <div className="flex items-center gap-2">
            <Database className={`w-5 h-5 ${isMega ? 'text-red-400' : 'text-yellow-400'}`} />
            <div>
              <h2 className="text-sm font-bold text-white">Quản Lý Dữ Liệu</h2>
              <p className="text-xs text-gray-500">
                {isMega ? 'Mega 6/45' : 'Power 6/55'} — {totalDraws} kỳ hiện có
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Latest Draw Info */}
        {latestDraw && (
          <div className="px-5 py-2.5 bg-gray-800/40 border-b border-gray-800/60 flex items-center gap-3 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500">Kỳ mới nhất:</span>
            <span className="font-medium text-gray-300">#{latestDraw.draw_id}</span>
            <span className={`font-bold font-mono ${isMega ? 'text-orange-400' : 'text-yellow-400'}`}>
              {latestDraw.numbers.map(n => formatNumber(n)).join(' ')}
            </span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { id: 'import' as const, label: 'Import File', icon: <Upload className="w-3.5 h-3.5" /> },
            { id: 'fetch' as const, label: 'Fetch URL', icon: <Link className="w-3.5 h-3.5" /> },
            { id: 'add' as const, label: 'Thêm nhanh', icon: <Plus className="w-3.5 h-3.5" /> },
            { id: 'reset' as const, label: 'Reset', icon: <RotateCcw className="w-3.5 h-3.5" /> },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id); resetMessages() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium
                border-b-2 transition-all duration-150
                ${activeSection === section.id
                  ? isMega
                    ? 'border-red-500 text-red-400'
                    : 'border-yellow-400 text-yellow-400'
                  : 'border-transparent text-gray-600 hover:text-gray-400'
                }
              `}
            >
              {section.icon}
              <span className="hidden sm:block">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {/* Import File */}
          {activeSection === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Hỗ trợ file <strong className="text-gray-300">.json</strong> hoặc <strong className="text-gray-300">.csv</strong>.
                Dữ liệu mới sẽ được <em>merge</em> với lịch sử hiện có.
              </p>
              <div
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                  transition-all duration-200
                  ${isImporting
                    ? 'border-gray-600 bg-gray-800/30'
                    : 'border-gray-700 hover:border-gray-500 bg-gray-800/20 hover:bg-gray-800/40'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                {isImporting ? (
                  <Loader2 className="w-8 h-8 text-gray-500 mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-gray-400">
                  {isImporting ? 'Đang xử lý...' : 'Nhấn để chọn file'}
                </p>
                <p className="text-xs text-gray-600 mt-1">JSON / CSV — không giới hạn kích thước</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          )}

          {/* Fetch URL */}
          {activeSection === 'fetch' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Nhập URL dẫn đến file JSON lịch sử xổ số (GitHub raw, CORS-friendly).
              </p>
              <div className="flex gap-2">
                <input
                  id="input-fetch-url"
                  type="url"
                  value={fetchUrl}
                  onChange={e => setFetchUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                    text-xs text-white placeholder-gray-600 focus:outline-none
                    focus:border-gray-500 transition-colors"
                />
                <button
                  id="btn-fetch-url"
                  onClick={handleFetch}
                  disabled={isFetching || !fetchUrl.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isMega
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                    }
                  `}
                >
                  {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                </button>
              </div>
              <p className="text-[10px] text-gray-600">
                Tip: Dữ liệu có thể lấy từ{' '}
                <a href="https://github.com/pntuan-dev/VietlottSMS" target="_blank" rel="noopener noreferrer"
                  className={isMega ? 'text-red-400' : 'text-yellow-400'}>
                  GitHub repo của bạn
                </a>
                {' '}sau khi upload lên.
              </p>
            </div>
          )}

          {/* Add Quick */}
          {activeSection === 'add' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Nhập nhanh kết quả kỳ quay vừa xổ (sau 18h45).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mã kỳ <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      id="add-draw-id"
                      type="text"
                      value={addForm.draw_id}
                      onChange={e => setAddForm(prev => ({ ...prev, draw_id: e.target.value }))}
                      placeholder="01486"
                      className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                        text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ngày quay <span className="text-red-400">*</span></label>
                  <input
                    id="add-draw-date"
                    type="date"
                    value={addForm.date}
                    onChange={e => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                      text-xs text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">6 Số trúng <span className="text-red-400">*</span></label>
                <div className="flex gap-1.5">
                  {addForm.numbers.map((val, index) => (
                    <input
                      key={index}
                      id={`add-num-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={val}
                      onChange={e => updateAddNumber(index, e.target.value)}
                      maxLength={2}
                      placeholder={`N${index + 1}`}
                      className={`
                        flex-1 h-9 text-center text-xs font-bold rounded-lg
                        bg-gray-800 border focus:outline-none transition-colors
                        text-white placeholder-gray-700
                        ${val ? 'border-gray-600' : 'border-gray-700'}
                        focus:border-gray-500
                      `}
                    />
                  ))}
                </div>
              </div>

              {gameType === 'power655' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Số Bonus (tùy chọn)</label>
                  <input
                    id="add-bonus"
                    type="text"
                    inputMode="numeric"
                    value={addForm.bonus}
                    onChange={e => setAddForm(prev => ({ ...prev, bonus: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    placeholder="Số bonus Power 6/55"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                      text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                  />
                </div>
              )}

              {addError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {addError}
                </div>
              )}

              <button
                id="btn-add-draw"
                onClick={handleAddDraw}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200
                  ${isMega
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300'
                  }
                `}
              >
                <Plus className="w-4 h-4 inline mr-1.5" />
                Thêm kỳ quay
              </button>
            </div>
          )}

          {/* Reset */}
          {activeSection === 'reset' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-400 mb-1">Cảnh báo</p>
                <p className="text-xs text-gray-500">
                  Thao tác này sẽ xóa <strong className="text-white">tất cả dữ liệu</strong> đã import/thêm
                  và khôi phục về dữ liệu mặc định ({isMega ? '120' : '120'} kỳ seed).
                </p>
              </div>
              {confirmReset ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onReset(); setConfirmReset(false); setImportSuccess('✓ Đã reset về dữ liệu mặc định!') }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                  >
                    Xác nhận Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  id="btn-reset-data"
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border border-red-500/40
                    text-red-400 hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset về mặc định
                </button>
              )}
            </div>
          )}

          {/* Success / Error Messages */}
          {importSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {importSuccess}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importErrors.length} cảnh báo (import một phần)</span>
              </div>
              <ul className="space-y-1">
                {importErrors.slice(0, 3).map((err, i) => (
                  <li key={i} className="text-[10px] text-gray-500">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataManager

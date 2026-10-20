// ============================================================
// PARSER - Xử lý import JSON/CSV từ file hoặc URL
// ============================================================

import type { DrawResult, GameType } from '../types'

/** Parse JSON string thành DrawResult[] */
export function parseJSON(content: string, gameType: GameType): { data: DrawResult[]; errors: string[] } {
  const errors: string[] = []
  try {
    const parsed = JSON.parse(content)
    // Hỗ trợ cả array trực tiếp hoặc object có key 'data' / 'draws' / 'results'
    let rawArray: unknown[] = []
    if (Array.isArray(parsed)) {
      rawArray = parsed
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      if (Array.isArray(obj.data)) rawArray = obj.data as unknown[]
      else if (Array.isArray(obj.draws)) rawArray = obj.draws as unknown[]
      else if (Array.isArray(obj.results)) rawArray = obj.results as unknown[]
      else {
        errors.push('JSON không đúng định dạng. Cần có array DrawResult hoặc object có key "data"/"draws"/"results".')
        return { data: [], errors }
      }
    } else {
      errors.push('JSON không hợp lệ.')
      return { data: [], errors }
    }

    const maxNum = gameType === 'mega645' ? 45 : 55
    const validDraws: DrawResult[] = []

    rawArray.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Dòng ${index + 1}: Không phải object hợp lệ`)
        return
      }
      const raw = item as Record<string, unknown>

      // Validate draw_id
      if (!raw.draw_id || typeof raw.draw_id !== 'string') {
        // Thử parse draw_id từ number
        if (typeof raw.draw_id === 'number') {
          raw.draw_id = raw.draw_id.toString().padStart(5, '0')
        } else {
          errors.push(`Dòng ${index + 1}: Thiếu hoặc sai định dạng draw_id`)
          return
        }
      }

      // Validate date
      if (!raw.date || typeof raw.date !== 'string') {
        errors.push(`Dòng ${index + 1}: Thiếu hoặc sai định dạng date`)
        return
      }

      // Validate numbers
      let numbers: number[] = []
      if (Array.isArray(raw.numbers)) {
        numbers = raw.numbers.map((n: unknown) => Number(n))
      } else {
        // Thử parse từ n1, n2, n3, n4, n5, n6
        const n1 = Number(raw.n1), n2 = Number(raw.n2), n3 = Number(raw.n3)
        const n4 = Number(raw.n4), n5 = Number(raw.n5), n6 = Number(raw.n6)
        if (isNaN(n1) || isNaN(n2) || isNaN(n3) || isNaN(n4) || isNaN(n5) || isNaN(n6)) {
          errors.push(`Dòng ${index + 1}: Không tìm thấy 6 số hợp lệ`)
          return
        }
        numbers = [n1, n2, n3, n4, n5, n6]
      }

      if (numbers.length !== 6) {
        errors.push(`Dòng ${index + 1}: Cần đúng 6 số`)
        return
      }

      for (const n of numbers) {
        if (isNaN(n) || n < 1 || n > maxNum) {
          errors.push(`Dòng ${index + 1}: Số ${n} nằm ngoài phạm vi 1-${maxNum}`)
          return
        }
      }

      const sortedNumbers = [...numbers].sort((a, b) => a - b)
      const draw: DrawResult = {
        draw_id: raw.draw_id as string,
        date: raw.date as string,
        numbers: sortedNumbers,
      }

      if (gameType === 'power655' && raw.bonus !== undefined) {
        draw.bonus = Number(raw.bonus)
      }

      validDraws.push(draw)
    })

    return { data: validDraws, errors }
  } catch (e) {
    return { data: [], errors: [`Lỗi parse JSON: ${e instanceof Error ? e.message : String(e)}`] }
  }
}

/** Parse CSV string thành DrawResult[] */
export function parseCSV(content: string, gameType: GameType): { data: DrawResult[]; errors: string[] } {
  const errors: string[] = []
  const validDraws: DrawResult[] = []
  const maxNum = gameType === 'mega645' ? 45 : 55

  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) {
    errors.push('File CSV trống.')
    return { data: [], errors }
  }

  // Parse header để xác định vị trí columns
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  const drawIdCol = header.indexOf('draw_id')
  const dateCol = header.indexOf('date')
  const numbersCol = header.indexOf('numbers')

  // Hỗ trợ cả dạng n1,n2,n3,n4,n5,n6 riêng biệt
  const n1Col = header.indexOf('n1')
  const n2Col = header.indexOf('n2')
  const n3Col = header.indexOf('n3')
  const n4Col = header.indexOf('n4')
  const n5Col = header.indexOf('n5')
  const n6Col = header.indexOf('n6')
  const bonusCol = header.indexOf('bonus')

  const startRow = 1
  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
    const lineNum = i + 1

    const drawId = drawIdCol >= 0 ? cols[drawIdCol] : cols[0]
    const date = dateCol >= 0 ? cols[dateCol] : cols[1]

    if (!drawId || !date) {
      errors.push(`Dòng ${lineNum}: Thiếu draw_id hoặc date`)
      continue
    }

    let numbers: number[] = []

    if (numbersCol >= 0) {
      // Column "numbers" là chuỗi dấu cách ví dụ: "1 2 3 4 5 6"
      const raw = cols[numbersCol]
      numbers = raw.split(/[\s\-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n))
    } else if (n1Col >= 0) {
      // Columns riêng biệt n1...n6
      numbers = [n1Col, n2Col, n3Col, n4Col, n5Col, n6Col].map(idx =>
        idx >= 0 ? parseInt(cols[idx], 10) : NaN
      ).filter(n => !isNaN(n))
    } else {
      // Fallback: lấy các cột từ vị trí 2 trở đi
      numbers = cols.slice(2, 8).map(n => parseInt(n, 10)).filter(n => !isNaN(n))
    }

    if (numbers.length !== 6) {
      errors.push(`Dòng ${lineNum}: Không đủ 6 số hợp lệ (tìm thấy ${numbers.length})`)
      continue
    }

    let valid = true
    for (const n of numbers) {
      if (isNaN(n) || n < 1 || n > maxNum) {
        errors.push(`Dòng ${lineNum}: Số ${n} nằm ngoài phạm vi 1-${maxNum}`)
        valid = false
        break
      }
    }
    if (!valid) continue

    const draw: DrawResult = {
      draw_id: drawId,
      date,
      numbers: [...numbers].sort((a, b) => a - b),
    }

    if (gameType === 'power655' && bonusCol >= 0) {
      const bonus = parseInt(cols[bonusCol], 10)
      if (!isNaN(bonus)) draw.bonus = bonus
    }

    validDraws.push(draw)
  }

  return { data: validDraws, errors }
}

/** Parse file từ File object */
export async function parseFile(file: File, gameType: GameType): Promise<{ data: DrawResult[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const isCSV = file.name.toLowerCase().endsWith('.csv')
      const result = isCSV ? parseCSV(content, gameType) : parseJSON(content, gameType)
      resolve(result)
    }
    reader.onerror = () => {
      resolve({ data: [], errors: ['Không thể đọc file. Vui lòng thử lại.'] })
    }
    reader.readAsText(file, 'utf-8')
  })
}

/** Fetch JSON từ URL */
export async function fetchFromURL(url: string, gameType: GameType): Promise<{ data: DrawResult[]; errors: string[] }> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { data: [], errors: [`HTTP ${response.status}: ${response.statusText}`] }
    }
    const text = await response.text()
    // Thử detect CSV nếu URL kết thúc bằng .csv
    if (url.toLowerCase().endsWith('.csv')) {
      return parseCSV(text, gameType)
    }
    return parseJSON(text, gameType)
  } catch (e) {
    return { data: [], errors: [`Lỗi kết nối: ${e instanceof Error ? e.message : String(e)}`] }
  }
}

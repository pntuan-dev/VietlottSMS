// ============================================================
// COMPONENT: LottoBall - Quả bóng xổ số 3D
// ============================================================

import React from 'react'
import type { GameType } from '../../types'
import { formatNumber } from '../../utils/storage'

interface LottoBallProps {
  number: number
  gameType: GameType
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isHighlighted?: boolean
  isMatched?: boolean
  animationDelay?: number
  className?: string
}

export const LottoBall: React.FC<LottoBallProps> = ({
  number,
  gameType,
  size = 'md',
  isHighlighted = false,
  isMatched = false,
  animationDelay = 0,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const isMega = gameType === 'mega645'

  // Style bóng dựa trên game type và trạng thái
  const getBallStyle = () => {
    if (isMatched) {
      return {
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
        boxShadow: '0 4px 15px rgba(34, 197, 94, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
      }
    }
    if (isHighlighted) {
      if (isMega) {
        return {
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
          boxShadow: '0 4px 15px rgba(251, 191, 36, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
        }
      }
      return {
        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
      }
    }
    if (isMega) {
      return {
        background: 'linear-gradient(135deg, #f87171 0%, #ef4444 40%, #dc2626 70%, #991b1b 100%)',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
      }
    }
    return {
      background: 'linear-gradient(135deg, #fde047 0%, #eab308 40%, #ca8a04 70%, #854d0e 100%)',
      boxShadow: '0 4px 15px rgba(234, 179, 8, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
    }
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        font-bold text-white select-none
        relative overflow-hidden
        ball-pop transition-transform duration-200
        hover:scale-110 cursor-default
        ${className}
      `}
      style={{
        ...getBallStyle(),
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Hiệu ứng ánh sáng 3D */}
      <div
        className="absolute top-1 left-1.5 w-3 h-2 rounded-full opacity-40"
        style={{ background: 'radial-gradient(ellipse, white, transparent)' }}
      />
      <span className="relative z-10 font-bold tracking-tight drop-shadow-sm">
        {formatNumber(number)}
      </span>
    </div>
  )
}

export default LottoBall

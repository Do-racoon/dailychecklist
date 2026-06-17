'use client'

import { useEffect, useRef } from 'react'
import { DailyRecord } from '@/types'

interface Props {
  records: DailyRecord[]
  days: number
}

export default function CompletionChart({ records, days }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    // 날짜 슬롯 생성
    const slots: { date: string; pct: number | null }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const rec = records.find(r => r.date === key)
      slots.push({ date: key, pct: rec ? rec.totalPct : null })
    }

    const padL = 30, padR = 12, padT = 12, padB = 28
    const chartW = w - padL - padR
    const chartH = h - padT - padB
    const barW = Math.max(4, chartW / slots.length - 4)

    // 격자선
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (const pct of [25, 50, 75, 100]) {
      const y = padT + chartH - (chartH * pct) / 100
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText(`${pct}%`, 0, y + 3)
    }

    // 막대
    slots.forEach((slot, i) => {
      const x = padL + (chartW / slots.length) * i + (chartW / slots.length - barW) / 2
      if (slot.pct === null) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        ctx.fillRect(x, padT, barW, chartH)
        return
      }
      const barH = (chartH * slot.pct) / 100
      const y = padT + chartH - barH
      const color = slot.pct >= 80 ? '#7c6ef7' : slot.pct >= 50 ? '#3ecfae' : '#f5a623'
      ctx.fillStyle = color + '99'
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, 3)
      ctx.fill()
    })

    // x축 날짜 (7일마다 또는 마지막)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    slots.forEach((slot, i) => {
      if (i % Math.ceil(days / 7) === 0 || i === slots.length - 1) {
        const x = padL + (chartW / slots.length) * i + chartW / slots.length / 2
        const label = slot.date.slice(5)
        ctx.fillText(label, x, h - 6)
      }
    })
  }, [records, days])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '160px' }}
    />
  )
}

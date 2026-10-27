import { useEffect, useState } from 'react'

/** Fork-only HUD overlay: clock, status, grid, scanline, corner brackets.
 *  Purely visual, pointer-events are disabled in tech.css. */
export default function TechHud() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('zh-CN', {
          hour12: false,
          timeZone: 'Asia/Shanghai',
        }),
      )
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="tech-hud" aria-hidden="true">
      <div className="tech-grid" />
      <div className="tech-scanline" />
      <div className="tech-hud__top">
        <span>
          <span className="tech-hud__dot" />
          SYSTEM ONLINE
        </span>
        <span>CS MAJOR ARCHIVE // 2013—2026</span>
        <span>{time} CST</span>
      </div>
      <span className="tech-corner tech-corner--tl" />
      <span className="tech-corner tech-corner--tr" />
      <span className="tech-corner tech-corner--bl" />
      <span className="tech-corner tech-corner--br" />
    </div>
  )
}

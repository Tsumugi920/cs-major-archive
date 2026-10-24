import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import crowdTex from '../assets/archive/crowd-tex.jpg'
import { eventName } from '../data'
import type { Major } from '../data'
import { gsap, useGSAP } from '../lib/motion'
import TeamLogo from './TeamLogo'

function ChampCard({ major, onSelect }: { major: Major; onSelect: (id: string, source?: HTMLElement | null) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => onSelect(major.id, e.currentTarget.querySelector<HTMLImageElement>('.champ-card__logo img'))}
      className="champ-card"
      title={major.fullName}
    >
      <span className="champ-card__tex" style={{ ['--card-tex' as string]: `url(${crowdTex})` }} aria-hidden="true" />
      <span className="champ-card__year">{major.year}</span>
      <span className="champ-card__event">{eventName(major.fullName, major.year)}</span>
      <span className="champ-card__logo">
        <TeamLogo team={major.champion.team} size={58} />
      </span>
      <span className="champ-card__team">{major.champion.team}</span>
      <span className="champ-card__score">{major.score.replace('–', ' : ')}</span>
      <span className="champ-card__runner">{major.runnerUp.team}</span>
    </button>
  )
}

export default function ChampionHall({
  majors,
  eraFilter,
  onSelect,
}: {
  majors: Major[]
  eraFilter: 'all' | 'CS:GO' | 'CS2'
  onSelect: (id: string, source?: HTMLElement | null) => void
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const reduce = useReducedMotion()
  // era 切换两段编排：旧卡淡出上移 → 换卡 → 新卡按时间顺序错落进入。
  // shownEra 是「画面上正在展示的年代」，eraFilter 是「用户刚选的年代」，换卡延迟到退场完成。
  const [shownEra, setShownEra] = useState(eraFilter)
  const list = (shownEra === 'all' ? majors : majors.filter((m) => m.era === shownEra)).slice().reverse()

  useEffect(() => {
    if (eraFilter === shownEra) return
    const el = stripRef.current
    if (!el || reduce) {
      setShownEra(eraFilter)
      return
    }
    gsap.to(el.querySelectorAll('.champ-card'), {
      autoAlpha: 0,
      y: -6,
      duration: 0.15,
      stagger: 0.008,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => setShownEra(eraFilter),
    })
  }, [eraFilter, shownEra, reduce])

  // 换卡后：复位滚动位置，新卡自下而上错落进入（首次挂载跳过）
  const prevEraRef = useRef<string | null>(null)
  useGSAP(
    () => {
      const prev = prevEraRef.current
      prevEraRef.current = shownEra
      if (prev === null || prev === shownEra) return
      const el = stripRef.current
      if (!el) return
      el.scrollTo({ left: 0 })
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          el.querySelectorAll('.champ-card'),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.035, ease: 'power3.out', overwrite: 'auto' },
        )
      })
      return () => mm.revert()
    },
    { dependencies: [shownEra], revertOnUpdate: true },
  )

  useEffect(() => {
    updateArrows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownEra])

  const updateArrows = () => {
    const el = stripRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  const step = (dir: 1 | -1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className="champ band" id="hall">
      <div className="sec-head" data-reveal>
        <span className="sec-head__bar" aria-hidden="true" />
        <h2 className="sec-head__title">CHAMPIONS</h2>
        <span className="sec-head__sub">
          / 01 — {String(list.length).padStart(2, '0')}
        </span>
        <a className="sec-head__view" href="#timeline">
          VIEW ALL
          <i className="fa-solid fa-arrow-right-long" aria-hidden="true" />
        </a>
      </div>
      <div className="champ__wrap" data-reveal>
        <button
          className="champ__arrow champ__arrow--l"
          onClick={() => step(-1)}
          disabled={!canLeft}
          aria-label="向左滚动冠军卡"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <div className="champ__strip" ref={stripRef} onScroll={updateArrows}>
          {list.map((m) => (
            <ChampCard key={m.id} major={m} onSelect={onSelect} />
          ))}
        </div>
        <button
          className="champ__arrow champ__arrow--r"
          onClick={() => step(1)}
          disabled={!canRight}
          aria-label="向右滚动冠军卡"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

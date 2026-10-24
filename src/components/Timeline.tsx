import { useEffect, useRef, useState } from 'react'
import stageCard from '../assets/archive/stage-card.jpg'
import { eventName, finalMapsOf, formatPurse, videosOf } from '../data'
import type { Major } from '../data'
import { gsap, useGSAP, ScrollTrigger } from '../lib/motion'
import TeamLogo from './TeamLogo'

export default function Timeline({
  majors: allMajors,
  onSelect,
}: {
  majors: Major[]
  onSelect: (id: string) => void
}) {
  const [selectedId, setSelectedId] = useState(allMajors[allMajors.length - 1].id)
  const railRef = useRef<HTMLUListElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const selected = allMajors.find((m) => m.id === selectedId) ?? allMajors[allMajors.length - 1]
  const rail = [...allMajors].reverse()
  const videos = videosOf(selected)
  const thumb = videos[0]
  const maps = finalMapsOf(selected)
  const idx = allMajors.indexOf(selected)

  // 选中项在年份轨内保持可见（只滚轨道自身，绝不能把页面滚走）
  useEffect(() => {
    const el = railRef.current
    const btn = el?.querySelector<HTMLButtonElement>('.chron__year.is-active')
    if (!el || !btn) return
    const target = btn.offsetLeft - (el.clientWidth - btn.offsetWidth) / 2
    if (el.scrollWidth > el.clientWidth) el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
    const top = btn.offsetTop - (el.clientHeight - btn.offsetHeight) / 2
    if (el.scrollHeight > el.clientHeight) el.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [selectedId])

  // 金脊线随页面滚动逐步点亮，途经年份依次 is-lit（选中态 is-active 仍由点选驱动）
  useGSAP(
    () => {
      const section = sectionRef.current
      const rail = railRef.current
      if (!section || !rail) return
      const years = Array.from(rail.querySelectorAll<HTMLElement>('.chron__year'))
      const apply = (p: number) => {
        const clamped = Math.max(0, Math.min(1, p))
        rail.style.setProperty('--chron-fill', String(clamped))
        const lit = Math.round(clamped * years.length)
        years.forEach((y, i) => y.classList.toggle('is-lit', i < lit))
      }
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        let lastLit = -1
        const applyLit = (p: number) => {
          const lit = Math.round(Math.max(0, Math.min(1, p)) * years.length)
          if (lit === lastLit) return
          lastLit = lit
          years.forEach((y, i) => y.classList.toggle('is-lit', i < lit))
        }
        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top 80%',
          end: 'bottom 55%',
          onUpdate: (self) => {
            rail.style.setProperty('--chron-fill', String(self.progress))
            applyLit(self.progress)
          },
        })
        rail.style.setProperty('--chron-fill', String(st.progress))
        applyLit(st.progress)
        return () => {
          st.kill()
          rail.style.removeProperty('--chron-fill')
          years.forEach((y) => y.classList.remove('is-lit'))
        }
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        apply(1)
        return () => {
          rail.style.removeProperty('--chron-fill')
          years.forEach((y) => y.classList.remove('is-lit'))
        }
      })
      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  // 比分数字翻牌：.chron__body 按 selectedId 重挂载，换届后新数字绕 X 轴翻入
  useGSAP(
    () => {
      const digits = bodyRef.current?.querySelectorAll('.chron__score-digit')
      if (!digits || digits.length === 0) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          digits,
          { rotateX: -78, autoAlpha: 0, transformPerspective: 360 },
          { rotateX: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.1, delay: 0.12, overwrite: 'auto' },
        )
      })
      return () => mm.revert()
    },
    { dependencies: [selectedId], revertOnUpdate: true },
  )

  const viewAll = () => {
    document.getElementById('hall')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="chron band" id="timeline" ref={sectionRef}>
      <div className="chron__grid">
        <div
          className="panel chron__main"
          data-reveal
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a,button,input')) return
            onSelect(selectedId)
          }}
        >
          <div className="chron__head sec-head">
            <span className="sec-head__bar" aria-hidden="true" />
            <h2 className="sec-head__title">THE CHRONICLE</h2>
            <span className="sec-head__sub">A TIMELINE OF GLORY</span>
            <button className="sec-head__view" onClick={viewAll}>
              VIEW ALL
              <i className="fa-solid fa-arrow-right-long" aria-hidden="true" />
            </button>
          </div>
          <div className="chron__body" key={selectedId} ref={bodyRef}>
            <ul className="chron__rail" ref={railRef} aria-label="按年份选择赛事">
              {rail.map((m) => (
                <li key={m.id}>
                  <button
                    className={`chron__year era-${m.era === 'CS2' ? 'cs2' : 'csgo'} ${m.id === selectedId ? 'is-active' : ''}`}
                    onClick={() => setSelectedId(m.id)}
                  >
                    {m.year}
                  </button>
                </li>
              ))}
            </ul>

            <a
              className="chron__photo"
              href={thumb ? `https://www.youtube.com/watch?v=${thumb.id}` : undefined}
              target="_blank"
              rel="noreferrer"
              style={{ ['--stage-photo' as string]: `url(${thumb ? `https://i.ytimg.com/vi/${thumb.id}/hqdefault.jpg` : stageCard})` }}
              title={thumb ? thumb.title : selected.fullName}
              aria-label={thumb ? '观看名场面视频' : selected.fullName}
            >
              <span className="chron__watch">
                <i className="fa-solid fa-play" aria-hidden="true" />
                WATCH VIDEO
              </span>
            </a>

            <div className="chron__info">
              <div className="chron__rowhead">
                <span className="chron__sel-year">{selected.year}</span>
                <h3>{eventName(selected.fullName, selected.year).toUpperCase()}</h3>
                <span className={`chron__badge${selected.era === 'CS2' ? '' : ' chron__badge--csgo'}`}>
                  {selected.era}
                </span>
              </div>
              <dl className="chron__rows">
                <div className="chron__row">
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  <dt>Champion</dt>
                  <dd>
                    <TeamLogo team={selected.champion.team} size={14} />
                    <b>{selected.champion.team}</b>
                  </dd>
                </div>
                <div className="chron__row">
                  <i className="fa-solid fa-medal" aria-hidden="true" />
                  <dt>Runner-up</dt>
                  <dd>
                    <TeamLogo team={selected.runnerUp.team} size={14} />
                    <span>{selected.runnerUp.team}</span>
                  </dd>
                </div>
                <div className="chron__row">
                  <i className="fa-solid fa-display" aria-hidden="true" />
                  <dt>Final</dt>
                  <dd>
                    <span className="chron__score">
                      {selected.score.replace('–', ' : ').split('').map((ch, i) =>
                        /\d/.test(ch) ? (
                          <span className="chron__score-digit" key={i}>
                            {ch}
                          </span>
                        ) : (
                          ch
                        ),
                      )}
                    </span>
                    <small>MVP {selected.mvp}</small>
                  </dd>
                </div>
                <div className="chron__row">
                  <i className="fa-solid fa-coins" aria-hidden="true" />
                  <dt>Prize Pool</dt>
                  <dd>{formatPurse(selected.purse)}</dd>
                </div>
                <div className="chron__row">
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <dt>Venue</dt>
                  <dd>{selected.venue}</dd>
                </div>
              </dl>
            </div>

            <div className="chron__maps">
              {maps.length > 0 ? (
                <>
                  <p className="chron__maps-head">FINAL MAPS</p>
                  {maps.map((mp, i) => (
                    <div className="chron__map" key={mp.map}>
                      <i>{i + 1}</i>
                      <b>{mp.map}</b>
                      <em>
                        {mp.scores[0]} : {mp.scores[1]}
                      </em>
                    </div>
                  ))}
                </>
              ) : null}
            </div>

            {thumb ? (
              <div className="chron__hl">
                <a
                  className="chron__hl-thumb"
                  href={`https://www.youtube.com/watch?v=${thumb.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ['--hl-photo' as string]: `url(https://i.ytimg.com/vi/${thumb.id}/hqdefault.jpg)` }}
                  title={thumb.title}
                >
                  <span className="chron__hl-play" aria-hidden="true">
                    <span>
                      <i className="fa-solid fa-play" />
                    </span>
                  </span>
                </a>
                <p className="chron__hl-name">Match Highlights</p>
                <a
                  className="chron__hl-link"
                  href={`https://www.youtube.com/watch?v=${thumb.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch Video
                  <i className="fa-solid fa-arrow-right-long" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <div className="chron__hl">
                <p className="chron__hl-name">{selected.dates}</p>
                <button className="chron__hl-link" onClick={() => onSelect(selected.id)}>
                  View Archive
                  <i className="fa-solid fa-arrow-right-long" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <p className="chron__legend">
            第 {idx + 1} / {allMajors.length} 届 · 点击年份切换，点击面板空白处打开完整档案
          </p>
        </div>

        <aside className="panel chron-aside" data-reveal>
          <div className="chron-aside__inner">
            <span className="chron-aside__bar" aria-hidden="true" />
            <blockquote className="chron-aside__quote">
              <em>“Counter-Strike</em>
              <br />
              Majors are more than tournaments.
              <br />
              They are the history of a generation.”
            </blockquote>
            <p className="chron-aside__sig">CS MAJOR ARCHIVE</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

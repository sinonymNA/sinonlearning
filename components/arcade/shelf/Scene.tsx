"use client";
/* eslint-disable @next/next/no-img-element */
// The animated shop behind the game and the home screen. One scene per department. Everything here moves with transform or opacity only (cheap), and is hidden in Calm mode.
import { buntingUrl, hangerUrl, lampUrl, lightsUrl, plantUrl, bookcaseUrl, balloonUrl, herbsUrl, SHIRT_PAL } from "./sprites";

export default function Scene({ dept }: { dept: number }) {
  return (
    <div className={`sc d${dept}`} key={dept} aria-hidden>
      <div className="sc-wall" />
      {dept === 0 && (<>
        <div className="sc-rays" />
        <div className="sc-bunting" style={{ backgroundImage: `url(${buntingUrl()})` }} />
        <div className="sc-hangers">{[1, 4, 8].map((c, i) => <img key={i} src={hangerUrl(SHIRT_PAL[c])} alt="" draggable={false} style={{ animationDelay: `${-i * 1.1}s` }} />)}</div>
      </>)}
      {dept === 1 && (<>
        <div className="sc-case l" style={{ backgroundImage: `url(${bookcaseUrl()})` }} /><div className="sc-case r" style={{ backgroundImage: `url(${bookcaseUrl()})` }} />
        <div className="sc-lamp"><i className="cone" /><img src={lampUrl()} alt="" draggable={false} /></div>
      </>)}
      {dept === 2 && (<>
        <div className="sc-spot l" /><div className="sc-spot r" />
        <div className="sc-lights a" style={{ backgroundImage: `url(${lightsUrl(0)})` }} /><div className="sc-lights b" style={{ backgroundImage: `url(${lightsUrl(1)})` }} />
        <img className="sc-plant l" src={plantUrl()} alt="" draggable={false} /><img className="sc-plant r" src={plantUrl()} alt="" draggable={false} />
      </>)}
      {dept === 3 && (<>
        <div className="sc-stars" />
        <div className="sc-balloons">{[0, 3, 6, 1, 8].map((c, i) => <img key={i} src={balloonUrl(SHIRT_PAL[c])} alt="" draggable={false} style={{ left: `${6 + i * 21}%`, animationDelay: `${-i * 1.3}s`, animationDuration: `${5 + (i % 3)}s` }} />)}</div>
      </>)}
      {dept === 4 && (<>
        <div className="sc-tiles" /><div className="sc-rays pantry" />
        <div className="sc-herbs">{[12, 50, 84].map((l, i) => <img key={i} src={herbsUrl()} alt="" draggable={false} style={{ left: `${l}%`, animationDelay: `${-i * 1.4}s` }} />)}</div>
      </>)}
      <div className="sc-motes">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 8) % 96}%`, animationDelay: `${-(i * 1.7) % 12}s`, animationDuration: `${11 + (i % 4) * 3}s`, width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2 }} />)}</div>
      <div className="sc-vig" />
    </div>
  );
}

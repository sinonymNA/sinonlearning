"use client";
/* eslint-disable @next/next/no-img-element */
// The light strings along the top of your shop (closet "lights"). Twinkling is opacity only; Calm mode freezes it.
import { buntingUrl, lightsUrl, lampUrl } from "./sprites";
import { lanternsUrl, fairyUrl, discoUrl } from "./closetArt";

export default function Lights({ id }: { id: string }) {
  if (id === "bunting") return <div className="lt" style={{ backgroundImage: `url(${buntingUrl()})` }} aria-hidden />;
  if (id === "party") return <><div className="lt a" style={{ backgroundImage: `url(${lightsUrl(0)})`, backgroundSize: "120px 44px" }} aria-hidden /><div className="lt b" style={{ backgroundImage: `url(${lightsUrl(1)})`, backgroundSize: "120px 44px" }} aria-hidden /></>;
  if (id === "fairy") return <div className="lt fairy" style={{ backgroundImage: `url(${fairyUrl()})`, backgroundSize: "120px 44px" }} aria-hidden />;
  if (id === "lanterns") return <div className="lt" style={{ backgroundImage: `url(${lanternsUrl()})` }} aria-hidden />;
  if (id === "pendant") return <>{[14, 50, 86].map((l, i) => <img key={i} className="lt-pend" src={lampUrl()} alt="" draggable={false} style={{ left: `${l}%`, width: 44, animationDelay: `${-i * 1.3}s`, marginLeft: -22 }} />)}</>;
  if (id === "disco") return <img className="lt-disco" src={discoUrl()} alt="" draggable={false} aria-hidden />;
  if (id === "stars") return <div className="lt a" style={{ backgroundImage: `url(${fairyUrl()})`, backgroundSize: "70px 26px", filter: "hue-rotate(160deg) saturate(1.5)" }} aria-hidden />;
  return null;
}

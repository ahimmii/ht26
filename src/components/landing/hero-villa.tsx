import Image from "next/image";

export function HeroVilla() {
  return (
    <div className="hero-villa" aria-hidden>
      <div className="hero-villa-frame">
        <Image
          src="/images/halloween-villa.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-villa-image"
        />
      </div>
      <div className="hero-villa-glow" />
      <div className="hero-villa-lights" />
      <div className="hero-villa-scrim" />
      <div className="hero-villa-grain" />
    </div>
  );
}

export function HeroVilla() {
  return (
    <div className="hero-villa" aria-hidden>
      <div className="hero-villa-frame">
        <img
          src="/images/halloween-villa.jpg"
          alt=""
          fetchPriority="high"
          decoding="async"
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

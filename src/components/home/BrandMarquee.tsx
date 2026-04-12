'use client';

const brands = [
  'NIKE',
  'JORDAN',
  'ADIDAS',
  'NEW BALANCE',
  'SUPREME',
  'STUSSY',
  'CARHARTT',
  'SONY',
  'APPLE',
  'SAMSUNG',
  'DYSON',
  'LE CREUSET',
  'RAY-BAN',
  'CASIO',
  'LEGO',
  'FEAR OF GOD',
  'META',
  'HERSCHEL',
  'THE NORTH FACE',
  'FUNKO',
];

export default function BrandMarquee() {
  return (
    <div className="relative bg-primary overflow-hidden py-3">
      <div className="animate-marquee flex whitespace-nowrap">
        {[...brands, ...brands].map((brand, i) => (
          <span
            key={`${brand}-${i}`}
            className="mx-8 text-sm font-black tracking-[0.2em] text-dark/80"
          >
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
}

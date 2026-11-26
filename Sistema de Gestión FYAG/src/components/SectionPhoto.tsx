
const puntos = [
  [8, 21], [16, 67], [24, 39], [31, 84], [39, 15], [46, 63],
  [55, 31], [60, 77], [67, 18], [73, 49], [81, 70], [86, 30],
  [91, 56], [95, 14], [96, 87],
];

export function ManagementBackdrop({ portada = false }: { portada?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${portada ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_32%,currentColor,transparent_66%)] opacity-15" />
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_right,black,transparent_82%)]" />
      {puntos.map(([x, y], index) => (
        <span
          key={x}
          className="absolute grid size-2 place-items-center"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span className="absolute size-full rounded-full bg-current opacity-60" />
          <span
            className="absolute size-full rounded-full bg-current opacity-40 motion-safe:animate-ping"
            style={{ animationDuration: `${5 + index % 4}s`, animationDelay: `-${index * 0.7}s` }}
          />
        </span>
      ))}
    </div>
  );
}

const foto = "https://images.pexels.com/photos/28726413/pexels-photo-28726413.jpeg?auto=compress&cs=tinysrgb";

export default function SectionPhoto() {
  return (
    <div className="fyag-photo-frame fyag-photo-login" aria-hidden="true">
      <img
        className="fyag-photo"
        alt=""
        referrerPolicy="no-referrer"
        decoding="async"
        style={{ objectPosition: "48% 49%" }}
        src={`${foto}&w=800`}
        srcSet={`${foto}&w=480 480w, ${foto}&w=800 800w, ${foto}&w=1280 1280w`}
        sizes="(min-width: 1024px) 440px, (min-width: 768px) 44vw, 100vw"
        onError={event => { event.currentTarget.hidden = true; }}
      />
    </div>
  );
}


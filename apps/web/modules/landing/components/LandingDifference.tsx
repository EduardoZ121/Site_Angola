import { Reveal } from './Reveal';
import { IconPatrimony, IconTransparency, IconTrust } from './LandingIcons';
import { landingContent } from '../content';

const c = landingContent;

const icons = {
  trust: IconTrust,
  patrimony: IconPatrimony,
  transparency: IconTransparency,
} as const;

export function LandingDifference() {
  return (
    <section
      id={c.difference.id}
      aria-labelledby="landing-difference-title"
      className="scroll-mt-20 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="landing-difference-title"
              className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
            >
              {c.difference.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              {c.difference.intro}
            </p>
          </div>
        </Reveal>

        <ul className="mt-14 grid gap-10 sm:mt-16 sm:grid-cols-3 sm:gap-8">
          {c.difference.pillars.map((pillar, index) => {
            const Icon = icons[pillar.id];
            return (
              <li key={pillar.id}>
                <Reveal delayMs={index * 40}>
                  <article className="space-y-4 text-center sm:text-left">
                    <div className="mx-auto inline-flex size-11 items-center justify-center text-slate-700 sm:mx-0">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      {pillar.text}
                    </p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

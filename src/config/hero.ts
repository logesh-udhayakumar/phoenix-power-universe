import type { HeroImage } from '@/components/public/hero-slideshow'

/**
 * Homepage hero backdrop.
 *
 * Five images, weighted to the trades the company actually sells: two
 * interior/profile lighting, two electrical, one plumbing. The order here is
 * only a starting point — the slideshow picks a random image to open on, so
 * a returning visitor does not always meet the same photo.
 *
 * Deliberately stock photography rather than the company's own project
 * photos: the hero sits behind the headline at low opacity, so it needs
 * evenly-lit, wide, generic trade imagery. Real project photos earn their
 * place immediately below, in Featured Projects, where a client can look at
 * them properly.
 *
 * Self-hosted in /public/hero rather than hotlinked, so the homepage does not
 * depend on a third-party CDN staying up and the files are served from the
 * same origin as the rest of the site.
 *
 * Source: Pexels (https://www.pexels.com/license/) — free for commercial use,
 * no attribution required, modification permitted. Replace any of these with
 * your own photography whenever you have a shot you prefer: drop the file in
 * /public/hero and change the path below. Nothing else needs to change.
 */
export const HERO_IMAGES: HeroImage[] = [
  {
    // pexels.com/photo/hanging-glass-ball-light-fixtures-7518747/
    url: '/hero/interior-globe-pendants.jpg',
    alt: 'Row of glass globe pendant lights in a finished interior',
  },
  {
    // pexels.com/photo/electrician-fixing-an-opened-switchboard-257736/
    url: '/hero/electrical-switchboard.jpg',
    alt: 'Consumer unit with circuit breakers and wiring being worked on',
  },
  {
    // pexels.com/photo/stylish-pendant-lights-in-modern-cafe-3933168/
    url: '/hero/interior-cafe-pendant-lighting.jpg',
    alt: 'Pendant lighting installed in a modern cafe interior',
  },
  {
    // pexels.com/photo/plumber-installs-pipe-fittings-6419128/
    url: '/hero/plumbing-pipe-fittings.jpg',
    alt: 'Plumber fitting copper pipework',
  },
  {
    // pexels.com/photo/technician-working-on-electrical-control-panel-33694019/
    url: '/hero/electrical-control-panel.jpg',
    alt: 'Technician wiring an industrial electrical control panel',
  },
]

/** Fisher-Yates. Called per request from the homepage (which renders
 *  dynamically), so visitors do not all meet the same opening photo. */
export function shuffledHeroImages(): HeroImage[] {
  const images = [...HERO_IMAGES]
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[images[i], images[j]] = [images[j], images[i]]
  }
  return images
}

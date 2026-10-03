// Site settings.

// Themes: sets of colors. Each one is a file in src/styles/themes/ that sets
// the --c-* color roles for both color schemes, light and dark (see
// default.css for the list), and is imported from src/styles/global.css.
// To add one: copy default.css, change the values and the [data-theme] name,
// import it, and add the name here.
export const themes = ['default', 'mini', 'tokyo-night'] as const;
export type Theme = (typeof themes)[number];

// Designs of the Open Graph image (the picture of a post's card on X, Slack,
// ...). Each one is a file in src/og/designs/, listed in src/og/render.ts.
// To add one: copy a design, change it, and add the name here and there.
// /dev/og/ (in dev) shows every design side by side.
export const ogDesigns = ['default', 'pixel', 'sixtyfour'] as const;
export type OgDesignName = (typeof ogDesigns)[number];

export const config: { theme: Theme; ogDesign: OgDesignName } = {
  // The theme the site uses. In dev and previews, ?theme=<name> in the URL
  // overrides it for a quick comparison, for the rest of the tab's visit
  // (?theme=auto goes back; src/layouts/Base.astro).
  theme: 'default',
  // The OG image design. Changing it redraws every post's image on the next
  // build; cards already shared keep the old one until the service refetches.
  ogDesign: 'sixtyfour',
};

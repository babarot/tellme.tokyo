// Site settings.

// Themes: sets of colors. Each one is a file in src/styles/themes/ that sets
// the --c-* color roles for both color schemes, light and dark (see
// default.css for the list), and is imported from src/styles/global.css.
// To add one: copy default.css, change the values and the [data-theme] name,
// import it, and add the name here.
export const themes = ['default', 'mini', 'tokyo-night'] as const;
export type Theme = (typeof themes)[number];

export const config: { theme: Theme } = {
  // The theme the site uses. In dev and previews, ?theme=<name> in the URL
  // overrides it for a quick comparison.
  theme: 'default',
};

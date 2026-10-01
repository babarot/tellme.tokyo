// What the lightbox does, without the DOM: which photo of the group is shown,
// and when it may be swapped in. client.ts connects it to the page.
//
// A photo is shown only once `load` says it can be drawn, so the view never
// flashes the previous photo. A photo whose load finishes after another one was
// chosen is dropped, so moving quickly ends on the last photo chosen.

export type Photo = { src: string; alt: string };

export type ViewerOptions = {
  /** resolves when the photo can be drawn */
  load(src: string): Promise<void>;
  /** the photo to draw, or null to show nothing */
  render(photo: Photo | null): void;
  /** position in the group, e.g. "2 / 3"; empty for a group of one */
  renderCounter(text: string, single: boolean): void;
};

export function createViewer({ load, render, renderCounter }: ViewerOptions) {
  let photos: Photo[] = [];
  let index = 0;
  let latest = 0;

  const show = async (i: number) => {
    index = ((i % photos.length) + photos.length) % photos.length;
    const single = photos.length < 2;
    renderCounter(single ? '' : `${index + 1} / ${photos.length}`, single);
    const request = ++latest;
    const photo = photos[index];
    await load(photo.src);
    if (request === latest) render(photo);
  };

  return {
    get index() {
      return index;
    },
    /** start on photo i of a group; whatever was shown before is cleared first */
    open(group: Photo[], i: number) {
      photos = group;
      render(null);
      return show(i);
    },
    next: () => show(index + 1),
    prev: () => show(index - 1),
  };
}

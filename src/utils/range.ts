export const range = (countOrStart: number, end?: number, step: number = 1) =>
  [...new Array(end !== undefined ? Math.floor((end - countOrStart) / step) : countOrStart)]
    .map((_, i) => i * step);

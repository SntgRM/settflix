export const hasValidPoster = (poster) =>
  Boolean(poster) && poster !== 'N/A' && poster.trim() !== '';

export const getYear = (anio) => (anio && anio !== 'N/A' ? anio : null);
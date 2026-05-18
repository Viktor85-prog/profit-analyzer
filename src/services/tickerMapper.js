export function mapTickerToMoex(ticker) {
  if (!ticker) {
    return null;
  }

  // -----------------------------------
  // убираем /02
  // DOMRF/02 -> DOMRF
  // -----------------------------------

  let normalized = ticker.replace(/\/\d+$/, "");

  // -----------------------------------
  // убираем _02
  // NVTK_02 -> NVTK
  // MICEX_09 -> MICEX
  // -----------------------------------

  normalized = normalized.replace(/_\d+$/, "");

  return normalized;
}

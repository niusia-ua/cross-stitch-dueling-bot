export const STITCHES_RATE_OPTIONS = Object.freeze([
  { label: "50-499", value: StitchesRate.Low },
  { label: "500-999", value: StitchesRate.Medium },
  { label: "≥1000", value: StitchesRate.High },
]);

export function getStitchesRateLabel(rate: StitchesRate) {
  const option = STITCHES_RATE_OPTIONS.find((option) => option.value === rate);
  if (!option) throw new Error(`Invalid stitches rate: ${rate}`);
  return option.label;
}

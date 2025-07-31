import { STITCHES_RATE_OPTIONS } from "~/constants/stitches-rate.js";

export function getStitchesRateLabel(rate: StitchesRate) {
  const option = STITCHES_RATE_OPTIONS.find((option) => option.value === rate);
  if (!option) throw new Error(`Invalid stitches rate: ${rate}`);
  return option.label;
}

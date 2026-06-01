import type { DispositionStatus } from "../types";

export const DISPOSITION_OPTIONS: { value: DispositionStatus; label: string }[] = [
  { value: "at_cragleigh", label: "At Cragleigh" },
  { value: "taken", label: "Taken" },
  { value: "removed", label: "Removed" },
  { value: "with_mullens", label: "With Mullens" },
  { value: "sold", label: "Sold" },
  { value: "auction", label: "At auction" },
  { value: "ebay_clearance", label: "eBay / clearance" },
  { value: "charity", label: "Charity" },
  { value: "unknown", label: "Unknown" },
];

export function dispositionLabel(status: DispositionStatus | null | undefined): string {
  if (!status) return "—";
  return DISPOSITION_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function dispositionColor(status: DispositionStatus | null | undefined): string {
  switch (status) {
    case "at_cragleigh":
      return "#2d4a3e";
    case "taken":
      return "#3d5a80";
    case "removed":
      return "#8b5a2b";
    case "with_mullens":
      return "#4a6741";
    case "sold":
      return "#5c4a32";
    case "auction":
      return "#6b4c7a";
    case "ebay_clearance":
      return "#9a6b3a";
    case "charity":
      return "#4a7c59";
    default:
      return "var(--muted)";
  }
}

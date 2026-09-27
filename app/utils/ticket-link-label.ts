export function ticketLinkLabel(label: string | null | undefined, url: string): string {
  return label?.trim() ? label : new URL(url).hostname
}

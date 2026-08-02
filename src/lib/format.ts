export function severityClass(severity: string) {
  switch (severity) {
    case "Serious":
      return "severity-serious";
    case "Caution":
      return "severity-caution";
    default:
      return "severity-info";
  }
}

export function parseTimes(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

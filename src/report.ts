import type { AuditReport } from './types.js';

export function formatTextReport(report: AuditReport): string {
  const lines: string[] = [];
  lines.push('SitecoreAI Component Map Auditor');
  lines.push('================================');
  lines.push(
    `Map entries: ${report.summary.mapEntries} (client: ${report.summary.clientMapEntries})`
  );
  lines.push(
    `Used renderings: ${report.summary.usedRenderings} (${report.summary.uniqueUsed} unique)`
  );
  lines.push(
    `Findings: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s), ${report.summary.infos} info`
  );
  lines.push(`Status: ${report.ok ? 'PASS' : 'FAIL'}`);
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings.');
    return lines.join('\n');
  }

  for (const finding of report.findings) {
    const where = [
      finding.componentName,
      finding.path,
    ]
      .filter(Boolean)
      .join(' @ ');
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.code}${where ? ` — ${where}` : ''}`);
    lines.push(`  ${finding.message}`);
    if (finding.hint) lines.push(`  Hint: ${finding.hint}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatJsonReport(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

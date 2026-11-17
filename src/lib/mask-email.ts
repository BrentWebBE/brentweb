/**
 * For log lines: enough to match a log entry to a lead in the CRM
 * ("j***@bakkerij.be") without writing full addresses into container logs,
 * which are kept longer and read more widely than the CRM itself.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}

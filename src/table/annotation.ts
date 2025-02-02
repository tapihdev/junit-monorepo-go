import { ReportableFailure } from '../report/type'

export function toAnnotations(failures: ReportableFailure[]): string[] {
  return failures.map(failure => failure.annotation.record.body)
}

import { FailureReport } from '../report/type'

export function toAnnotations(failures: FailureReport[]): string[] {
  return failures.map(failure => failure.annotation.record.body)
}

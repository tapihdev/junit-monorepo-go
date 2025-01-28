import { FailureReport } from '../report/type'

export class AnnotationComposer {
  toArray(failures: FailureReport[]): string[] {
    return failures.map(failure => failure.annotation.record.body)
  }
}

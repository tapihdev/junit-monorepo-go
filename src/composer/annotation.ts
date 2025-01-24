import { FailureReport } from '../report/type'

export interface AnnotationComposer {
  toArray(failures: FailureReport[]): string[]
}

export class AnnotationComposerImpl implements AnnotationComposer {
  toArray(failures: FailureReport[]): string[] {
    return failures.map(failure => failure.annotation.record.body)
  }
}

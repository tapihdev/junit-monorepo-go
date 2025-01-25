import { FailureReport } from '../report/type'

export interface AnnotationComposer {
  toArray(failures: FailureReport[]): string[]
  toArray(path: string, failures: FailureReport[]): string[]
}

export class AnnotationComposerImpl implements AnnotationComposer {
  toArray(failuresOrPath: FailureReport[] | string, failures?: FailureReport[]): string[] {
    if (typeof failuresOrPath === 'string') {
      // パスが指定された場合
      return (failures || []).map(failure => failure.annotation.record.body)
    } else {
      // パスが指定されていない場合
      return failuresOrPath.map(failure => failure.annotation.record.body)
    }
  }
}

export type Index = string

export interface Report<T extends AnyRecord> {
  toIndex(): Index
  toRecord(): T
}

export type AnyReport = GotestsumReport | GolangCILintReport | FailureReport | AnnotationReport
export type GotestsumReport = Report<GotestsumSummaryRecord>
export type GolangCILintReport = Report<GolangCILintSummaryRecord>
export type FailureReport = Report<FailureRecord>
export type AnnotationReport = Report<AnnotationRecord>

export type AnyRecord =
  | GotestsumSummaryRecord
  | GolangCILintSummaryRecord
  | FailureRecord
  | AnnotationRecord

export type GotestsumSummaryRecord = {
  version: string
  result: string
  passed: string
  failed: string
  time: string
}

export type GolangCILintSummaryRecord = {
  result: string
}

export type FailureRecord = {
  type: string
  test: string
  message: string
}

export type AnnotationRecord = {
  body: string
}





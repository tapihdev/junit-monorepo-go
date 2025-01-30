export type Index = string

// Reports
export interface Report<T extends AnyRecord> {
  readonly index: Index
  readonly record: T
}

export interface TransformableToAnnotation {
  readonly annotation: AnnotationReport
}

export type AnyReport =
  | GotestsumSummaryReport
  | GolangCILintSummaryReport
  | FailureReport
  | AnnotationReport

export type SummaryReport = GotestsumSummaryReport | GolangCILintSummaryReport
export type GotestsumSummaryReport = Report<GotestsumSummaryRecord>
export type GolangCILintSummaryReport = Report<GolangCILintSummaryRecord>

export type FailureReport = Report<FailureRecord> & TransformableToAnnotation
export type AnnotationReport = Report<AnnotationRecord>

// Records
export type AnyRecord =
  | GotestsumSummaryRecord
  | GolangCILintSummaryRecord
  | FailureRecord
  | AnnotationRecord

export type GotestsumSummaryRecord = {
  version?: string
  result: string
  passed: string
  failed: string
  time?: string
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

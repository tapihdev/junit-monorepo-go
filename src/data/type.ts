export interface Renderable<T> {
  path: string
  render(owner: string, repo: string, sha: string): T
}

export type SummaryView = GotestsumSummaryView | GolangCILintSummaryView
export type GotestsumSummaryView = Renderable<GotestsumSummaryRecord>
export type GolangCILintSummaryView = Renderable<GolangCILintSummaryRecord>
export type FailureSummaryView = Renderable<FailureRecord>
export type AnnotationView = Renderable<AnnotationRecord>

export type GotestsumSummaryRecord = {
  path: string
  version: string
  result: string
  passed: string
  failed: string
  time: string
}

export type GolangCILintSummaryRecord = {
  path: string
  result: string
}

export type FailureRecord = {
  file: string
  test: string
  message: string
}

export type AnnotationRecord = {
  body: string
}


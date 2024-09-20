import { JunitReport } from './junit'

export interface MarkdownReporter {
  results: Map<string, JunitReport>
}

class _MarkdownReporter {
  private results: Map<string, JunitReport>

  constructor(Map<string, JunitReport> results) {
    this.results = results
  }

  get summaryTable(): string {
    return ''
  }

  get failedTestsTable(): string {
    return ''
  }

  get table(): string {
    return ''
  }
}
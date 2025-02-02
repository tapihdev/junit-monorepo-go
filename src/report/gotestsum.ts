import { Result, GitHubContext } from '../common/type'
import { Index, GotestsumSummaryReport, GotestsumSummaryRecord } from './type'

export class GotestsumSummaryReportImpl implements GotestsumSummaryReport {
  constructor(
    readonly context: GitHubContext,
    readonly moduleDir: string,
    readonly result: Result,
    readonly passed: number,
    readonly failed: number,
    readonly version?: string,
    readonly time?: number
  ) {}

  get index(): Index {
    const { owner, repo, sha } = this.context
    return `[${this.moduleDir}](https://github.com/${owner}/${repo}/blob/${sha}/${this.moduleDir})`
  }

  get record(): GotestsumSummaryRecord {
    return {
      version: this.version,
      result: this.result === Result.Failed ? '❌Failed' : '✅Passed',
      passed: this.passed.toString(),
      failed: this.failed.toString(),
      time: this.time?.toFixed(1).concat('s')
    }
  }
}

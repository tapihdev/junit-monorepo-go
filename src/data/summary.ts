import { Result } from '../type'
import { GotestsumSummary, GolangCILintSummary } from '../junit/type'
import { GotestsumSummaryView, GolangCILintSummaryView } from './type'

export class GotestsumSummaryViewImpl implements GotestsumSummaryView {
  constructor(
    readonly path: string,
    private readonly _summary: GotestsumSummary
  ) {}

  render(owner: string, repo: string, sha: string) {
    return {
      path: `[${this.path}](https://github.com/${owner}/${repo}/blob/${sha}/${this.path})`,
      version: this._summary.version ?? '-',
      result: this._summary.result === Result.Failed ? '❌Failed' : '✅Passed',
      passed: this._summary.passed.toString() ?? '-',
      failed: this._summary.failed.toString() ?? '-',
      time: this._summary.time?.toFixed(1).concat('s') ?? '-'
    }
  }
}

export class GolangCILintSummaryImpl implements GolangCILintSummaryView {
  constructor(
    readonly path: string,
    private readonly _summary: GolangCILintSummary
  ) {}

  render(owner: string, repo: string, sha: string) {
    return {
      path: `[${this.path}](https://github.com/${owner}/${repo}/blob/${sha}/${this.path})`,
      result: this._summary.result === Result.Failed ? '❌Failed' : '✅Passed'
    }
  }
}

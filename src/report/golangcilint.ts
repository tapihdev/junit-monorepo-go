import { Result, GitHubContext } from '../type'
import {
  Index,
  GolangCILintSummaryReport,
  GolangCILintSummaryRecord
} from './type'

export class GolangCILintSummaryReportImpl
  implements GolangCILintSummaryReport
{
  constructor(
    private readonly _context: GitHubContext,
    private readonly _moduleDir: string,
    private readonly _result: Result
  ) {}

  get index(): Index {
    const { owner, repo, sha } = this._context
    return `[${this._moduleDir}](https://github.com/${owner}/${repo}/blob/${sha}/${this._moduleDir})`
  }

  get record(): GolangCILintSummaryRecord {
    return {
      result: this._result === Result.Failed ? '❌Failed' : '✅Passed'
    }
  }
}

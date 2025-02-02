import { Result, GitHubContext } from '../common/type'
import {
  Index,
  ReportableGolangCILintSummary,
  GolangCILintSummaryRecord
} from './type'

export class GolangCILintSummaryReport
  implements ReportableGolangCILintSummary
{
  constructor(
    readonly context: GitHubContext,
    readonly moduleDir: string,
    readonly result: Result
  ) {}

  get index(): Index {
    const { owner, repo, sha } = this.context
    return `[${this.moduleDir}](https://github.com/${owner}/${repo}/blob/${sha}/${this.moduleDir})`
  }

  get record(): GolangCILintSummaryRecord {
    return {
      result: this.result === Result.Failed ? '❌Failed' : '✅Passed'
    }
  }
}

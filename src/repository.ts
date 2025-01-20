import { Module } from './module'
import { Result } from './type'

export type MarkdownContext = {
  owner: string
  repo: string
  sha: string
  pullNumber: number | undefined
  runId: number
  actor: string
}

export class GoRepository {
  constructor(private readonly _modules: Module[]) {}

  modules(): Module[] {
    return this._modules
  }

  numModules(): number {
    return this._modules.length
  }

  // This is for testing purposes and not optimal for production
  hasTestReport(directory: string): boolean {
    return (
      this._modules.find(m => m.directory === directory)?.hasTestReport ?? false
    )
  }

  // This is for testing purposes and not optimal for production
  hasLintReport(directory: string): boolean {
    return (
      this._modules.find(m => m.directory === directory)?.hasLintReport ?? false
    )
  }

  makeMarkdownReport(
    context: MarkdownContext,
    result: Result,
    moduleTable: string,
    failedTestTable: string,
    failedLintTable: string
  ): string {
    const { owner, repo, sha, pullNumber, runId, actor } = context
    const commitUrl =
      pullNumber === undefined
        ? `https://github.com/${owner}/${repo}/commit/${sha}`
        : `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

    return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: ${result === Result.Passed ? '`Passed`🙆‍♀️' : '`Failed`🙅‍♂️'}

${moduleTable === '' ? 'No test results found.' : moduleTable}
${
  failedTestTable === ''
    ? ''
    : `
<br/>

<details open>
<summary> Failed Tests </summary>

${failedTestTable}

</details>
`
}${
      failedLintTable === ''
        ? ''
        : `
<br/>

<details open>
<summary> Failed Lints </summary>

${failedLintTable}

</details>
`
    }
---
*This comment is created for the commit [${sha.slice(0, 7)}](${commitUrl}) pushed by @${actor}.*
`.slice(1, -1)
  }

  makeAnnotationMessages(): string[] {
    return this._modules.map(m => m.makeAnnotationMessages()).flat()
  }
}

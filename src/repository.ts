import { Module } from './module'
import { TestResult } from './junit/type'

export type MarkdownContext = RepositoryContext &
  PullRequestContext &
  CommitContext &
  RunContext
type ModuleTableContext = RepositoryContext & CommitContext
type FailedTestTableContext = RepositoryContext & CommitContext

type RepositoryContext = {
  owner: string
  repo: string
}

type CommitContext = {
  sha: string
}

type PullRequestContext = {
  pullNumber: number
}

type RunContext = {
  runId: number
  actor: string
}

export class Repository {
  constructor(private readonly _modules: Module[]) {}

  static async fromDirectories(
    directories: string[],
    filename: string
  ): Promise<Repository> {
    const modules = await Promise.all(
      directories.map(
        async directory => await Module.fromXml(directory, filename)
      )
    )
    return new Repository(modules)
  }

  makeMarkdownReport(context: MarkdownContext, limitFailures: number): string {
    const { owner, repo, sha, pullNumber, runId, actor } = context
    const commitUrl = `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

    const result = this._modules.every(m => m.result === TestResult.Passed)
      ? '`Passed`🙆‍♀️'
      : '`Failed`🙅‍♂️'

    const moduleTable = this.makeModuleTable({ owner, repo, sha })
    const failedTestTable = this.makeFailedTestTable(
      { owner, repo, sha },
      limitFailures
    )

    return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: ${result}

${moduleTable === '' ? 'No test results found.' : moduleTable}
${
  moduleTable === '' || failedTestTable === ''
    ? ''
    : `
<br/>

<details open>
<summary> Failed Tests </summary>

${failedTestTable}

</details>
`
}
---
*This comment is created for the commit [${sha.slice(0, 7)}](${commitUrl}) pushed by @${actor}.*
`.slice(1, -1)
  }

  private makeModuleTable(context: ModuleTableContext): string {
    if (this._modules.length === 0) {
      return ''
    }

    const { owner, repo, sha } = context
    return `
| Module | Version | Result | Passed | Failed | Skipped | Time |
| :----- | ------: | :----- | -----: | -----: | ------: | ---: |
${this._modules.map(module => module.makeModuleTableRecord(owner, repo, sha)).join('\n')}
`.slice(1, -1)
  }

  private makeFailedTestTable(
    context: FailedTestTableContext,
    limitFailures: number
  ): string {
    const { owner, repo, sha } = context
    const failures = this._modules
      .map(m => m.makeFailedTestTableRecords(owner, repo, sha))
      .flat()
    if (failures.length === 0) {
      return ''
    }

    return `
| File | Test | Message |
| :--- | :--- | :------ |
${failures
  .slice(0, limitFailures)
  .join('\n')
  .concat(failures.length > limitFailures ? `\n| ... | ... | ... |` : '')}
`.slice(1, -1)
  }

  makeAnnotationMessages(): string[] {
    return this._modules.map(m => m.makeAnnotationMessages()).flat()
  }
}

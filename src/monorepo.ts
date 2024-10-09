import glob from 'fast-glob'

import { Reportable, JunitReport, TestResult } from './junit/report'

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

export class Monorepo {
  constructor(private readonly _reporters: Reportable[]) {}

  static async fromFilename(filename: string): Promise<Monorepo> {
    const files = await glob(`**/${filename}`, { dot: true })
    const reporters = await Promise.all(
      files.map(async file => await JunitReport.fromXml(file))
    )
    return new Monorepo(reporters)
  }

  makeMarkdownReport(context: MarkdownContext, limitFailures: number): string {
    const { owner, repo, sha, pullNumber, runId, actor } = context
    const commitUrl = `https://github.com/${owner}/${repo}/pull/${pullNumber}/commits/${sha}`
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`

    const result = this._reporters.every(r => r.result === TestResult.Passed)
      ? 'Passed'
      : 'Failed'
    const resultEmoji = result === 'Passed' ? '🙆‍♀️' : '🙅‍♂️'

    const moduleTable = this.makeModuleTable({ owner, repo, sha })
    const failedTestTable = this.makeFailedTestTable(
      { owner, repo, sha },
      limitFailures
    )

    return `
## 🥽 Go Test Report <sup>[CI](${runUrl})</sup>

#### Result: \`${result}\`${resultEmoji}

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
    if (this._reporters.length === 0) {
      return ''
    }

    const { owner, repo, sha } = context
    return `
| Module | Version | Result | Passed | Failed | Skipped | Time |
| :----- | :------ | :----- | -----: | -----: | ------: | ---: |
${this._reporters
  .map(({ directory, result, passed, failed, skipped, time, version }) => {
    const moduleName = `[${directory}](https://github.com/${owner}/${repo}/blob/${sha}/${directory})`
    const resultEmoji = result === TestResult.Failed ? '❌Failed' : '✅Passed'
    const timeStr = `${time.toFixed(1)}s`
    return `| ${moduleName} | ${version} | ${resultEmoji} | ${passed} | ${failed} | ${skipped} | ${timeStr} |`
  })
  .join('\n')}
`.slice(1, -1)
  }

  private makeFailedTestTable(
    context: FailedTestTableContext,
    limitFailures: number
  ): string {
    const failures = this._reporters.map(reporter => reporter.failures).flat()
    if (failures.length === 0) {
      return ''
    }

    const { owner, repo, sha } = context
    return `
| File | Test | Message |
| :--- | :--- | :------ |
${failures
  .slice(0, limitFailures)
  .map(({ fullPath, line, test, message }) => {
    const fileTitle = `${fullPath}:${line}`
    const fileLink = `https://github.com/${owner}/${repo}/blob/${sha}/${fullPath}#L${line}`
    const fileColumn = `[${fileTitle}](${fileLink})`
    const joinedMessage = message.replace(/\n/g, ' ')
    return `| ${fileColumn} | ${test} | ${joinedMessage} |`
  })
  .join('\n')
  .concat(failures.length > limitFailures ? `\n| ... | ... | ... |` : '')}
`.slice(1, -1)
  }

  makeAnnotationMessages(): string[] {
    return this._reporters
      .map(reporter => reporter.failures)
      .flat()
      .map(({ fullPath, line, message }) => {
        return `::error file=${fullPath},line=${line}::${message}`
      })
  }
}

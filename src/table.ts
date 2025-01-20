import { Module } from './module'
import { Result } from './type'
import { AnyRecord, ModuleTableRecord, FailedCaseTableRecord } from './type'

export type GitHubContext = {
  owner: string
  repo: string
  sha: string
}

export type GitHubActionsContext = {
  owner: string
  repo: string
  sha: string
  pullNumber: number | undefined
  runId: number
  actor: string
}

export function makeMarkdownReport(
    context: GitHubActionsContext,
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

export function makeAnnotationMessages(modules: Module[]): string[] {
  return modules.map(m => m.makeAnnotationMessages()).flat()
}

function renderTable<T extends AnyRecord>(
  header: T,
  separator: T,
  records: T[]
): string {
  if (records.length === 0) {
    return ''
  }

  return [
    `| ${Object.values(header).join(' | ')} |`,
    `| ${Object.values(separator).join(' | ')} |`,
    ...records.map(r => `| ${Object.values(r).join(' | ')} |`)
  ].join('\n')
}

export function createModuleTable(modules: ModuleTableRecord[]): string {
  return renderTable(
    {
      name: 'Module',
      version: 'Version',
      testResult: 'Test',
      testPassed: 'Passed',
      testFailed: 'Failed',
      testElapsed: 'Time',
      lintResult: 'Lint'
    },
    {
      name: ':-----',
      version: '------:',
      testResult: ':---',
      testPassed: '-----:',
      testFailed: '-----:',
      testElapsed: '---:',
      lintResult: ':---'
    },
    modules
  )
}

export function createFailedCaseTable(
  failed: FailedCaseTableRecord[],
  limit: number
): string {
  const failedLimited = failed.slice(0, limit)
  if (failed.length > limit) {
    failedLimited.push({
      file: `:warning: and ${failed.length - limit} more...`,
      test: '-',
      message: '-'
    })
  }
  return renderTable(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    failedLimited
  )
}

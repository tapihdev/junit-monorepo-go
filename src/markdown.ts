import { Result } from './type'

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

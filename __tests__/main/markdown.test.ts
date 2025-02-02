import { Result } from '../../src/common/type'
import { makeMarkdownReport } from '../../src/main/markdown'

describe('Repository#Markdown', () => {
  const testCases = [
    {
      name: 'should make a markdown report for empty CI',
      input: {
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'abcdef123456',
          pullNumber: 123,
          runId: 456,
          actor: 'actor'
        },
        result: Result.Passed,
        moduleTable: '',
        failureTable: ''
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

No test results found.

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for empty CI without pull request number',
      input: {
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'abcdef123456',
          pullNumber: undefined,
          runId: 456,
          actor: 'actor'
        },
        result: Result.Passed,
        moduleTable: '',
        failureTable: ''
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

No test results found.

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/commit/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report with a module table',
      input: {
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'abcdef123456',
          pullNumber: 123,
          runId: 456,
          actor: 'actor'
        },
        result: Result.Passed,
        moduleTable: `MODULE_TABLE`,
        failureTable: ''
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

MODULE_TABLE

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report with failures',
      input: {
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'abcdef123456',
          pullNumber: 123,
          runId: 456,
          actor: 'actor'
        },
        result: Result.Failed,
        moduleTable: `MODULE_TABLE`,
        failureTable: 'FAILED_TABLE'
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

MODULE_TABLE

<br/>

<details open>
<summary> Failures </summary>

FAILED_TABLE

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const markdown = makeMarkdownReport(
      input.context,
      input.result,
      input.moduleTable,
      input.failureTable
    )

    expect(markdown).toEqual(expected)
  })
})

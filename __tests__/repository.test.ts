import { GoRepository } from '../src/repository'
import { Result } from '../src/junit/reporter'

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
        failedTestTable: '',
        failedLintTable: ''
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
        failedTestTable: '',
        failedLintTable: ''
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
        failedTestTable: '',
        failedLintTable: ''
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
      name: 'should make a markdown report with a failed test table',
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
        failedTestTable: 'FAILED_TEST_TABLE',
        failedLintTable: ''
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

MODULE_TABLE

<br/>

<details open>
<summary> Failed Tests </summary>

FAILED_TEST_TABLE

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report with a failed lint table',
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
        failedTestTable: '',
        failedLintTable: 'FAILED_LINT_TABLE'
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

MODULE_TABLE

<br/>

<details open>
<summary> Failed Lints </summary>

FAILED_LINT_TABLE

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed tests and lints',
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
        failedTestTable: 'FAILED_TEST_TABLE',
        failedLintTable: 'FAILED_LINT_TABLE'
      },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

MODULE_TABLE

<br/>

<details open>
<summary> Failed Tests </summary>

FAILED_TEST_TABLE

</details>

<br/>

<details open>
<summary> Failed Lints </summary>

FAILED_LINT_TABLE

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    // TODO: remove this line after refactoring is done.
    const repository = new GoRepository([])
    const markdown = repository.makeMarkdownReport(
      input.context,
      input.result,
      input.moduleTable,
      input.failedTestTable,
      input.failedLintTable
    )

    expect(markdown).toEqual(expected)
  })
})

describe('Repository#Annotations', () => {
  const testCases = [
    {
      name: 'should make annotation messages for an empty run',
      input: [],
      expected: []
    },
    {
      name: 'should make annotation messages',
      input: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: false,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({}),
          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest
            .fn()
            .mockReturnValue([
              '::error file=go/app1/foo_test.go,line=1::failed'
            ])
        }
      ],
      expected: ['::error file=go/app1/foo_test.go,line=1::failed']
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const repository = new GoRepository(input)
    const annotations = repository.makeAnnotationMessages()

    expect(annotations).toEqual(expected)
  })
})

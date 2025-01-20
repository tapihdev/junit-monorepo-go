import { createFailedCaseTable, createModuleTable } from '../src/table'
import { FailedCaseTableRecord, ModuleTableRecord } from '../src/type'
import { Result } from '../src/type'
import { makeMarkdownReport, makeAnnotationMessages } from '../src/table'

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
    const markdown = makeMarkdownReport(
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
    const annotations = makeAnnotationMessages(input)

    expect(annotations).toEqual(expected)
  })
})

describe('createModuleTable', () => {
  const testCases = [
    {
      name: 'should create a table with no module',
      input: {
        modules: [] as ModuleTableRecord[]
      },
      expected: ''
    },
    {
      name: 'should create a table with some modules',
      input: {
        modules: [
          {
            name: 'go/app1',
            version: '1.22.2',
            testResult: '✅Passed',
            testPassed: '1',
            testFailed: '0',
            testElapsed: '0.1s',
            lintResult: '-'
          },
          {
            name: 'go/app2',
            version: '1.22.1',
            testResult: '✅Passed',
            testPassed: '2',
            testFailed: '0',
            testElapsed: '0.2s',
            lintResult: '-'
          }
        ] as ModuleTableRecord[]
      },
      expected: `
| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| go/app1 | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | - |
| go/app2 | 1.22.1 | ✅Passed | 2 | 0 | 0.2s | - |
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const actual = createModuleTable(input.modules)
    expect(actual).toEqual(expected)
  })
})

describe('createFaileCaseTable', () => {
  const testCases = [
    {
      name: 'should create a table with no case',
      input: {
        records: [] as FailedCaseTableRecord[],
        limit: 10
      },
      expected: ''
    },
    {
      name: 'should create a table with some cases within limit',
      input: {
        records: [
          {
            file: 'go/app1/foo_test.go',
            test: 'Test1/Case',
            message: 'aaa'
          },
          {
            file: 'go/app2/bar_test.go',
            test: 'Test2/Case',
            message: 'bbb'
          }
        ] as FailedCaseTableRecord[],
        limit: 10
      },
      expected: `
| File | Case | Message |
| :--- | :--- | :------ |
| go/app1/foo_test.go | Test1/Case | aaa |
| go/app2/bar_test.go | Test2/Case | bbb |
`.slice(1, -1)
    },
    {
      name: 'should create a table with some cases over limit',
      input: {
        records: [
          {
            file: 'go/app1/foo_test.go',
            test: 'Test1/Case',
            message: 'aaa'
          },
          {
            file: 'go/app2/bar_test.go',
            test: 'Test2/Case',
            message: 'bbb'
          }
        ] as FailedCaseTableRecord[],
        limit: 1
      },
      expected: `
| File | Case | Message |
| :--- | :--- | :------ |
| go/app1/foo_test.go | Test1/Case | aaa |
| :warning: and 1 more... | - | - |
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const actual = createFailedCaseTable(input.records, input.limit)
    expect(actual).toEqual(expected)
  })
})

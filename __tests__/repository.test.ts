import { Repository, RepositoryFactory } from '../src/repository'
import { Module, ModuleFactory } from '../src/module'
import { Reporter, Result, Case } from '../src/junit/reporter'
import { hasUncaughtExceptionCaptureCallback } from 'process'

const context = {
  owner: 'owner',
  repo: 'repo',
  sha: 'abcdef123456',
  pullNumber: 123,
  runId: 456,
  actor: 'actor'
}

describe('RepositoryFactory', () => {
  it('should construct a repository from directories', async () => {
    const fromXMLMock = jest.spyOn(ModuleFactory, 'fromXml').mockResolvedValue({
      directory: 'go/app1',
      hasTestReport: true,
      hasLintReport: false,
      result: Result.Passed,

      makeModuleTableRecord: jest.fn().mockReturnValue({
        name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
        version: '1.22.2',
        testResult: '✅Passed',
        testPassed: '1',
        testFailed: '0',
        testElapsed: '0.1s',
        lintResult: '-'
      }),

      makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
      makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
      makeAnnotationMessages: jest.fn().mockReturnValue([])
    } as Module)
    const repository = await RepositoryFactory.fromDirectories(
      ['go/app1'],
      [],
      'test.xml',
      'lint.xml'
    )

    expect(fromXMLMock).toHaveBeenNthCalledWith(
      1,
      'go/app1',
      'test.xml',
      undefined
    )
    expect(repository.numModules).toBe(1)
  })
})

describe('Repository#Markdown', () => {
  // table drien tests
  const testCases = [
    {
      name: 'should make a markdown report for empty CI',
      input: {
        modules: [],
        failedTestLimit: 10,
        failedLintLimit: 10,
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
      name: 'should make a markdown report for a run with tests passed',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: false,
          result: Result.Passed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.2',
            testResult: '✅Passed',
            testPassed: '1',
            testFailed: '0',
            testElapsed: '0.1s',
            lintResult: '-'
          }),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        } as Module,
        {
          directory: 'go/app2',
          hasTestReport: true,
          hasLintReport: false,
          result: Result.Passed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2)',
            version: '1.22.1',
            testResult: '✅Passed',
            testPassed: '2',
            testFailed: '0',
            testElapsed: '0.2s',
            lintResult: '-'
          }),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | - |
| [go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2) | 1.22.1 | ✅Passed | 2 | 0 | 0.2s | - |

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with tests and lint passed',
      input:       {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: true,
          result: Result.Passed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.2',
            testResult: '✅Passed',
            testPassed: '1',
            testFailed: '0',
            testElapsed: '0.1s',
            lintResult: '✅Passed'
          }),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | ✅Passed |

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed tests',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: false,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.1',
            testResult: '❌Failed',
            testPassed: '1',
            testFailed: '1',
            testElapsed: '0.2s',
            lintResult: '-'
          }),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1)',
              test: 'Test1/Case',
              message: 'failed'
            }
          ]),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.1 | ❌Failed | 1 | 1 | 0.2s | - |

<br/>

<details open>
<summary> Failed Tests </summary>

| File | Test | Message |
| :--- | :--- | :------ |
| [go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1) | Test1/Case | failed |

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed tests above the limit',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: false,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.1',
            testResult: '❌Failed',
            testPassed: '1',
            testFailed: '2',
            testElapsed: '0.2s',
            lintResult: '-'
          }),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1)',
              test: 'Test1/Case',
              message: 'failed'
            },
            {
              file: '[go/app1/bar_test.go:2](https://github.com/owner/repo/blob/abcdef123456/go/app1/bar_test.go#L2)',
              test: 'Test2/Case',
              message: 'failed'
            }
          ]),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 1,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.1 | ❌Failed | 1 | 2 | 0.2s | - |

<br/>

<details open>
<summary> Failed Tests </summary>

| File | Test | Message |
| :--- | :--- | :------ |
| [go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1) | Test1/Case | failed |
| :warning: and 1 more... | - | - |

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed lints',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: false,
          hasLintReport: true,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.2',
            testResult: '✅Passed',
            testPassed: '1',
            testFailed: '0',
            testElapsed: '0.1s',
            lintResult: '❌Failed'
          }),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1)',
              test: 'Test1/Case',
              message: 'failed'
            }
          ]),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | ❌Failed |

<br/>

<details open>
<summary> Failed Lints </summary>

| File | Lint | Message |
| :--- | :--- | :------ |
| [go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1) | Test1/Case | failed |

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed lints above the limit',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: true,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.2',
            testResult: '✅Passed',
            testPassed: '1',
            testFailed: '0',
            testElapsed: '0.1s',
            lintResult: '❌Failed'
          }),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1)',
              test: 'Test1/Case',
              message: 'failed'
            },
            {
              file: '[go/app1/bar_test.go:2](https://github.com/owner/repo/blob/abcdef123456/go/app1/bar_test.go#L2)',
              test: 'Test2/Case',
              message: 'failed'
            }
          ]),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([]),
          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 1
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | ❌Failed |

<br/>

<details open>
<summary> Failed Lints </summary>

| File | Lint | Message |
| :--- | :--- | :------ |
| [go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1) | Test1/Case | failed |
| :warning: and 1 more... | - | - |

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
    {
      name: 'should make a markdown report for a run with failed tests and lints',
      input: {
        modules: [
        {
          directory: 'go/app1',
          hasTestReport: true,
          hasLintReport: true,
          result: Result.Failed,

          makeModuleTableRecord: jest.fn().mockReturnValue({
            name: '[go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1)',
            version: '1.22.2',
            testResult: '❌Failed',
            testPassed: '1',
            testFailed: '1',
            testElapsed: '0.2s',
            lintResult: '❌Failed'
          }),

          makeFailedTestTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1)',
              test: 'Test1/Case',
              message: 'failed'
            }
          ]),

          makeFailedLintTableRecords: jest.fn().mockReturnValue([
            {
              file: '[go/app1/bar_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/bar_test.go#L1)',
              test: 'Test2/Case',
              message: 'failed'
            }
          ]),

          makeAnnotationMessages: jest.fn().mockReturnValue([])
        }
      ],
      failedTestLimit: 10,
      failedLintLimit: 10
    },
      expected: `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ❌Failed | 1 | 1 | 0.2s | ❌Failed |

<br/>

<details open>
<summary> Failed Tests </summary>

| File | Test | Message |
| :--- | :--- | :------ |
| [go/app1/foo_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/foo_test.go#L1) | Test1/Case | failed |

</details>

<br/>

<details open>
<summary> Failed Lints </summary>

| File | Lint | Message |
| :--- | :--- | :------ |
| [go/app1/bar_test.go:1](https://github.com/owner/repo/blob/abcdef123456/go/app1/bar_test.go#L1) | Test2/Case | failed |

</details>

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    },
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const repository = new Repository(input.modules)
    const markdown = repository.makeMarkdownReport(context, input.failedTestLimit, input.failedLintLimit)

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
            .mockReturnValue(['::error file=go/app1/foo_test.go,line=1::failed'])
        }
      ],
      expected: [
        '::error file=go/app1/foo_test.go,line=1::failed'
      ]
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const repository = new Repository(input)
    const annotations = repository.makeAnnotationMessages()

    expect(annotations).toEqual(expected)
  })
})

import { Repository, RepositoryFactory } from '../src/repository'
import { Module, ModuleFactory } from '../src/module'
import { Reporter, Result, Case } from '../src/junit/reporter'

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

describe('repository', () => {
  it('should make a markdown report for empty CI', async () => {
    const repository = new Repository([])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

No test results found.

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    )
  })

  it('should make a markdown report for a run with tests passed', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | - |
| [go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2) | 1.22.1 | ✅Passed | 2 | 0 | 0.2s | - |

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    )
  })

  it('should make a markdown report for a run with tests and lint passed', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | ✅Passed |

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    )
  })

  it('should make a markdown report for a run with failed tests', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
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
    )
  })

  it('should make a markdown report for a failed run with failed tests above limit', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 1)
    expect(markdown).toMatch(
      `
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
    )
  })

  it('should make a markdown report for a run with failed lints', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
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
    )
  })

  it('should make a markdown report for a failed run with failed lints above limit', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10, 1)
    expect(markdown).toMatch(
      `
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
    )
  })

  it('should make a markdown report for a run with failed tests and lints', async () => {
    const repository = new Repository([
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
    ])
    const markdown = repository.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
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
    )
  })

  it('should make annotation messages for an empty run', async () => {
    const repository = new Repository([])
    const annotations = repository.makeAnnotationMessages()

    expect(annotations).toEqual([])
  })

  it('should make annotation messages', async () => {
    const repository = new Repository([
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
    ])
    const annotations = repository.makeAnnotationMessages()

    expect(annotations).toEqual([
      '::error file=go/app1/foo_test.go,line=1::failed'
    ])
  })
})

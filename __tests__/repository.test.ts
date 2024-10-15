import { Repository } from '../src/repository'
import { Module } from '../src/module'
import { JUnitReport, TestResult, TestCase } from '../src/junit/type'

const reportableMock1 = new Module('go/app1', {
  result: TestResult.Failed,
  tests: 2,
  passed: 1,
  failed: 1,
  skipped: 0,
  time: 0.2,
  version: '1.22.1',
  failures: [new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed')]
} as JUnitReport)

const reportableMock2 = new Module('go/app2', {
  result: TestResult.Passed,
  tests: 1,
  passed: 1,
  failed: 0,
  skipped: 0,
  time: 0.1,
  version: '1.22.2',
  failures: [] as TestCase[]
} as JUnitReport)

const context = {
  owner: 'owner',
  repo: 'repo',
  sha: 'abcdef123456',
  pullNumber: 123,
  runId: 456,
  actor: 'actor'
}

describe('repository', () => {
  it('makes a markdown report for empty CI', async () => {
    const monorepo = new Repository([])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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

  it('makes a markdown report for failure CI', async () => {
    const monorepo = new Repository([reportableMock1, reportableMock2])
    const markdown = monorepo.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Result | Passed | Failed | Skipped | Time |
| :----- | ------: | :----- | -----: | -----: | ------: | ---: |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.1 | ❌Failed | 1 | 1 | 0 | 0.2s |
| [go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2) | 1.22.2 | ✅Passed | 1 | 0 | 0 | 0.1s |

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

  it('makes a markdown report for successful CI', async () => {
    const monorepo = new Repository([reportableMock2])
    const markdown = monorepo.makeMarkdownReport(context, 10)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Result | Passed | Failed | Skipped | Time |
| :----- | ------: | :----- | -----: | -----: | ------: | ---: |
| [go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2) | 1.22.2 | ✅Passed | 1 | 0 | 0 | 0.1s |

---
*This comment is created for the commit [abcdef1](https://github.com/owner/repo/pull/123/commits/abcdef123456) pushed by @actor.*
`.slice(1, -1)
    )
  })

  it('makes a markdown report with limited number of failed tests', async () => {
    const monorepo = new Repository([
      reportableMock1,
      reportableMock2,
      reportableMock1
    ])
    const markdown = monorepo.makeMarkdownReport(context, 1)
    expect(markdown).toMatch(
      `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/456)</sup>

#### Result: \`Failed\`🙅‍♂️

| Module | Version | Result | Passed | Failed | Skipped | Time |
| :----- | ------: | :----- | -----: | -----: | ------: | ---: |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.1 | ❌Failed | 1 | 1 | 0 | 0.2s |
| [go/app2](https://github.com/owner/repo/blob/abcdef123456/go/app2) | 1.22.2 | ✅Passed | 1 | 0 | 0 | 0.1s |
| [go/app1](https://github.com/owner/repo/blob/abcdef123456/go/app1) | 1.22.1 | ❌Failed | 1 | 1 | 0 | 0.2s |

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

  it('makes annotation messages for empty CI', async () => {
    const monorepo = new Repository([])
    const annotations = monorepo.makeAnnotationMessages()

    expect(annotations).toEqual([])
  })

  it('makes annotation messages', async () => {
    const monorepo = new Repository([reportableMock1, reportableMock2])
    const annotations = monorepo.makeAnnotationMessages()

    expect(annotations).toEqual([
      '::error file=go/app1/foo_test.go,line=1::failed'
    ])
  })
})

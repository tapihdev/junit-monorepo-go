import { Repository } from '../src/repository'
import { Module } from '../src/module'
import { JUnitReport, TestResult, TestCase } from '../src/junit/type'

const context = {
  owner: 'owner',
  repo: 'repo',
  sha: 'abcdef123456',
  pullNumber: 123,
  runId: 456,
  actor: 'actor'
}

describe('repository', () => {
  it('should throw an error if both test and lint paths are not specified', async () => {
    await expect(Repository.fromDirectories(['path/to'])).rejects.toThrow(
      'Either test-report-xml or lint-report-xml must be specified'
    )
  })

  it('should make a markdown report for empty CI', async () => {
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

  it('should make a markdown report for a run with tests passed', async () => {
    const monorepo = new Repository([
      new Module('go/app1', {
        result: TestResult.Passed,
        tests: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        time: 0.1,
        version: '1.22.2',
        failures: [] as TestCase[]
      } as JUnitReport),
      new Module('go/app2', {
        result: TestResult.Passed,
        tests: 2,
        passed: 2,
        failed: 0,
        skipped: 0,
        time: 0.2,
        version: '1.22.1',
        failures: [] as TestCase[]
      } as JUnitReport)
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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
    const monorepo = new Repository([
      new Module(
        'go/app1',
        {
          result: TestResult.Passed,
          tests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          time: 0.1,
          version: '1.22.2',
          failures: [] as TestCase[]
        } as JUnitReport,
        {
          result: TestResult.Passed,
          tests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          failures: []
        } as JUnitReport
      )
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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
    const monorepo = new Repository([
      new Module('go/app1', {
        result: TestResult.Failed,
        tests: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        time: 0.2,
        version: '1.22.1',
        failures: [new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed')]
      } as JUnitReport)
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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
    const monorepo = new Repository([
      new Module('go/app1', {
        result: TestResult.Failed,
        tests: 3,
        passed: 1,
        failed: 2,
        skipped: 0,
        time: 0.2,
        version: '1.22.1',
        failures: [
          new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed'),
          new TestCase('.', 'bar_test.go', 2, 'Test2/Case', 'failed')
        ]
      } as JUnitReport)
    ])
    const markdown = monorepo.makeMarkdownReport(context, 1)
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
    const monorepo = new Repository([
      new Module(
        'go/app1',
        {
          result: TestResult.Passed,
          tests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          time: 0.1,
          version: '1.22.2',
          failures: [] as TestCase[]
        } as JUnitReport,
        {
          result: TestResult.Failed,
          tests: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          failures: [
            new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed')
          ]
        } as JUnitReport
      )
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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
    const monorepo = new Repository([
      new Module(
        'go/app1',
        {
          result: TestResult.Passed,
          tests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          time: 0.1,
          version: '1.22.2',
          failures: [] as TestCase[]
        } as JUnitReport,
        {
          result: TestResult.Failed,
          tests: 2,
          passed: 0,
          failed: 2,
          skipped: 0,
          failures: [
            new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed'),
            new TestCase('.', 'bar_test.go', 1, 'Test2/Case', 'failed')
          ]
        } as JUnitReport
      )
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10, 1)
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

  it('should make annotation messages', async () => {
    const monorepo = new Repository([
      new Module('go/app1', {
        result: TestResult.Failed,
        tests: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        time: 0.1,
        version: '1.22.2',
        failures: [new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed')]
      } as JUnitReport)
    ])
    const annotations = monorepo.makeAnnotationMessages()

    expect(annotations).toEqual([
      '::error file=go/app1/foo_test.go,line=1::failed'
    ])
  })

  it('should make a markdown report for a run with failed tests and lints', async () => {
    const monorepo = new Repository([
      new Module(
        'go/app1',
        {
          result: TestResult.Failed,
          tests: 2,
          passed: 1,
          failed: 1,
          skipped: 0,
          time: 0.2,
          version: '1.22.2',
          failures: [
            new TestCase('.', 'foo_test.go', 1, 'Test1/Case', 'failed')
          ] as TestCase[]
        } as JUnitReport,
        {
          result: TestResult.Failed,
          tests: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          failures: [
            new TestCase('.', 'bar_test.go', 1, 'Test2/Case', 'failed')
          ]
        } as JUnitReport
      )
    ])
    const markdown = monorepo.makeMarkdownReport(context, 10)
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
    const monorepo = new Repository([])
    const annotations = monorepo.makeAnnotationMessages()

    expect(annotations).toEqual([])
  })
})

import { JUnitReport } from '../../src/junit/xml'
import { GolangCILintReport } from '../../src/junit/golangcilint'
import { Result } from '../../src/junit/reporter'

describe('golangcilint', () => {
  const testCases = [
    {
      name: 'should parse the junit report with no failure',
      input: {
        testsuites: {}
      } as JUnitReport,
      expected: {
        result: Result.Passed,
        tests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        time: undefined,
        version: undefined,
        failures: []
      }
    },
    {
      name: 'should parse the junit report with testsuites',
      input: {
        testsuites: {
          testsuite: [
            {
              $: {
                name: 'go/app/foo_test.go',
                tests: '3',
                errors: '0',
                failures: '3'
              },
              testcase: [
                {
                  $: {
                    classname: 'go/app/foo_test.go:12:34',
                    name: 'errcheck'
                  },
                  failure: [
                    {
                      $: {
                        message: 'go/app/foo_test.go:39:21: Error',
                        type: ''
                      },
                      _: ': Error\nCategory: errcheck\nFile: go/app/foo_test.go\nLine: 12\nDetails: Foo'
                    }
                  ]
                }
              ]
            },
            {
              $: {
                name: 'go/app/bar_test.go',
                tests: '2',
                errors: '0',
                failures: '2'
              },
              testcase: [
                {
                  $: {
                    classname: 'go/app/bar_test.go:56:78',
                    name: 'errcheck'
                  },
                  failure: [
                    {
                      $: {
                        message: 'go/app/bar_test.go:56:78: Error',
                        type: ''
                      },
                      _: ': Error\nCategory: errcheck\nFile: go/app/bar_test.go\nLine: 56\nDetails: Bar'
                    }
                  ]
                }
              ]
            }
          ]
        }
      } as JUnitReport,
      expected: {
        result: Result.Failed,
        tests: 5,
        passed: 0,
        failed: 5,
        skipped: 0,
        time: undefined,
        version: undefined,
        failures: [
          {
            subDir: 'go/app',
            file: 'foo_test.go',
            line: 12,
            test: 'errcheck',
            message: 'Error'
          },
          {
            subDir: 'go/app',
            file: 'bar_test.go',
            line: 56,
            test: 'errcheck',
            message: 'Error'
          }
        ]
      }
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const report = new GolangCILintReport('path', input)
    expect(report.result).toBe(expected.result)
    expect(report.tests).toBe(expected.tests)
    expect(report.passed).toBe(expected.passed)
    expect(report.failed).toBe(expected.failed)
    expect(report.skipped).toBe(expected.skipped)
    expect(report.time).toBe(expected.time)
    expect(report.version).toBe(expected.version)
    expect(report.failures).toEqual(expected.failures)
  })
})

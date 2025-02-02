import { JUnitReport } from '../../src/reporter/type'
import { GolangCILintReporterImpl } from '../../src/reporter/golangcilint'
import { ReporterType, Result } from '../../src/common/type'

describe('golangcilint', () => {
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should parse the junit report with no failure',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {}
        } as JUnitReport
      },
      expected: {
        path: 'path/to',
        summary: {
          context: {
            owner: 'owner',
            repo: 'repo',
            sha: 'sha'
          },
          moduleDir: 'path/to',
          result: Result.Passed
        },
        failures: []
      }
    },
    {
      name: 'should parse the junit report with testsuites',
      input: {
        context,
        path: 'path/to',
        report: {
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
        } as JUnitReport
      },
      expected: {
        path: 'path/to',
        summary: {
          context: {
            owner: 'owner',
            repo: 'repo',
            sha: 'sha'
          },
          moduleDir: 'path/to',
          result: Result.Failed
        },
        failures: [
          {
            context: {
              owner: 'owner',
              repo: 'repo',
              sha: 'sha'
            },
            moduleDir: 'path/to',
            subDir: 'go/app',
            file: 'foo_test.go',
            line: 12,
            test: 'errcheck',
            message: 'Error',
            type: ReporterType.GolangCILint
          },
          {
            context: {
              owner: 'owner',
              repo: 'repo',
              sha: 'sha'
            },
            moduleDir: 'path/to',
            subDir: 'go/app',
            file: 'bar_test.go',
            line: 56,
            test: 'errcheck',
            message: 'Error',
            type: ReporterType.GolangCILint
          }
        ]
      }
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const report = new GolangCILintReporterImpl(
      input.context,
      input.path,
      input.report
    )
    expect(report.path).toBe(expected.path)
    expect(report.summary).toEqual(expected.summary)
    expect(report.failures).toEqual(expected.failures)
  })
})

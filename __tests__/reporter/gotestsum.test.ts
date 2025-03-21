import { JUnitReport } from '../../src/parse/type'
import { GotestsumParser } from '../../src/parse/gotestsum'
import { ReporterType, Result } from '../../src/common/type'

describe('gotestsum', () => {
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should parse the junit report with no testsuite',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {
            $: {
              tests: '0',
              failures: '0',
              errors: '0',
              time: '0.000000'
            },
            testsuite: [
              {
                $: {
                  name: '.',
                  tests: '0',
                  failures: '0',
                  time: '0.000000',
                  timestamp: '2024-10-21T18:16:20+09:00'
                },
                properties: [
                  {
                    property: [
                      {
                        $: {
                          name: 'go.version',
                          value: 'go1.23.2 linux/amd64'
                        }
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
          result: Result.Passed,
          passed: 0,
          failed: 0,
          time: 0,
          version: '1.23.2'
        },
        failures: []
      }
    },
    {
      name: 'should parse the junit report with undefined testsuite',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {
            $: {
              tests: '0',
              failures: '0',
              errors: '0',
              time: '0.000000'
            }
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
          result: Result.Passed,
          passed: 0,
          failed: 0,
          time: 0,
          version: undefined
        },
        failures: []
      }
    },
    {
      name: 'should parse the junit report with empty testsuite',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {
            $: {
              tests: '0',
              failures: '0',
              errors: '0',
              time: '0.000000'
            },
            testsuite: []
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
          result: Result.Passed,
          passed: 0,
          failed: 0,
          time: 0,
          version: undefined
        },
        failures: []
      }
    },
    {
      name: 'should parse the failed junit report with testsuite',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {
            $: {
              tests: '4',
              failures: '2',
              errors: '0',
              time: '0.001000'
            },
            testsuite: [
              {
                $: {
                  name: 'foo',
                  tests: '2',
                  failures: '1',
                  time: '0.001000',
                  timestamp: '2024-09-17T21:07:31+09:00'
                },
                testcase: [
                  {
                    $: {
                      classname: 'foo/bar',
                      name: 'Test1',
                      time: '0.000500'
                    }
                  },
                  {
                    $: {
                      classname: 'foo/bar',
                      name: 'Test2',
                      time: '0.000500'
                    },
                    failure: [
                      {
                        $: {
                          message: 'Failed',
                          type: ''
                        },
                        _: '=== RUN   Test2\n    baz_test.go:1: error;'
                      },
                      // This should be ignored
                      {
                        $: {
                          message: 'Failed',
                          type: ''
                        },
                        _: '=== RUN   Test2\n--- FAIL: Test2 (0.00s)&#xA;'
                      }
                    ]
                  }
                ],
                properties: [
                  {
                    property: [
                      {
                        $: {
                          name: 'go.version',
                          value: 'go1.22.1 linux/amd64'
                        }
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
          result: Result.Failed,
          passed: 2,
          failed: 2,
          time: 0.001,
          version: '1.22.1'
        },
        failures: [
          {
            context: {
              owner: 'owner',
              repo: 'repo',
              sha: 'sha'
            },
            moduleDir: 'path/to',
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 1,
            test: 'Test2',
            message: '=== RUN   Test2\n    baz_test.go:1: error;',
            type: ReporterType.Gotestsum
          }
        ]
      }
    },
    {
      name: 'should parse the failed junit report with no testsuite',
      input: {
        context,
        path: 'path/to',
        report: {
          testsuites: {
            $: {
              tests: '0',
              failures: '2',
              errors: '3',
              time: '0.001000'
            },
            testsuite: [
              {
                $: {
                  name: 'foo',
                  tests: '0',
                  failures: '0',
                  time: '0.000000',
                  timestamp: '2024-09-17T21:07:31+09:00'
                },
                testcase: [
                  {
                    $: {
                      classname: 'foo/bar',
                      name: 'Test1',
                      time: '0.000000'
                    }
                  }
                ],
                properties: [
                  {
                    property: [
                      {
                        $: {
                          name: 'go.version',
                          value: 'go1.22.1 linux/amd64'
                        }
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
          result: Result.Failed,
          passed: 0,
          failed: 2,
          time: 0.001,
          version: '1.22.1'
        },
        failures: []
      }
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const report = new GotestsumParser(input.context, input.path, input.report)
    expect(report.path).toBe(expected.path)
    expect(report.summary).toEqual(expected.summary)
    expect(report.failures).toEqual(expected.failures)
  })
})

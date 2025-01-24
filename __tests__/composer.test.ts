import { TableComposer } from '../src/composer'
import { ReporterType, Result } from '../src/type'

// TODO: should not depend on views
describe('TableComposer#result', () => {
  const testCases = [
    {
      name: 'empty',
      input: {
        tests: [],
        lints: []
      },
      expected: Result.Passed
    },
    {
      name: 'all failed',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: []
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: []
          }
        ]
      },
      expected: Result.Failed
    },
    {
      name: 'all passed',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Passed,
              passed: 1,
              failed: 0,
              time: 1
            },
            failures: []
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Passed
            },
            failures: []
          }
        ]
      },
      expected: Result.Passed
    },
    {
      name: 'test failed',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 1,
              failed: 0,
              time: 1
            },
            failures: []
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Passed
            },
            failures: []
          }
        ]
      },
      expected: Result.Failed
    },
    {
      name: 'lint failed',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Passed,
              passed: 1,
              failed: 0,
              time: 1
            },
            failures: []
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: []
          }
        ]
      },
      expected: Result.Failed
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const composer = new TableComposer(input.tests, input.lints)
    const result = composer.result()
    expect(result).toEqual(expected)
  })
})

describe('TableComposer#summary', () => {
  const githubContext = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should create an empty summary',
      input: {
        tests: [],
        lints: []
      },
      expected: ''
    },
    {
      name: 'should create a table with some records',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Passed,
              passed: 1,
              failed: 0,
              time: 0.1,
              version: '1.22.2'
            },
            failures: []
          },
          {
            path: 'go/app2',
            summary: {
              result: Result.Passed,
              passed: 2,
              failed: 0,
              time: 0.2,
              version: '1.22.1'
            },
            failures: []
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Passed
            },
            failures: []
          }
        ]
      },
      expected: `
| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/sha/go/app1) | 1.22.2 | ✅Passed | 1 | 0 | 0.1s | - |
| [go/app2](https://github.com/owner/repo/blob/sha/go/app2) | 1.22.1 | ✅Passed | 2 | 0 | 0.2s | ✅Passed |
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const composer = new TableComposer(input.tests, input.lints)
    const actual = composer.summary(githubContext)
    expect(actual).toEqual(expected)
  })
})

describe('TableComposer#failures', () => {
  const githubContext = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'empty',
      input: {
        tests: []
      },
      expected: ''
    },
    {
      name: 'failures less than limit',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo1_test.go',
                line: 1,
                test: 'Test1/Case',
                message: 'aaa',
                type: ReporterType.Gotestsum
              },
              {
                subDir: 'module2',
                file: 'bar1_test.go',
                line: 2,
                test: 'Test2/Case',
                message: 'bbb',
                type: ReporterType.Gotestsum
              }
            ]
          },
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo2_test.go',
                line: 1,
                test: 'Test3/Case',
                message: 'ccc',
                type: ReporterType.Gotestsum
              }
            ]
          }
        ],
        lints: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Passed
            },
            failures: []
          },
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo.go',
                line: 1,
                test: 'Func1',
                message: 'ccc',
                type: ReporterType.GolangCILint
              }
            ]
          }
        ],
        limit: 10
      },
      expected: `
| File | Type | Case | Message |
| :--- | :--- | :--- | :------ |
| [go/app1/module1/foo1_test.go:1](https://github.com/owner/repo/blob/sha/go/app1/module1/foo1_test.go#L1) | gotestsum | Test1/Case | aaa |
| [go/app1/module2/bar1_test.go:2](https://github.com/owner/repo/blob/sha/go/app1/module2/bar1_test.go#L2) | gotestsum | Test2/Case | bbb |
| [go/app2/module1/foo2_test.go:1](https://github.com/owner/repo/blob/sha/go/app2/module1/foo2_test.go#L1) | gotestsum | Test3/Case | ccc |
| [go/app2/module1/foo.go:1](https://github.com/owner/repo/blob/sha/go/app2/module1/foo.go#L1) | golangci-lint | Func1 | ccc |
`.slice(1, -1)
    },
    {
      name: 'failures more than limit',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo1_test.go',
                line: 1,
                test: 'Test1/Case',
                message: 'aaa',
                type: ReporterType.Gotestsum
              },
              {
                subDir: 'module2',
                file: 'bar1_test.go',
                line: 2,
                test: 'Test2/Case',
                message: 'bbb',
                type: ReporterType.Gotestsum
              }
            ]
          },
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo2_test.go',
                line: 1,
                test: 'Test3/Case',
                message: 'ccc',
                type: ReporterType.Gotestsum
              }
            ]
          }
        ],
        lints: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Passed
            },
            failures: []
          },
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo.go',
                line: 1,
                test: 'Func1',
                message: 'ccc',
                type: ReporterType.GolangCILint
              }
            ]
          }
        ],
        limit: 2
      },
      expected: `
| File | Type | Case | Message |
| :--- | :--- | :--- | :------ |
| [go/app1/module1/foo1_test.go:1](https://github.com/owner/repo/blob/sha/go/app1/module1/foo1_test.go#L1) | gotestsum | Test1/Case | aaa |
| [go/app1/module2/bar1_test.go:2](https://github.com/owner/repo/blob/sha/go/app1/module2/bar1_test.go#L2) | gotestsum | Test2/Case | bbb |
| :warning: and 2 more... | - | - |
`.slice(1, -1)
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const composer = new TableComposer(input.tests, inputs.lint)
    const actual = composer.failures(githubContext, input.limit)
    expect(actual).toEqual(expected)
  })
})

describe('TableComposer#annotations', () => {
  const testCases = [
    {
      name: 'empty',
      input: {
        tests: [],
        lints: []
      },
      expected: []
    },
    {
      name: 'some failures within limit',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo_test.go',
                line: 1,
                test: 'Test1/Case',
                message: 'aaa'
              },
              {
                subDir: 'module2',
                file: 'bar_test.go',
                line: 2,
                test: 'Test2/Case',
                message: 'bbb'
              }
            ]
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo.go',
                line: 1,
                test: 'Func1',
                message: 'ccc'
              }
            ]
          }
        ]
      },
      expected: [
        '::error file=go/app1/module1/foo_test.go,line=1::aaa',
        '::error file=go/app1/module2/bar_test.go,line=2::bbb',
        '::error file=go/app2/module1/foo.go,line=1::ccc'
      ]
    },
    {
      name: 'some failures',
      input: {
        tests: [
          {
            path: 'go/app1',
            summary: {
              result: Result.Failed,
              passed: 0,
              failed: 1,
              time: 1
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo_test.go',
                line: 1,
                test: 'Test1/Case',
                message: 'aaa'
              },
              {
                subDir: 'module2',
                file: 'bar_test.go',
                line: 2,
                test: 'Test2/Case',
                message: 'bbb'
              }
            ]
          }
        ],
        lints: [
          {
            path: 'go/app2',
            summary: {
              result: Result.Failed
            },
            failures: [
              {
                subDir: 'module1',
                file: 'foo.go',
                line: 1,
                test: 'Func1',
                message: 'ccc'
              }
            ]
          }
        ]
      },
      expected: [
        '::error file=go/app1/module1/foo_test.go,line=1::aaa',
        '::error file=go/app1/module2/bar_test.go,line=2::bbb',
        '::error file=go/app2/module1/foo.go,line=1::ccc'
      ]
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const composer = new TableComposer(input.tests, input.lints)
    const actual = composer.annotations()
    expect(actual).toEqual(expected)
  })
})

import { createFailedCaseTable, createModuleTable } from '../src/table'
import { FailedCaseTableRecord, ModuleTableRecord } from '../src/type'

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

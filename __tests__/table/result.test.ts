import { Result } from '../../src/common/type'
import { toResult } from '../../src/table/result'

describe('toResult', () => {
  const testCases = [
    {
      name: 'should return success if empty',
      input: [],
      expected: Result.Passed
    },
    {
      name: 'should return failure if there are any failures',
      input: [Result.Failed, Result.Passed, Result.Passed],
      expected: Result.Failed
    },
    {
      name: 'should return success if there are no failures',
      input: [Result.Passed, Result.Passed, Result.Passed],
      expected: Result.Passed
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const result = toResult(input)
    expect(result).toEqual(expected)
  })
})

import { Unknown } from '../../../src/junit/reporter/unknown'
import { TestResult } from '../../../src/junit/type'

describe('unknown', () => {
  it('returns unknown', () => {
    const unknown = new Unknown('path/to/unknown.xml')
    expect(unknown.directory).toBe('path/to')
    expect(unknown.result).toBe(TestResult.Unknown)
    expect(unknown.tests).toBe(0)
    expect(unknown.passed).toBe(0)
    expect(unknown.failed).toBe(0)
    expect(unknown.skipped).toBe(0)
    expect(unknown.time).toBeUndefined()
    expect(unknown.version).toBeUndefined()
    expect(unknown.failures).toEqual([])
  })
})

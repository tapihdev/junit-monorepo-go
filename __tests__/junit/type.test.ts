import { TestCase } from '../../src/junit/type'

describe('testcase', () => {
  it('joins path', () => {
    const testcase = new TestCase(
      'path/to',
      'foo/bar',
      'baz_test.go',
      1,
      'Test1',
      'message'
    )
    expect(testcase.fullPath).toBe('path/to/foo/bar/baz_test.go')
  })

  it('joins path of which sub directory is .', () => {
    const testcase = new TestCase(
      'path/to',
      '.',
      'baz_test.go',
      1,
      'Test1',
      'message'
    )
    expect(testcase.fullPath).toBe('path/to/baz_test.go')
  })

  it('joins path of which module dir is .', () => {
    const testcase = new TestCase(
      '.',
      'foo/bar',
      'baz_test.go',
      1,
      'Test1',
      'message'
    )
    expect(testcase.fullPath).toBe('foo/bar/baz_test.go')
  })
})

import fs from 'fs'

import { JUnitReporterFactory } from '../../src/parse/factory'
import { ReporterType } from '../../src/common/type'
import { GolangCILintParser } from '../../src/parse/golangcilint'
import { GotestsumParser } from '../../src/parse/gotestsum'
import { JUnitXmlReader } from '../../src/parse/reader'

describe('JUnitReporterFactory', () => {
  const junixXmlReaderMock = jest
    .spyOn(JUnitXmlReader.prototype, 'safeParse')
    .mockResolvedValue({
      testsuites: {}
    })
  const directory = 'path/to'
  const fileName = 'junit.xml'
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }

  const testCases = [
    {
      name: 'should return GolangCILintParser',
      input: ReporterType.GolangCILint,
      expected: GolangCILintParser
    },
    {
      name: 'should return GotestsumParser',
      input: ReporterType.Gotestsum,
      expected: GotestsumParser
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const factory = new JUnitReporterFactory(
      new JUnitXmlReader(fs.promises.readFile)
    )
    const result = await factory.fromXml(context, input, directory, fileName)
    expect(result).toBeInstanceOf(expected)
    expect(junixXmlReaderMock).toHaveBeenCalledWith(directory, fileName)
  })
})

import fs from 'fs'

import { JUnitReporterFactory } from '../../src/junit/factory'
import { ReporterType } from '../../src/type'
import { GolangCILintReporterImpl } from '../../src/junit/golangcilint'
import { GotestsumReporterImpl } from '../../src/junit/gotestsum'
import { JUnitXmlReader } from '../../src/junit/reader'

describe('JUnitReporterFactoryImpl', () => {
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
      name: 'should return GolangCILintReporterImpl',
      input: ReporterType.GolangCILint,
      expected: GolangCILintReporterImpl
    },
    {
      name: 'should return GotestsumReporterImpl',
      input: ReporterType.Gotestsum,
      expected: GotestsumReporterImpl
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

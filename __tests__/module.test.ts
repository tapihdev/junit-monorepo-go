import { Module } from '../src/module'
import { JUnitReport as JUnitReportXML } from '../src/junit/xml'
import { GotestsumReport } from '../src/junit/reporter/gotestsum'
import { TestResult } from '../src/junit/type'

describe('module', () => {
  it('constructs a module', async () => {
    const fromXMLMock = jest.spyOn(GotestsumReport, 'fromXml').mockResolvedValue(
      new GotestsumReport(
        'path/to',
        { testsuites: {} },
      )
    )

    const module = await Module.fromXML('path/to', 'junit.xml')
    expect(module.directory).toBe('path/to')
    expect(fromXMLMock).toHaveBeenCalledWith('path/to/junit.xml')
  })
})

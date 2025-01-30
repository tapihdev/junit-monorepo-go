import { Table } from '../table/typed'
import { GotestsumSummaryReport, GotestsumSummaryRecord } from '../report/type'

export class GotestsumTable {
  private _table: Table<GotestsumSummaryRecord>

  constructor(reports: GotestsumSummaryReport[]) {
    this._table = new Table(
      {
        index: 'Module',
        values: {
          version: 'Version',
          result: 'Result',
          passed: 'Passed',
          failed: 'Failed',
          time: 'Time'
        }
      },
      {
        index: ':-----',
        values: {
          version: '------:',
          result: ':---',
          passed: '-----:',
          failed: '-----:',
          time: '---:'
        }
      },
      reports.map(report => ({
        index: report.index,
        values: report.record
      }))
    )
  }

  toTable(): Table<GotestsumSummaryRecord> {
    return this._table
  }
}

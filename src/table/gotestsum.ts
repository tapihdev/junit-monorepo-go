import { Table } from './base/typed'
import { Align } from './base/type'
import { GotestsumSummaryReport, GotestsumSummaryRecord } from '../report/type'

export class GotestsumTable {
  private _table: Table<GotestsumSummaryRecord>

  constructor(title: string, reports: GotestsumSummaryReport[]) {
    this._table = new Table(
      {
        index: 'Module',
        values: {
          version: 'Version',
          result: title,
          passed: 'Passed',
          failed: 'Failed',
          time: 'Time'
        }
      },
      {
        index: Align.Left,
        values: {
          version: Align.Right,
          result: Align.Left,
          passed: Align.Right,
          failed: Align.Right,
          time: Align.Right
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

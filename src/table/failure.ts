import { Table } from './base/typed'
import { Align } from './base/type'
import { ReportableFailure, FailureRecord } from '../report/type'

export class FailureTable {
  private _table: Table<FailureRecord>

  constructor(reports: ReportableFailure[]) {
    this._table = new Table(
      {
        index: 'File',
        values: {
          type: 'Type',
          test: 'Case',
          message: 'Message'
        }
      },
      {
        index: Align.Left,
        values: {
          type: Align.Left,
          test: Align.Left,
          message: Align.Left
        }
      },
      reports.map(report => ({
        index: report.index,
        values: report.record
      }))
    )
  }

  toTable(limit = 10): Table<FailureRecord> {
    const numRows = this._table.rows
    const limited = this._table.records.slice(0, limit)
    if (numRows > limit) {
      limited.push({
        index: '-',
        values: {
          type: '-',
          test: '-',
          message: `:warning: and ${numRows - limit} more...`
        }
      })
    }
    return new Table(this._table.header, this._table.separator, limited)
  }
}

import { Table } from '../table/typed'
import { FailureReport, FailureRecord } from '../report/type'

export class FailureTable {
  private _table: Table<FailureRecord>

  constructor(reports: FailureReport[]) {
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
        index: ':---',
        values: {
          type: ':---',
          test: ':---',
          message: ':------'
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

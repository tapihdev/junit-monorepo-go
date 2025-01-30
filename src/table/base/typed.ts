import { UntypedTable } from './untyped'

export type Row<T extends Record<string, string | undefined>> = {
  readonly index: string
  readonly values: T
}

export class Table<T extends Record<string, string | undefined>> {
  constructor(
    readonly header: Row<T>,
    readonly separator: Row<T>,
    readonly records: Row<T>[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return Object.keys(this.header.values).length
  }

  concat(other: Table<T>): Table<T> {
    return new Table(this.header, this.separator, [
      ...this.records,
      ...other.records
    ])
  }

  toUntyped(): UntypedTable {
    return new UntypedTable(
      {
        index: this.header.index,
        values: Object.values(this.header.values)
      },
      {
        index: this.separator.index,
        values: Object.values(this.separator.values)
      },
      this.records.map(r => ({
        index: r.index,
        values: Object.values(r.values)
      }))
    )
  }
}

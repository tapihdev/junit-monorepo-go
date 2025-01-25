export type UntypedRow = {
  readonly index: string
  readonly values: (string | undefined)[]
}

export class UntypedTable {
  constructor(
    readonly header: UntypedRow,
    readonly separator: UntypedRow,
    readonly records: UntypedRow[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return this.header.values.length
  }

  static joinLeft(table1: UntypedTable, table2: UntypedTable): UntypedTable {
    const header = {
      index: table1.header.index,
      values: [...table1.header.values, ...table2.header.values]
    }
    const separator = {
      index: table1.separator.index,
      values: [...table1.separator.values, ...table2.separator.values]
    }
    const table2Map = new Map<string, UntypedRow>()
    table2.records.forEach(record => table2Map.set(record.index, record))
    const merged = table1.records.map(record => {
      const v = table2Map.get(record.index)
      if (v) {
        return {
          index: record.index,
          values: [...record.values, ...v.values]
        }
      }
      return record
    })
    return new UntypedTable(header, separator, merged)
  }

  toString(): string {
    return [
      `| ${this.header.index} | ${this.header.values.join(' | ')} |`,
      `| ${this.separator.index} | ${this.separator.values.join(' | ')} |`,
      ...this.records.map(r => `| ${r.index} | ${r.values.join(' | ')} |`)
    ].join('\n')
  }
}
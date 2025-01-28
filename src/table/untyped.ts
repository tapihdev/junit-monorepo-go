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

  join(other: UntypedTable): UntypedTable {
    const header = {
      index: this.header.index,
      values: [...this.header.values, ...other.header.values]
    }
    const separator = {
      index: this.separator.index,
      values: [...this.separator.values, ...other.separator.values]
    }
    const table2Map = new Map<string, UntypedRow>()
    other.records.forEach(record => table2Map.set(record.index, record))
    const merged = this.records.map(record => {
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
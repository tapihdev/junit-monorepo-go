export type UntypedRow = {
  readonly index: string
  readonly values: (string | undefined)[]
}

export class UntypedTable {
  constructor(
    readonly header: UntypedRow,
    readonly separator: UntypedRow,
    readonly records: UntypedRow[]
  ) {
    if (this.header.values.length !== this.separator.values.length) {
      throw new Error('header and separator must have the same length')
    }

    if (this.records.some(r => r.values.length !== this.header.values.length)) {
      throw new Error('records must have the same length as header')
    }
  }

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return this.header.values.length
  }

  join(others: UntypedTable[]): UntypedTable {
    const header = {
      index: this.header.index,
      values: [...this.header.values, ...others.map(o => o.header.values).flat()]
    }
    const separator = {
      index: this.separator.index,
      values: [...this.separator.values, ...others.map(o => o.separator.values).flat()]
    }
    const maps = others.map(o => o.records).map(r => new Map<string, UntypedRow>(r.map(r => [r.index, r])))
    const merged = this.records.map(record => {
      const v = others.map(() => new Array(this.columns).fill(undefined))
      for (const i in others) {
        const r = maps[i].get(record.index)
        if (r) {
          v[i] = r.values
        }
      }
      return {
        index: record.index,
        values: [...record.values, ...v.flat()]
      }
    })
    return new UntypedTable(header, separator, merged)
  }

  toString(): string {
    if (this.rows === 0) {
      return ''
    }

    return [
      `| ${this.header.index} | ${this.header.values.join(' | ')} |`,
      `| ${this.separator.index} | ${this.separator.values.join(' | ')} |`,
      ...this.records.map(r => `| ${r.index} | ${r.values.join(' | ')} |`)
    ].join('\n')
  }
}
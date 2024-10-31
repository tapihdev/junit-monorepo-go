import { Reporter } from "./reporter"
import { GotestsumReport } from "./gotestsum"
import { GolangCILintReport } from "./golangcilint"
import { parseJUnitReport } from "./xml"

export class ReporterFactory {
  static async fromXml(
    type: 'test' | 'lint',
    path: string
  ): Promise<Reporter> {
    switch (type) {
      case 'test':
        return new GotestsumReport(await parseJUnitReport(path))
      case 'lint':
        return new GolangCILintReport(await parseJUnitReport(path))
    }
  }
}
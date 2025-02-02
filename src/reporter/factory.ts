import { AnyReporter } from './type'
import { ReporterType, GitHubContext } from '../common/type'
import { GolangCILintReporterImpl } from './golangcilint'
import { GotestsumReporterImpl } from './gotestsum'
import { JUnitXmlReader } from './reader'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertNever = (_: never): never => {
  throw new Error('exhaustiveness check')
}

export class JUnitReporterFactory {
  constructor(private readonly reader: JUnitXmlReader) {}

  async fromXml(
    context: GitHubContext,
    type: ReporterType,
    directory: string,
    fileName: string
  ): Promise<AnyReporter> {
    const parsed = await this.reader.safeParse(directory, fileName)

    switch (type) {
      case ReporterType.GolangCILint:
        return new GolangCILintReporterImpl(context, directory, parsed)
      case ReporterType.Gotestsum:
        return new GotestsumReporterImpl(context, directory, parsed)
      default:
        return assertNever(type)
    }
  }
}

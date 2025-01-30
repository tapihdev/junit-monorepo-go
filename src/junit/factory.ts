import { AnyReporter } from './type'
import { ReporterType, GitHubContext } from '../type'
import { GolangCILintReporterImpl } from './golangcilint'
import { GotestsumReporterImpl } from './gotestsum'
import { JUnitXmlReader } from './reader'

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
    }
  }
}

import * as github from '@actions/github'

export type Octokit = ReturnType<typeof github.getOctokit>

export type UpsertCommentInput = {
  owner: string
  repo: string
  pullNumber: number
  mark: string
  body: string
}

export type UpsertCommentOutput = {
  updated: boolean
  id: number
}

export class Client {
  constructor(private readonly octokit: Octokit) {}

  async upsertComment(
    params: UpsertCommentInput
  ): Promise<UpsertCommentOutput> {
    const { owner, repo, pullNumber, mark, body } = params
    const markedBody = `${mark}\n${body}`
    const allComments = await this.octokit.paginate(
      this.octokit.rest.issues.listComments,
      {
        owner,
        repo,
        issue_number: pullNumber
      }
    )
    const pastComments = allComments.filter(
      c => c.body?.startsWith(mark) ?? false
    )
    if (pastComments.length > 0) {
      const reponse = await this.octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: pastComments[0].id,
        body: markedBody
      })
      return { updated: true, id: reponse.data.id }
    }

    const response = await this.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: markedBody
    })
    return { updated: false, id: response.data.id }
  }
}

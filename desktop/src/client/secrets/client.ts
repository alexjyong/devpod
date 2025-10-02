import { Result, ResultError } from "../../lib"
import { TSecret, TSecretScope, TSecretStore } from "../../types"
import { DevPodCommand } from "../command"

export class SecretsClient {
  private command = new DevPodCommand()

  async list(scope?: TSecretScope, target?: string): Promise<Result<TSecret[]>> {
    const args = ["secret", "list"]
    if (scope) {
      args.push("--scope", scope)
    }
    if (target) {
      args.push("--target", target)
    }

    const result = await this.command.run(args)
    if (result.err) {
      return result
    }

    try {
      const lines = result.val.split("\n").filter((l) => l.trim() && !l.startsWith("NAME"))
      const secrets: TSecret[] = lines.map((line) => {
        const parts = line.split(/\s+/)
        return {
          name: parts[0],
          scope: parts[1] as TSecretScope,
          target: parts[2] === "-" ? undefined : parts[2],
          description: parts.slice(3).join(" ") || undefined,
          value: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })

      return { ok: true, val: secrets }
    } catch (err) {
      return { ok: false, val: new ResultError("Failed to parse secrets", err) }
    }
  }

  async set(secret: TSecret): Promise<Result<void>> {
    const args = ["secret", "set", secret.name, secret.value, "--scope", secret.scope]
    if (secret.target) {
      args.push("--target", secret.target)
    }
    if (secret.description) {
      args.push("--description", secret.description)
    }

    const result = await this.command.run(args)
    if (result.err) {
      return result
    }

    return { ok: true, val: undefined }
  }

  async delete(name: string, scope: TSecretScope, target?: string): Promise<Result<void>> {
    const args = ["secret", "delete", name, "--scope", scope]
    if (target) {
      args.push("--target", target)
    }

    const result = await this.command.run(args)
    if (result.err) {
      return result
    }

    return { ok: true, val: undefined }
  }
}

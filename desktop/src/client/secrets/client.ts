import { Failed, Return, Result } from "../../lib"
import { TSecret, TSecretScope } from "../../types"
import { Command } from "../command"

export class SecretsClient {
  async list(scope?: TSecretScope, target?: string): Promise<Result<TSecret[]>> {
    const args = ["secret", "list"]
    if (scope) {
      args.push("--scope", scope)
    }
    if (target) {
      args.push("--target", target)
    }

    const command = new Command(args)
    const result = await command.run()
    if (result.err) {
      return Return.Failed("Failed to list secrets", result.val.message)
    }

    try {
      const output = result.val.stdout
      const lines = output.split("\n").filter((l: string) => l.trim() && !l.startsWith("NAME"))
      const secrets: TSecret[] = lines.map((line: string) => {
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

      return Return.Value(secrets)
    } catch (err) {
      return Return.Failed("Failed to parse secrets", String(err))
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

    const command = new Command(args)
    const result = await command.run()
    if (result.err) {
      return Return.Failed("Failed to set secret", result.val.message)
    }

    return Return.Ok()
  }

  async delete(name: string, scope: TSecretScope, target?: string): Promise<Result<void>> {
    const args = ["secret", "delete", name, "--scope", scope]
    if (target) {
      args.push("--target", target)
    }

    const command = new Command(args)
    const result = await command.run()
    if (result.err) {
      return Return.Failed("Failed to delete secret", result.val.message)
    }

    return Return.Ok()
  }
}

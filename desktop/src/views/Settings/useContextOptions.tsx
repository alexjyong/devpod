import { Code, Link, Switch, Button, HStack, Badge, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState, useEffect } from "react"
import { client } from "../../client"
import { QueryKeys } from "../../queryKeys"
import { TContextOptionName } from "../../types"
import { ClearableInput } from "./ClearableInput"

const DEFAULT_DEVPOD_AGENT_URL = "https://github.com/alexjyong/devpod/releases/latest/download/"

export function useContextOptions() {
  const queryClient = useQueryClient()
  const { data: options } = useQuery({
    queryKey: QueryKeys.CONTEXT_OPTIONS,
    queryFn: async () => (await client.context.listOptions()).unwrap(),
  })
  const { mutate: updateOption } = useMutation({
    mutationFn: async ({ option, value }: { option: TContextOptionName; value: string }) => {
      ;(await client.context.setOption(option, value)).unwrap()
    },
    onSettled: () => {
      queryClient.invalidateQueries(QueryKeys.CONTEXT_OPTIONS)
    },
  })

  return useMemo(
    () => ({
      options,
      updateOption,
    }),
    [options, updateOption]
  )
}

export function useAgentURLOption() {
  const { options, updateOption } = useContextOptions()

  const handleChanged = useCallback(
    (newValue: string) => {
      const value = newValue.trim()
      updateOption({ option: "AGENT_URL", value })
    },
    [updateOption]
  )

  const input = useMemo(
    () => (
      <ClearableInput
        placeholder="Override Agent URL"
        defaultValue={options?.AGENT_URL.value ?? ""}
        onChange={handleChanged}
      />
    ),
    [handleChanged, options?.AGENT_URL.value]
  )

  const helpText = useMemo(
    () => (
      <>
        Set the Agent URL. If you leave this empty, it will be pulled from{" "}
        <Code>{DEFAULT_DEVPOD_AGENT_URL}</Code>
      </>
    ),
    []
  )

  return { input, helpText }
}

export function useTelemetryOption() {
  const { options, updateOption } = useContextOptions()

  const input = useMemo(
    () => (
      <Switch
        isChecked={options?.TELEMETRY.value === "true"}
        onChange={(e) => updateOption({ option: "TELEMETRY", value: e.target.checked.toString() })}
      />
    ),
    [options?.TELEMETRY.value, updateOption]
  )

  const helpText = useMemo(
    () => (
      <>
        Telemetry plays an important role in improving DevPod for everyone.{" "}
        <strong>We never collect any actual values, only anonymized metadata!</strong> For an
        in-depth explanation, please refer to the{" "}
        <Link onClick={() => client.open("https://devpod.sh/docs/other-topics/telemetry")}>
          documentation
        </Link>
      </>
    ),
    []
  )

  return { input, helpText }
}

export function useDockerCredentialsForwardingOption() {
  const { options, updateOption } = useContextOptions()

  const input = useMemo(
    () => (
      <Switch
        isChecked={options?.SSH_INJECT_DOCKER_CREDENTIALS.value === "true"}
        onChange={(e) =>
          updateOption({
            option: "SSH_INJECT_DOCKER_CREDENTIALS",
            value: e.target.checked.toString(),
          })
        }
      />
    ),
    [options?.SSH_INJECT_DOCKER_CREDENTIALS.value, updateOption]
  )

  const helpText = useMemo(
    () => <>Enable to forward your local docker credentials to workspaces</>,
    []
  )

  return { input, helpText }
}

export function useGitCredentialsForwardingOption() {
  const { options, updateOption } = useContextOptions()

  const input = useMemo(
    () => (
      <Switch
        isChecked={options?.SSH_INJECT_GIT_CREDENTIALS.value === "true"}
        onChange={(e) =>
          updateOption({
            option: "SSH_INJECT_GIT_CREDENTIALS",
            value: e.target.checked.toString(),
          })
        }
      />
    ),
    [options?.SSH_INJECT_GIT_CREDENTIALS.value, updateOption]
  )

  const helpText = useMemo(
    () => <>Enable to forward your local HTTPS based git credentials to workspaces</>,
    []
  )

  return { input, helpText }
}

export function useInstallAgentBinaries() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if agent binaries are already installed in ~/.devpod-secrets/bin/
    const checkInstalled = async () => {
      try {
        const homeDir = await client.getDir("Home")
        const agentDir = `${homeDir}/.devpod-secrets/bin`
        // Check if the directory exists and has agent binaries
        const linuxAmd64 = await client.readFile([agentDir, "devpod-secrets-agent-linux-amd64"]).catch(() => null)
        const linuxArm64 = await client.readFile([agentDir, "devpod-secrets-agent-linux-arm64"]).catch(() => null)
        setIsInstalled(linuxAmd64 !== null || linuxArm64 !== null)
      } catch {
        setIsInstalled(false)
      }
    }
    checkInstalled()
  }, [])

  const install = useCallback(async () => {
    if (isInstalling) return

    setIsInstalling(true)
    try {
      // For now, we'll need to implement this in the CLI
      // The CLI already has access to bundled binaries through inject.go
      // We should add a `devpod-secrets-cli agent install` command
      console.log("Installing agent binaries locally...")
      // TODO: Implement the actual CLI command
      setIsInstalled(true)
    } catch (error) {
      console.error("Failed to install agent binaries:", error)
    } finally {
      setIsInstalling(false)
    }
  }, [isInstalling])

  const input = useMemo(
    () => (
      <HStack>
        <Button
          size="sm"
          colorScheme={isInstalled ? "green" : "blue"}
          isLoading={isInstalling}
          loadingText="Installing..."
          onClick={install}
          isDisabled={isInstalled}
        >
          {isInstalled ? "Installed" : "Install Agent Binaries"}
        </Button>
        {isInstalled && (
          <Badge colorScheme="green" size="sm">
            <Text fontSize="xs">Available</Text>
          </Badge>
        )}
      </HStack>
    ),
    [isInstalled, isInstalling, install]
  )

  const helpText = useMemo(
    () => <>Install Linux agent binaries locally to enable CLI usage without downloads</>,
    []
  )

  return { input, helpText }
}

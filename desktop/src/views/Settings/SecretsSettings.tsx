import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { client } from "../../client"
import { Plus, Trash } from "../../icons"
import { TSecret, TSecretScope } from "../../types"

export function SecretsSettings() {
  const [secrets, setSecrets] = useState<TSecret[]>([])
  const [loading, setLoading] = useState(true)
  const { colorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingSecret, setEditingSecret] = useState<TSecret | null>(null)

  const loadSecrets = useCallback(async () => {
    setLoading(true)
    const result = await client.secrets.list()
    if (result.ok) {
      setSecrets(result.val)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSecrets()
  }, [])

  const handleAddSecret = useCallback(() => {
    setEditingSecret(null)
    onOpen()
  }, [onOpen])

  const handleDeleteSecret = useCallback(async (secret: TSecret) => {
    const result = await client.secrets.delete(secret.name, secret.scope, secret.target)
    if (result.ok) {
      loadSecrets()
    }
  }, [loadSecrets])

  const handleSaveSecret = useCallback(async (secret: TSecret) => {
    const result = await client.secrets.set(secret)
    if (result.ok) {
      loadSecrets()
      onClose()
    }
  }, [loadSecrets, onClose])

  return (
    <VStack align="start" spacing={6}>
      <HStack justify="space-between" w="full">
        <Heading size="md">Secrets</Heading>
        <Button leftIcon={<Plus />} colorScheme="primary" onClick={handleAddSecret}>
          Add Secret
        </Button>
      </HStack>

      <Text>
        Manage secrets that are injected into your workspaces as environment variables. Secrets can
        be scoped globally, per-provider, or per-workspace.
      </Text>

      {secrets.length === 0 ? (
        <Box w="full" p={8} textAlign="center">
          <Text color="gray.500">No secrets configured</Text>
        </Box>
      ) : (
        <TableContainer w="full">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Scope</Th>
                <Th>Target</Th>
                <Th>Description</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {secrets.map((secret) => (
                <Tr key={`${secret.scope}-${secret.target}-${secret.name}`}>
                  <Td fontFamily="mono">{secret.name}</Td>
                  <Td textTransform="capitalize">{secret.scope}</Td>
                  <Td>{secret.target || "-"}</Td>
                  <Td>{secret.description || "-"}</Td>
                  <Td>
                    <Tooltip label="Delete secret">
                      <IconButton
                        aria-label="Delete secret"
                        icon={<Trash boxSize={4} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteSecret(secret)}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {isOpen && (
        <SecretModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={handleSaveSecret}
          secret={editingSecret}
        />
      )}
    </VStack>
  )
}

type TSecretModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (secret: TSecret) => void
  secret: TSecret | null
}

function SecretModal({ isOpen, onClose, onSave, secret }: TSecretModalProps) {
  const [name, setName] = useState(secret?.name || "")
  const [value, setValue] = useState(secret?.value || "")
  const [scope, setScope] = useState<TSecretScope>(secret?.scope || "global")
  const [target, setTarget] = useState(secret?.target || "")
  const [description, setDescription] = useState(secret?.description || "")

  const handleSave = useCallback(() => {
    const now = new Date().toISOString()
    onSave({
      name,
      value,
      scope,
      target: scope === "global" ? undefined : target,
      description,
      createdAt: secret?.createdAt || now,
      updatedAt: now,
    })
  }, [name, value, scope, target, description, secret, onSave])

  const isValid = useMemo(() => {
    if (!name || !value) return false
    if (scope !== "global" && !target) return false
    return true
  }, [name, value, scope, target])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{secret ? "Edit Secret" : "Add Secret"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Environment Variable Name</FormLabel>
              <Input
                placeholder="MY_SECRET_KEY"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fontFamily="mono"
              />
              <FormHelperText>
                This will be the environment variable name in your workspace
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Value</FormLabel>
              <Textarea
                placeholder="secret-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fontFamily="mono"
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Scope</FormLabel>
              <Select value={scope} onChange={(e) => setScope(e.target.value as TSecretScope)}>
                <option value="global">Global (all workspaces)</option>
                <option value="provider">Provider (specific provider)</option>
                <option value="workspace">Workspace (specific workspace)</option>
              </Select>
            </FormControl>

            {scope !== "global" && (
              <FormControl isRequired>
                <FormLabel>
                  {scope === "provider" ? "Provider Name" : "Workspace ID"}
                </FormLabel>
                <Input
                  placeholder={scope === "provider" ? "docker" : "my-workspace"}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <FormHelperText>
                  {scope === "provider"
                    ? "The provider this secret applies to"
                    : "The workspace ID this secret applies to"}
                </FormHelperText>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Description (optional)</FormLabel>
              <Input
                placeholder="Describe what this secret is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={handleSave} isDisabled={!isValid}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

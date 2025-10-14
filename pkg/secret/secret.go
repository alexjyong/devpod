package secret

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/loft-sh/devpod/pkg/config"
	"github.com/loft-sh/devpod/pkg/types"
	"github.com/pkg/errors"
)

type SecretScope string

const (
	ScopeGlobal    SecretScope = "global"
	ScopeProvider  SecretScope = "provider"
	ScopeWorkspace SecretScope = "workspace"
)

type Secret struct {
	Name        string      `json:"name"`
	Value       string      `json:"value"`
	Scope       SecretScope `json:"scope"`
	Target      string      `json:"target,omitempty"`
	Description string      `json:"description,omitempty"`
	CreatedAt   types.Time  `json:"createdAt"`
	UpdatedAt   types.Time  `json:"updatedAt"`
}

type SecretStore struct {
	Secrets map[string]*Secret `json:"secrets"`
	Origin  string             `json:"-"`
}

func SecretID(name string, scope SecretScope, target string) string {
	if scope == ScopeGlobal {
		return fmt.Sprintf("global:%s", name)
	}
	return fmt.Sprintf("%s:%s:%s", scope, target, name)
}

func NewSecretStore() *SecretStore {
	return &SecretStore{
		Secrets: make(map[string]*Secret),
	}
}

func GetSecretsDir() (string, error) {
	configDir, err := config.GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "secrets"), nil
}

func GetSecretsFile() (string, error) {
	secretsDir, err := GetSecretsDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(secretsDir, "secrets.json"), nil
}

func LoadSecretStore() (*SecretStore, error) {
	secretsFile, err := GetSecretsFile()
	if err != nil {
		return nil, err
	}

	if _, err := os.Stat(secretsFile); os.IsNotExist(err) {
		store := NewSecretStore()
		store.Origin = secretsFile
		return store, nil
	}

	data, err := os.ReadFile(secretsFile)
	if err != nil {
		return nil, errors.Wrap(err, "read secrets file")
	}

	store := NewSecretStore()
	err = json.Unmarshal(data, store)
	if err != nil {
		return nil, errors.Wrap(err, "unmarshal secrets")
	}

	store.Origin = secretsFile
	return store, nil
}

func (s *SecretStore) Save() error {
	if s.Origin == "" {
		secretsFile, err := GetSecretsFile()
		if err != nil {
			return err
		}
		s.Origin = secretsFile
	}

	secretsDir := filepath.Dir(s.Origin)
	err := os.MkdirAll(secretsDir, 0700)
	if err != nil {
		return errors.Wrap(err, "create secrets directory")
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return errors.Wrap(err, "marshal secrets")
	}

	err = os.WriteFile(s.Origin, data, 0600)
	if err != nil {
		return errors.Wrap(err, "write secrets file")
	}

	return nil
}

func (s *SecretStore) AddSecret(secret *Secret) error {
	if secret.Name == "" {
		return errors.New("secret name cannot be empty")
	}

	encrypted, err := Encrypt(secret.Value)
	if err != nil {
		return errors.Wrap(err, "encrypt secret value")
	}

	id := SecretID(secret.Name, secret.Scope, secret.Target)

	now := types.Now()
	if s.Secrets[id] == nil {
		secret.CreatedAt = now
	} else {
		secret.CreatedAt = s.Secrets[id].CreatedAt
	}
	secret.UpdatedAt = now
	secret.Value = encrypted

	s.Secrets[id] = secret
	return s.Save()
}

func (s *SecretStore) GetSecret(name string, scope SecretScope, target string) (*Secret, error) {
	id := SecretID(name, scope, target)
	secret, ok := s.Secrets[id]
	if !ok {
		return nil, fmt.Errorf("secret %s not found", id)
	}
	return secret, nil
}

func (s *SecretStore) DeleteSecret(name string, scope SecretScope, target string) error {
	id := SecretID(name, scope, target)
	if _, ok := s.Secrets[id]; !ok {
		return fmt.Errorf("secret %s not found", id)
	}

	delete(s.Secrets, id)
	return s.Save()
}

func (s *SecretStore) ListSecrets(scope *SecretScope, target *string) []*Secret {
	var secrets []*Secret

	for _, secret := range s.Secrets {
		if scope != nil && secret.Scope != *scope {
			continue
		}
		if target != nil && secret.Target != *target {
			continue
		}
		secrets = append(secrets, secret)
	}

	return secrets
}

func (s *SecretStore) GetSecretsForWorkspace(workspaceID, providerName string) map[string]string {
	envVars := make(map[string]string)

	for _, secret := range s.Secrets {
		if secret.Scope == ScopeGlobal {
			decrypted, err := Decrypt(secret.Value)
			if err == nil {
				envVars[secret.Name] = decrypted
			}
		}
	}

	if providerName != "" {
		for _, secret := range s.Secrets {
			if secret.Scope == ScopeProvider && secret.Target == providerName {
				decrypted, err := Decrypt(secret.Value)
				if err == nil {
					envVars[secret.Name] = decrypted
				}
			}
		}
	}

	if workspaceID != "" {
		for _, secret := range s.Secrets {
			if secret.Scope == ScopeWorkspace && secret.Target == workspaceID {
				decrypted, err := Decrypt(secret.Value)
				if err == nil {
					envVars[secret.Name] = decrypted
				}
			}
		}
	}

	return envVars
}

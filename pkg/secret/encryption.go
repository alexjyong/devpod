package secret

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
	"os"
	"path/filepath"

	"github.com/loft-sh/devpod/pkg/config"
	"github.com/pkg/errors"
)

func getEncryptionKey() ([]byte, error) {
	configDir, err := config.GetConfigDir()
	if err != nil {
		return nil, err
	}

	keyFile := filepath.Join(configDir, "secrets", ".key")

	if _, err := os.Stat(keyFile); os.IsNotExist(err) {
		key := make([]byte, 32)
		_, err := rand.Read(key)
		if err != nil {
			return nil, errors.Wrap(err, "generate encryption key")
		}

		keyDir := filepath.Dir(keyFile)
		err = os.MkdirAll(keyDir, 0700)
		if err != nil {
			return nil, errors.Wrap(err, "create key directory")
		}

		err = os.WriteFile(keyFile, key, 0600)
		if err != nil {
			return nil, errors.Wrap(err, "write encryption key")
		}

		return key, nil
	}

	key, err := os.ReadFile(keyFile)
	if err != nil {
		return nil, errors.Wrap(err, "read encryption key")
	}

	return key, nil
}

func Encrypt(plaintext string) (string, error) {
	key, err := getEncryptionKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", errors.Wrap(err, "create cipher")
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", errors.Wrap(err, "create GCM")
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", errors.Wrap(err, "generate nonce")
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(ciphertext string) (string, error) {
	key, err := getEncryptionKey()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", errors.Wrap(err, "decode base64")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", errors.Wrap(err, "create cipher")
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", errors.Wrap(err, "create GCM")
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, cipherData := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, cipherData, nil)
	if err != nil {
		return "", errors.Wrap(err, "decrypt")
	}

	return string(plaintext), nil
}

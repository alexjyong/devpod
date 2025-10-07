package agent

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/loft-sh/devpod/cmd/flags"
	"github.com/loft-sh/devpod/pkg/agent"
	"github.com/loft-sh/log"
	"github.com/spf13/cobra"
)

// NewInstallCmd creates a new command to install agent binaries locally
func NewInstallCmd(globalFlags *flags.GlobalFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "install",
		Short: "Install agent binaries locally for CLI usage",
		RunE: func(cmd *cobra.Command, args []string) error {
			return installAgentBinaries()
		},
	}

	return cmd
}

func installAgentBinaries() error {
	// Get home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	// Create ~/.devpod-secrets/bin directory
	binDir := filepath.Join(homeDir, ".devpod-secrets", "bin")
	if err := os.MkdirAll(binDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", binDir, err)
	}

	// Find bundled Linux binaries
	linuxAmd64Binary, err := agent.FindBundledLinuxBinary("amd64")
	if err != nil {
		log.Default.Warnf("Failed to find amd64 binary: %v", err)
	} else {
		targetPath := filepath.Join(binDir, "devpod-secrets-agent-linux-amd64")
		if err := copyFile(linuxAmd64Binary, targetPath); err != nil {
			return fmt.Errorf("failed to copy amd64 binary: %w", err)
		}
		log.Default.Infof("Installed amd64 agent binary to %s", targetPath)
	}

	linuxArm64Binary, err := agent.FindBundledLinuxBinary("arm64")
	if err != nil {
		log.Default.Warnf("Failed to find arm64 binary: %v", err)
	} else {
		targetPath := filepath.Join(binDir, "devpod-secrets-agent-linux-arm64")
		if err := copyFile(linuxArm64Binary, targetPath); err != nil {
			return fmt.Errorf("failed to copy arm64 binary: %w", err)
		}
		log.Default.Infof("Installed arm64 agent binary to %s", targetPath)
	}

	log.Default.Infof("Agent binaries installed successfully to %s", binDir)
	return nil
}

func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	err = os.WriteFile(dst, input, 0755)
	if err != nil {
		return err
	}

	return nil
}
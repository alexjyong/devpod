package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/loft-sh/devpod/cmd/flags"
	"github.com/loft-sh/devpod/pkg/secret"
	"github.com/loft-sh/log"
	"github.com/spf13/cobra"
)

func NewSecretCmd(globalFlags *flags.GlobalFlags) *cobra.Command {
	secretCmd := &cobra.Command{
		Use:   "secret",
		Short: "Manage DevPod secrets",
	}

	secretCmd.AddCommand(NewSecretSetCmd())
	secretCmd.AddCommand(NewSecretListCmd())
	secretCmd.AddCommand(NewSecretDeleteCmd())

	return secretCmd
}

func NewSecretSetCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "set NAME VALUE",
		Short: "Set a secret",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			return setSecret(cmd.Context(), args[0], args[1], cmd)
		},
	}

	cmd.Flags().String("scope", "global", "Scope of the secret (global, provider, workspace)")
	cmd.Flags().String("target", "", "Target provider or workspace name when scope is not global")
	cmd.Flags().String("description", "", "Description of the secret")

	return cmd
}

func NewSecretListCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List all secrets",
		RunE: func(cmd *cobra.Command, args []string) error {
			return listSecrets(cmd.Context(), cmd)
		},
	}

	cmd.Flags().String("scope", "", "Filter by scope (global, provider, workspace)")
	cmd.Flags().String("target", "", "Filter by target")

	return cmd
}

func NewSecretDeleteCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "delete NAME",
		Short: "Delete a secret",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return deleteSecret(cmd.Context(), args[0], cmd)
		},
	}

	cmd.Flags().String("scope", "global", "Scope of the secret to delete")
	cmd.Flags().String("target", "", "Target provider or workspace name")

	return cmd
}

func setSecret(ctx context.Context, name, value string, cmd *cobra.Command) error {
	scopeStr, _ := cmd.Flags().GetString("scope")
	target, _ := cmd.Flags().GetString("target")
	description, _ := cmd.Flags().GetString("description")

	scope := secret.SecretScope(scopeStr)
	if scope != secret.ScopeGlobal && scope != secret.ScopeProvider && scope != secret.ScopeWorkspace {
		return fmt.Errorf("invalid scope: %s (must be global, provider, or workspace)", scopeStr)
	}

	if scope != secret.ScopeGlobal && target == "" {
		return fmt.Errorf("target is required when scope is %s", scope)
	}

	store, err := secret.LoadSecretStore()
	if err != nil {
		return err
	}

	sec := &secret.Secret{
		Name:        name,
		Value:       value,
		Scope:       scope,
		Target:      target,
		Description: description,
	}

	err = store.AddSecret(sec)
	if err != nil {
		return err
	}

	log.Default.Donef("Secret '%s' set successfully", name)
	return nil
}

func listSecrets(ctx context.Context, cmd *cobra.Command) error {
	scopeStr, _ := cmd.Flags().GetString("scope")
	targetStr, _ := cmd.Flags().GetString("target")

	store, err := secret.LoadSecretStore()
	if err != nil {
		return err
	}

	var scope *secret.SecretScope
	if scopeStr != "" {
		s := secret.SecretScope(scopeStr)
		scope = &s
	}

	var target *string
	if targetStr != "" {
		target = &targetStr
	}

	secrets := store.ListSecrets(scope, target)

	if len(secrets) == 0 {
		// don't output anything when there are no secrets let the client handle empty output
		return nil
	}

	fmt.Fprintf(os.Stdout, "%-30s %-15s %-20s %-40s\n", "NAME", "SCOPE", "TARGET", "DESCRIPTION")
	fmt.Fprintf(os.Stdout, "%-30s %-15s %-20s %-40s\n", "----", "-----", "------", "-----------")

	for _, sec := range secrets {
		target := sec.Target
		if target == "" {
			target = "-"
		}
		desc := sec.Description
		if desc == "" {
			desc = "-"
		}
		fmt.Fprintf(os.Stdout, "%-30s %-15s %-20s %-40s\n", sec.Name, sec.Scope, target, desc)
	}

	return nil
}

func deleteSecret(ctx context.Context, name string, cmd *cobra.Command) error {
	scopeStr, _ := cmd.Flags().GetString("scope")
	target, _ := cmd.Flags().GetString("target")

	scope := secret.SecretScope(scopeStr)
	if scope != secret.ScopeGlobal && scope != secret.ScopeProvider && scope != secret.ScopeWorkspace {
		return fmt.Errorf("invalid scope: %s", scopeStr)
	}

	store, err := secret.LoadSecretStore()
	if err != nil {
		return err
	}

	err = store.DeleteSecret(name, scope, target)
	if err != nil {
		return err
	}

	log.Default.Donef("Secret '%s' deleted successfully", name)
	return nil
}

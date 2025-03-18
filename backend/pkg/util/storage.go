package util

import (
	"os"
	consts "social/backend/pkg/consts"
)

// InitializeStorage ensures the storage directory exists
func InitializeStorage() error {
	// Create base storage directory if it doesn't exist
	if err := os.MkdirAll(consts.STORAGE, 0755); err != nil {
		return err
	}
	return nil
}

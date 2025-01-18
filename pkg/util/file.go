package util

import (
	"fmt"
	"forum/pkg/consts"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

type File struct {
	FileContent multipart.File
	FileHeader  *multipart.FileHeader
	Name        string `json:"name"`
	Path        string `json:"path"`
	Ext         string `json:"ext"`
}

func NewFile(file multipart.File, header *multipart.FileHeader, name string) *File {
	return &File{
		FileContent: file,
		FileHeader:  header,
		Name:        name,
		Path:        filepath.Join(consts.STORAGE, name),
		Ext:         filepath.Ext(name),
	}
}

func (f *File) Store() error {
	file, err := os.Create(f.Path)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	if _, err = io.Copy(file, f.FileContent); err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	return nil
}

func DeleteFile(path string) error {
	err := os.Remove(path)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

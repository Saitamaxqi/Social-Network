package requests

import (
	"errors"
	"fmt"
	"forum/pkg/models"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type Rules map[string][]string

func (r Rules) Validate(request *http.Request) error {
	for field, rules := range r {
		for _, rule := range rules {
			var value string
			if strings.Contains(rule, ":") {
				parts := strings.Split(rule, ":")
				rule = parts[0]
				value = parts[1]
			}
			switch rule {
			case "required":
				if request.FormValue(field) == "" {
					return errors.New(field + " is required")
				}
			case "email":
				email := request.FormValue(field)
				if email != "" {
					isEmail, _ := regexp.MatchString(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-\\']+\.[a-zA-Z]{2,}$`, email)
					if !isEmail {
						return errors.New(field + " must be a valid email address")
					}
				}
			case "password":
				password := request.FormValue(field)
				if password != "" {
					isPassword, _ := regexp.MatchString(`^[a-zA-Z\d@$!%.*?&]{8,}$`, password)
					if !isPassword {
						return errors.New(field + " must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number")
					}
				}
			case "integer":
				if request.FormValue(field) != "" {
					isInteger, _ := regexp.MatchString(`^\d+$`, request.FormValue(field))
					if !isInteger {
						return errors.New(field + " must be an integer")
					}
				}
			case "boolean":
				if request.FormValue(field) != "" {
					isBoolean, _ := regexp.MatchString(`^(true|false|1|0)$`, request.FormValue(field))
					if !isBoolean {
						return errors.New(field + " must be a boolean")
					}
				}
			case "datetime":
				if request.FormValue(field) != "" {
					isDatetime, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$`, request.FormValue(field))
					if !isDatetime {
						return errors.New(field + " must be a datetime")
					}
				}
			case "before":
				if request.FormValue(field) != "" {
					fieldDate, err := time.Parse("2006-01-02 15:04:05", request.FormValue(field))
					if err != nil {
						return errors.New(field + " must be a datetime")
					}
					valueDate, err := time.Parse("2006-01-02 15:04:05", value)
					if err != nil {
						return errors.New(field + " must be a datetime")
					}

					if fieldDate.After(valueDate) {
						return errors.New(field + " must be before " + value)
					}
				}
			case "after":
				if request.FormValue(field) != "" {
					fieldDate, err := time.Parse("2006-01-02 15:04:05", request.FormValue(field))
					if err != nil {
						return errors.New(field + " must be a datetime")
					}
					valueDate, err := time.Parse("2006-01-02 15:04:05", value)
					if err != nil {
						return errors.New(field + " must be a datetime")
					}

					if fieldDate.Before(valueDate) {
						return errors.New(field + " must be after " + value)
					}
				}
			case "min":
				number, err := strconv.Atoi(value)
				if err != nil {
					return errors.New("min value must be an integer")
				}
				if request.FormValue(field) != "" {
					if len(request.FormValue(field)) < number {
						return errors.New(field + " must be at least " + value + " characters")
					}
				}
			case "max":
				number, err := strconv.Atoi(value)
				if err != nil {
					return errors.New("max value must be an integer")
				}
				if request.FormValue(field) != "" {
					if len(request.FormValue(field)) > number {
						return errors.New(field + " must be at most " + value + " characters")
					}
				}
			case "greater":
				number, err := strconv.Atoi(value)
				if err != nil {
					return errors.New("greater_than value must be an integer")
				}
				if request.FormValue(field) != "" {
					n, err := strconv.Atoi(request.FormValue(field))
					if err != nil {
						return errors.New(field + " must be an integer")
					} else if n <= number {
						return errors.New(field + " must be greater than " + value)
					}
				}
			case "less":
				number, err := strconv.Atoi(value)
				if err != nil {
					return errors.New("less_than value must be an integer")
				}
				if request.FormValue(field) != "" {
					n, err := strconv.Atoi(request.FormValue(field))
					if err != nil {
						return errors.New(field + " must be an integer")
					} else if n >= number {
						return errors.New(field + " must be less than " + value)
					}
				}
			case "unique":
				if request.FormValue(field) != "" {
					table := strings.Split(value, ",")[0]
					column := strings.Split(value, ",")[1]

					count := 0

					err := models.DB.QueryRow(`SELECT COUNT(*) FROM `+table+` WHERE `+column+` = ?`, request.FormValue(field)).Scan(&count)
					if err != nil {
						return errors.New("error checking if " + field + " is unique")
					}

					if count > 0 {
						return errors.New(field + " already exists")
					}
				}
			case "exists":
				if request.FormValue(field) != "" {
					table := strings.Split(value, ",")[0]
					columns := strings.Split(value, ",")[1:]
			
					placeholders := make([]string, len(columns))
					args := make([]interface{}, len(columns))
					for i, col := range columns {
						placeholders[i] = col + " = ?"
						args[i] = request.FormValue(field)
					}
			
					query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE %s", table, strings.Join(placeholders, " OR "))
					
					var count int
					err := models.DB.QueryRow(query, args...).Scan(&count)
					if err != nil {
						return errors.New("error checking if " + field + " exists")
					}
			
					if count == 0 {
						return errors.New(field + " does not exist")
					}
				}
			
			case "in":
				if request.FormValue(field) != "" {
					values := strings.Split(value, ",")
					found := false
					for _, v := range values {
						if request.FormValue(field) == v {
							found = true
						}
					}
					if !found {
						return errors.New(field + " must be one of: " + value)
					}
				}
			case "array":
				if request.FormValue(field) != "" {
					minV, err := strconv.Atoi(strings.Split(value, ",")[0])
					if err != nil {
						return errors.New("array min value must be an integer")
					}
					maxV, err := strconv.Atoi(strings.Split(value, ",")[1])
					if err != nil {
						return errors.New("array max value must be an integer")
					}
					values := strings.Split(strings.TrimSpace(request.FormValue(field)), ",")
					if len(values) < minV || len(values) > maxV {
						return errors.New(field + " must have between " + value + " items")
					}
				}
			case "file":
				_, _, err := request.FormFile(field)
				if err == nil {
					parts := strings.Split(value, ";")
					size := strings.Split(parts[0], ",")[0]
					allowedExtensions := strings.Split(parts[1], ",")
					maxSize, err := strconv.Atoi(size)
					if err != nil {
						return errors.New("file max size must be an integer")
					}

					file, header, err := request.FormFile(field)
					if err != nil {
						return errors.New("error getting file")
					}
					defer file.Close()

					if header.Size > int64(maxSize*1024*1024) {
						return errors.New(field + " must be less than " + parts[0])
					}

					extension := filepath.Ext(header.Filename)
					if extension != "" {
						extension = extension[1:]
					} else {
						return errors.New(field + " must have an extension")
					}
					found := len(allowedExtensions) == 0

					for _, allowedExtension := range allowedExtensions {
						if extension == allowedExtension {
							found = true
						}
					}

					if !found {
						return errors.New(field + " must be one of: " + strings.Join(allowedExtensions, ", "))
					}
				}
			}
		}
	}
	return nil
}

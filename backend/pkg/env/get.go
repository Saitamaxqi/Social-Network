package env

func Get(key string) string {
	value, exists := variables[key]

	if !exists {
		return ""
	}

	return value
}

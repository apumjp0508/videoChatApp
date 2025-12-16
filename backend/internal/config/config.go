package config

import (
    "log"
    "net/http" 
    "os"
    "strings"
    "strconv" 

    "github.com/joho/godotenv"
)

type Config struct {
    Port         string
    CorsOrigins  []string
    CorsMethods  []string
    CorsHeaders  []string
    CorsExpose   []string
    CorsCredentials bool
	JwtSecret       string 
    SessionPath     string
    SessionHttpOnly bool
    SessionSecure   bool
    SessionSameSite http.SameSite
    SessionMaxAge   int
    SessionSecretKey string
}

func Load() *Config {
    _ = godotenv.Load()

    sameSiteStr := getEnv("SESSION_SAMESITE", "Lax")
    sameSite := http.SameSiteLaxMode
    switch sameSiteStr {
    case "Strict":
        sameSite = http.SameSiteStrictMode
    case "None":
        sameSite = http.SameSiteNoneMode
    }

    maxAge := 86400 * 7 // デフォルト1週間
    if val := getEnv("SESSION_MAXAGE", "604800"); val != "" {
        if parsed, err := strconv.Atoi(val); err == nil {
            maxAge = parsed
        }
    }

    cfg := &Config{
        Port:            getEnv("PORT", "8080"),
        CorsOrigins:     split(getEnv("CORS_ORIGINS", "http://localhost:3000,https://172.20.10.2:3001")),
        CorsMethods:     split(getEnv("CORS_METHODS", "GET,POST,PUT,DELETE")),
        CorsHeaders:     split(getEnv("CORS_HEADERS", "Origin,Content-Type,Authorization")),
        CorsExpose:      split(getEnv("CORS_EXPOSE", "Content-Length")),
        CorsCredentials: getEnv("CORS_CREDENTIALS", "true") == "true",
		JwtSecret:       getEnv("JWT_SECRET", "your-default-secret"), 

        SessionPath:     getEnv("SESSION_PATH", "/"),
        SessionHttpOnly: getEnv("SESSION_HTTPONLY", "true") == "true",
        SessionSecure:   getEnv("SESSION_SECURE", "false") == "true",
        SessionSameSite: sameSite,
        SessionMaxAge:   maxAge,
        SessionSecretKey: getEnv("SESSION_SECRET_KEY", "default-fallback-key"),

    }
    if cfg.Port == "" {
        log.Fatal("PORT must be set")
    }
    return cfg
}

func getEnv(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}

func split(v string) []string {
    parts := strings.Split(v, ",")
    out := make([]string, 0, len(parts))
    for _, p := range parts {
        s := strings.TrimSpace(p)
        if s != "" {
            out = append(out, s)
        }
    }
    return out
}



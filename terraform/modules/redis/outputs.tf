output "host" {
  description = "IP privada de Redis. Va en REDIS_HOST del backend."
  value       = google_redis_instance.redis.host
}

output "port" {
  description = "Puerto de Redis (siempre 6379)."
  value       = google_redis_instance.redis.port
}

terraform {
  required_version = ">= 1.5.0"
}

variable "project_name" { default = "datebuk" }

# Replace with AWS/GCP/Azure modules when choosing cloud provider.
output "next_steps" {
  value = "Add managed PostgreSQL, Redis, object storage, CDN, and container runtime modules."
}

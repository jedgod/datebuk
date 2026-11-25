# Local production secrets

Never commit files placed here. Required local layout:

```text
secrets/apple/AuthKey.p8
secrets/firebase/firebase-service-account.json
secrets/android/datebuk-release.keystore
secrets/android/keystore-password.txt
secrets/android/key-password.txt
secrets/postgres/password.txt
secrets/runtime/jwt-secret.txt
secrets/runtime/refresh-token-pepper.txt
secrets/turn/shared-secret.txt
```

Use a managed secret store in deployed environments. Docker Compose mounts these files read-only under `/run/secrets`.

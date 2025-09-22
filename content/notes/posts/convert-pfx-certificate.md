---
title: "Convert PFX Certificate to Key and CRT Files"
date: 2025-08-02
lastmod: 2025-08-30
draft: false
tags: ["certificates", "openssl", "security"]
categories: ["technical-notes"]
---

Converting a PFX certificate to separate key and crt files using OpenSSL.

## Extract Public Certificate (.crt)

```bash
openssl pkcs12 -in domain.pfx -clcerts -nokeys -out domain.crt
```

You'll be prompted for the PFX file password.

## Extract Private Key (Encrypted)

```bash
openssl pkcs12 -in domain.pfx -nocerts -out domain.key
```

This extracts the private key with password protection. You'll need to enter the PFX password and set a new password for the key.

## Decrypt Private Key (Optional)

```bash
openssl rsa -in domain.key -out domain.key
```

Some services require an unencrypted key. Use with caution and store securely.

## Notes

- **Requirements**: OpenSSL must be installed on your system
- **Testing Environment**: 
  - OS: AlmaLinux
  - OpenSSL Version: 3.4.1 (11 Feb 2025)
- Replace `domain.pfx`, `domain.crt`, and `domain.key` with your actual filenames
- Ensure unencrypted private keys are securely managed
- Verify compatibility with your target systems before deployment

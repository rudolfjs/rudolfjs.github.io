---
title: "Access Podman from Another WSL Instance"
date: 2025-08-31T09:13:07+10:00
lastmod: 2025-08-31T09:13:07+10:00
categories: ["platform-engineering"]
tags: ["podman", "container", "wsl"]
draft: false
---

When [Podman Desktop](https://podman-desktop.io/) is installed on Windows, it creates a dedicated WSL distribution called `podman-machine-default` to run containers. This guide will allow you to configure a separate WSL distribution (e.g. `AlmaLinux-9`) to connect to and use that existing Podman machine, allowing you to run Podman commands from multiple WSL distributions while sharing the same container runtime.

### Environment

- Windows with WSL2 enabled
- Podman Desktop installed with `podman-machine-default` running
- AlmaLinux-9 WSL distribution installed

### Step 1: Identify Podman Machine Mode

From Windows PowerShell, check if your Podman machine is running in rootful or rootless mode:

```powershell
podman system connection list
```

Look for the connection marked as `Default = true`. If it ends with `-root`, you're using rootful mode.

### Step 2: Start AlmaLinux-9 WSL Session

```powershell
wsl --distribution AlmaLinux-9
```

### Step 3: Install Podman Remote Client

Install the podman-remote package from AlmaLinux repositories:

```bash
sudo dnf install -y podman-remote
```

### Step 4: Configure Podman System Connection

For rootful mode (most common):

```bash
podman system connection add \
  --default \
  podman-machine-default-root \
  unix:///mnt/wsl/podman-sockets/podman-machine-default/podman-root.sock
```

For rootless mode:

```bash
podman system connection add \
  --default \
  podman-machine-default-user \
  unix:///mnt/wsl/podman-sockets/podman-machine-default/podman-user.sock
```

### Step 5: Configure User Group Membership

For rootful Podman, add your user to the `wheel` group (GID 10):

```bash
# Add user to wheel group
sudo usermod --append --groups wheel $(whoami)

# Exit to apply group changes
exit
```

Restart your AlmaLinux-9 session:

```powershell
wsl --distribution AlmaLinux-9
```

### Step 6: Verify Configuration

Run these commands to verify the setup:

```bash
# Verify group membership
groups

# Check system connections
podman system connection list

# Verify podman version (should show both Client and Server)
podman version

# Test with a container
podman run quay.io/podman/hello

# List containers
podman ps -a
```

### Troubleshooting

**Permission Denied on Socket:**
```bash
ls -l /mnt/wsl/podman-sockets/podman-machine-default/podman-root.sock
id -nG
```

**Connection Refused:**
```powershell
# From Windows PowerShell
podman machine list
podman machine start podman-machine-default
```

**Socket Not Found:**
```powershell
# From Windows PowerShell - restart WSL
wsl --shutdown
wsl --distribution AlmaLinux-9
```

### Notes

1. **Architecture:** AlmaLinux-9 acts as a Podman client only, not running a separate Podman daemon
2. **Shared Runtime:** All containers are managed by the `podman-machine-default` VM, visible from both Windows and AlmaLinux-9
3. **Socket Type:** Uses Unix sockets via WSL's shared mount point (`/mnt/wsl/`), not SSH connections
4. **Group Membership:** The wheel group (GID 10) is required for rootful mode; for rootless mode, use your user's primary group (typically GID 1000)

## Reference

- [Accessing Podman from another WSL distribution - Podman Desktop Documentation](https://podman-desktop.io/docs/podman/accessing-podman-from-another-wsl-instance)

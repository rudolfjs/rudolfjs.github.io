---
title: "Zellij + tmux + Cloudflared for Remote Development"
date: 2025-09-02T10:07:30+10:00
lastmod: 2025-09-02T10:07:30+10:00
description: "A remote development solution in terminal using Zellij, tmux and Cloudflared"
categories: ["platform-engineering"]
tags: ["cloudflare","tmux","zellij","remote dev"]
draft: true
---

# Environment

1. AlmaLinux 9.6 (Sage Margay)
2. Zellij
3. tmux
4. Cloudflared


## Install tmux

`sudo dnf -y install tmux`

## Install Zellij

Zellij is a modern terminal workspace and multiplexer written in Rust.

### Download and Install

1. Create a local bin directory for user installations:
```bash
mkdir -p ~/.local/bin
```

2. Download Zellij for Linux:
```bash
cd /tmp
wget https://github.com/zellij-org/zellij/releases/download/v0.43.1/zellij-x86_64-unknown-linux-musl.tar.gz
```

3. Extract and install the binary:
```bash
tar -xvf zellij-x86_64-unknown-linux-musl.tar.gz
chmod +x zellij
mv zellij ~/.local/bin/
```

4. Add the local bin directory to your PATH:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

5. Verify the installation:
```bash
zellij --version
# Output: zellij 0.43.1
```

### First Run

Start Zellij with:
```bash
zellij
```

Or attach to an existing session:
```bash
zellij attach
```

## Install Cloudflared

-

## Notes

- 

## References

1. https://www.redhat.com/en/blog/introduction-tmux-linux
2. https://github.com/zellij-org/zellij
3. https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
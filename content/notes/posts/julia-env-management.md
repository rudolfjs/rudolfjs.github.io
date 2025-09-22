---
title: "Julia Environment Management with Isolated Binaries"
date: 2025-09-22T12:21:39+10:00
lastmod: 2025-09-22T12:21:39+10:00
description: "Creating completely isolated Julia environments with project-local binaries and packages"
categories: ["technical-notes"]
tags: ["julia", "environment", "reproducibility"]
draft: false
---

# Environment

1. Fedora Linux 42
2. JuliaUp (for managing multiple Julia installations)
3. Julia 1.11.7

## Setup Isolated Julia Environment

### 1. Download Binary to Project

Download and extract Julia binary to project folder:

```bash
wget https://julialang-s3.julialang.org/bin/linux/x64/1.11/julia-1.11.7-linux-x86_64.tar.gz && \
mkdir -p .julia && tar -xzf julia-1.11.7-linux-x86_64.tar.gz -C .julia --strip-components=1 && \
rm julia-1.11.7-linux-x86_64.tar.gz
```

**Important**: Add `.julia` to `.gitignore` (see [Package Storage Location](#package-storage-location) for details)

### 2. Link Binary to JuliaUp

Register the local binary with juliaup (example for "foo" project):

```bash
juliaup link foo .julia/bin/julia
```

Verify:
```bash
juliaup list
# Should show: foo -> .julia/bin/julia
```

### 3. Create Project Environment

Start Julia with the isolated binary:
```bash
julia +foo
```

Activate project environment:

```julia
] activate .
```

Or programmatically:

```julia
using Pkg
Pkg.activate(".")
```

This creates `Project.toml` and `Manifest.toml` in your project root.

### 4. Install Packages

With environment activated:
```julia
] add DataFrames CSV Plots
```

## Using the Environment

Always specify both the binary channel and project:
```bash
julia +foo --project
```

Or set alias:
```bash
alias julia-project='julia +foo --project'
```

## Package Storage Location

**Note**: Packages are stored in `~/.julia/packages/` by default, not in the project `.julia/` folder. The project `.julia/` contains only the Julia binary. `Project.toml` and `Manifest.toml` are in the project root.

Your `.gitignore` only needs:

```text
.julia
```

For completely isolated package storage (rarely needed):

```bash
export JULIA_DEPOT_PATH="$(pwd)/.julia"
julia +foo --project
```

## Project Structure

```
my-project/
├── .julia/             
│   ├── bin/
│   ├── lib/
│   └── share/
├── Project.toml         
├── Manifest.toml        
└── .gitignore           
```

## Reproducing Environment

On new machine:
1. Clone repository
2. Download same Julia binary version
3. Link with juliaup
4. Instantiate packages:

```bash
julia +project-name --project -e 'using Pkg; Pkg.instantiate()'
```

## References

1. [Julia Downloads](https://julialang.org/downloads/)
2. [JuliaUp Documentation](https://github.com/JuliaLang/juliaup)
3. [Pkg.jl Documentation](https://pkgdocs.julialang.org/)
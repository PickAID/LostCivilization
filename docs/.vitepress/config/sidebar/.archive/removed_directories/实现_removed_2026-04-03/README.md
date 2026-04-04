# Archived Directory: 实现

**Archive Date**: 2026-04-03T16:21:30.091Z
**Original Location**: Implementation/实现
**Reason**: Physical directory no longer exists in docs structure

## Contents
This archive contains both the configuration files and metadata for a directory that was removed from the physical docs structure.

- `config/` - Contains the JSON configuration files (locales.json, order.json, etc.)
- `metadata/` - Contains the metadata files tracking configuration history

## Restoration
To restore this directory:

1. **Recreate the physical directory**: 
   `mkdir -p docs/zh-CN/Implementation/实现/`

2. **Restore configuration files**:
   `cp -r config/实现/ .vitepress/config/sidebar/zh-CN/Implementation/实现/`

3. **Restore metadata files**:
   `cp -r metadata/实现/ .vitepress/config/sidebar/.metadata/zh-CN/Implementation/实现/`

4. **Restart the development server**

## Archive Structure
```
实现_removed_2026-04-03/
├── README.md (this file)
├── config/实现/     # Original config files
└── metadata/实现/   # Original metadata files
```

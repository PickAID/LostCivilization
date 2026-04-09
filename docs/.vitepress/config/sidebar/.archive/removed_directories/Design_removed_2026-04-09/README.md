# Archived Directory: Design

**Archive Date**: 2026-04-09T05:27:21.645Z
**Original Location**: Design/Design
**Reason**: Physical directory no longer exists in docs structure

## Contents
This archive contains both the configuration files and metadata for a directory that was removed from the physical docs structure.

- `config/` - Contains the JSON configuration files (locales.json, order.json, etc.)
- `metadata/` - Contains the metadata files tracking configuration history

## Restoration
To restore this directory:

1. **Recreate the physical directory**: 
   `mkdir -p docs/en-US/Design/Design/`

2. **Restore configuration files**:
   `cp -r config/Design/ .vitepress/config/sidebar/en-US/Design/Design/`

3. **Restore metadata files**:
   `cp -r metadata/Design/ .vitepress/config/sidebar/.metadata/en-US/Design/Design/`

4. **Restart the development server**

## Archive Structure
```
Design_removed_2026-04-09/
├── README.md (this file)
├── config/Design/     # Original config files
└── metadata/Design/   # Original metadata files
```

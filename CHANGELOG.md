
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-nginx" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file

---

## [0.2.0] - (05-03-2021)

### Initial Release (MVP)

- Manage multiple nim instances with basic auth, secure password caching and SSL encryption
- Inventory/Instances 
  - List instances and files
  - indicate modified file status
  - open, edit and save config file
  - saving config file pushes changes back to nim
  - button to tell nim to publish config file change to instance
- scan
  - Show scan details
  - manage scan settings
  - list servers discovered from scan
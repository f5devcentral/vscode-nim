
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-nginx" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file

---

## [0.4.0] - (05-06-2021)

### Modified

- fixed publish button on top right of editor

---

## [0.3.0] - (05-05-2021)

### Modified

- Updated icons for NIM instance, NGINX, and NGINX+ instances
- Updated icons for creating, analyzing, and publishing files
- Updated icons for starting scan and deleting discovered servers from scan
- Started adding file create functionality
- Started adding start scan funcitonality
  
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
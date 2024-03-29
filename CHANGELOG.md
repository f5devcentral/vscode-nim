
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the "vscode-nginx" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file

---

## [0.6.0] - (10-28-2021)

### Added

- added reset button like NIM UI
  - This button tells NIM to pull all new configs from instance

---

## [0.5.0] - (05-17-2021)

### Added/Modified

- updated more icons
- failed auth response now clears password and disconnects
- Add host button
  - accepts user@host format for easy add
- Fixed host remove button
- Fixed host edit function
- updating most naming from nginx to nim

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
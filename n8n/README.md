# This folder will sync with n8n workflows for version control and backup

## PURPOSE
1. Act as a backup for all workflows on n8n
2. Provide historical reference for all workflows I've created and used incase I need to rollback
3. Facilitate easy transfer to a different server, etc.

### WORKFLOW
* Automated sync runs every X hours
* Uses the n8n node to get workflows
* Checks if file name does not exist and if not, creates a file
* If file name exists, edit the existing workflow

`` Check out the n8n Workflows - Github workflow for more ``

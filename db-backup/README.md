# Database Backup Instructions

## Creating a Database Backup

Follow these steps to create a backup of your MongoDB database before submission:

### Step 1: Ensure MongoDB is Running

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Step 2: Create Database Backup

Navigate to your project root directory and run:

```bash
# Navigate to project root
cd C:\Users\mrudu\OneDrive\Desktop\SEM5\React2\React

# Create backup of eduforge database
mongodump --db eduforge --out ./db-backup
```

This will create a folder structure:
```
db-backup/
└── eduforge/
    ├── courses.bson
    ├── courses.metadata.json
    ├── users.bson
    ├── users.metadata.json
    ├── enrollments.bson
    ├── enrollments.metadata.json
    └── ... (other collections)
```

### Step 3: Verify Backup

Check that the `db-backup/eduforge/` folder contains `.bson` and `.metadata.json` files:

```bash
# Windows PowerShell
Get-ChildItem -Path .\db-backup\eduforge -Recurse

# Linux/Mac
ls -la ./db-backup/eduforge/
```

## Restoring the Database (For Reviewers/Testers)

To restore this database on another machine:

### Step 1: Start MongoDB

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Step 2: Restore Database

```bash
# Navigate to project root
cd <path-to-project>/React

# Restore the database
mongorestore --db eduforge ./db-backup/eduforge
```

### Step 3: Verify Restoration

```bash
# Connect to MongoDB
mongosh

# Switch to eduforge database
use eduforge

# List all collections
show collections

# Check document count
db.courses.countDocuments()
db.users.countDocuments()
db.enrollments.countDocuments()

# Exit MongoDB shell
exit
```

## Alternative: Using Seed Scripts

If you prefer to use seed scripts instead of database dumps:

```bash
# Navigate to backend folder
cd eduforge-server

# Run seed script
npm run seed:courses
```

This will populate the database with dummy data.

## Backup to a Specific Date/Time

To include timestamp in backup:

```bash
# Windows PowerShell
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
mongodump --db eduforge --out "./db-backup-$date"

# Linux/Mac
mongodump --db eduforge --out "./db-backup-$(date +%Y-%m-%d-%H%M)"
```

## Backup Specific Collections Only

If you want to backup only specific collections:

```bash
# Backup only courses collection
mongodump --db eduforge --collection courses --out ./db-backup

# Backup only users collection
mongodump --db eduforge --collection users --out ./db-backup
```

## Important Notes

- **Always create a backup before submission**
- **Include the `db-backup/` folder in your ZIP file**
- **DO NOT include actual `.env` files with passwords**
- **Test the restore process on a different machine before final submission**

## Troubleshooting

### "mongodump command not found"

Make sure MongoDB tools are installed and added to PATH:
- Download from: https://www.mongodb.com/try/download/database-tools
- Add to system PATH environment variable

### "Failed to connect to MongoDB"

- Ensure MongoDB service is running
- Check if MongoDB is listening on default port 27017
- Verify connection string

### "Authentication failed"

If your MongoDB requires authentication:

```bash
mongodump --db eduforge --username your_username --password your_password --out ./db-backup
```

---

**Last Updated:** November 17, 2025

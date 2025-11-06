# Deployment Guide

## Dual Environment Setup

This repository is configured to deploy two separate builds to GitHub Pages:

### 🟢 Production Environment
- **Branch**: `main`
- **URL**: https://mushi-mushi.github.io/udm_explorer/
- **Trigger**: Push to `main` branch or manual workflow dispatch

### 🟡 Alpha Environment
- **Branch**: `alpha`
- **URL**: https://mushi-mushi.github.io/udm_explorer/alpha/
- **Trigger**: Push to `alpha` branch or manual workflow dispatch

## How It Works

1. **Automated Deployment**: GitHub Actions automatically builds and deploys when you push to either `main` or `alpha` branch
2. **Separate Paths**: Both deployments are hosted on the same GitHub Pages site but in different subdirectories
3. **Independent Builds**: Each branch can have different code, allowing you to test changes in alpha before promoting to production

## Workflow

### Deploying to Alpha
```bash
# Make changes on a feature branch
git checkout -b feature/my-feature

# Commit your changes
git add .
git commit -m "Add new feature"

# Merge to alpha for testing
git checkout alpha
git merge feature/my-feature
git push origin alpha
```

### Promoting Alpha to Production
```bash
# Once alpha is tested and stable
git checkout main
git merge alpha
git push origin main
```

## Manual Deployment

You can manually trigger a deployment from GitHub:
1. Go to **Actions** tab in your repository
2. Select **Deploy UDM Explorer to GitHub Pages**
3. Click **Run workflow**
4. Choose the branch (main or alpha)

## Environment Detection

The build process sets `REACT_APP_ENVIRONMENT` environment variable:
- `production` for main branch
- `alpha` for alpha branch

You can use this in your React app:
```javascript
if (process.env.REACT_APP_ENVIRONMENT === 'alpha') {
  console.log('Running in Alpha environment');
}
```

## First-Time Setup

If you haven't created the `alpha` branch yet:
```bash
# Create alpha branch from main
git checkout main
git checkout -b alpha
git push -u origin alpha
```

## Troubleshooting

### GitHub Pages not enabled
1. Go to repository **Settings** > **Pages**
2. Source should be set to **Deploy from a branch**
3. Select branch: `gh-pages` and folder: `/ (root)`

### Deployment fails
- Check the **Actions** tab for error logs
- Ensure GitHub Pages is enabled in repository settings
- Verify the `GITHUB_TOKEN` has proper permissions

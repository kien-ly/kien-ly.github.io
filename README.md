# Kien Ly's Portfolio & Blog

Welcome to the source code of my personal portfolio and blog. This project is built using [Hugo](https://gohugo.io/), one of the most popular open-source static site generators, and styled with a customized [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

## 🚀 Features

- **GitHub README-Style Homepage**: A modern, interactive professional summary with dynamic coding style sections and GitHub analytics.
- **Dark/Light Mode**: Automatic and manual switching, integrated seamlessly.
- **Fast Search**: Built-in full-text search powered by Fuse.js.
- **Categorization**: Built-in Tags functionality for easy content discovery.
- **Automated Deployment**: CI/CD pipeline using GitHub Actions to build and deploy to GitHub Pages automatically.

---

## 🛠️ Prerequisites

To run and test this project locally, you need to have the following installed on your machine:

1. **Git**
2. **Hugo Extended Version** (v0.146.0 or greater is required by the PaperMod theme).
   - *macOS*: `brew install hugo`
   - *Windows*: `choco install hugo-extended`
   - *Linux*: `sudo apt install hugo` (or via snap/brew)
   
   Verify installation:
   ```bash
   hugo version
   ```

---

## 💻 Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kien-ly/kien-ly.github.io.git
   cd kien-ly.github.io
   ```

2. **Run the local development server:**
   ```bash
   hugo server -D
   ```
   *The `-D` flag tells Hugo to also render drafts.*

3. **View the site:**
   Open your browser and navigate to `http://localhost:1313/`

Any changes you make to the files will automatically reload the browser.

---

## 📝 Adding New Content

### Creating a New Blog Post

To create a new blog post, run the following command from the root directory:

```bash
hugo new posts/my-new-post.md
```

This will create a new markdown file in `content/posts/`. Open the file and update the metadata (front matter):

```yaml
---
title: "My New Post"
date: 2026-03-14T10:00:00+07:00
draft: true
description: "A brief description of the post."
tags: ["data", "engineering"]
---

Write your content here...
```
*Note: Once you are ready to publish, set `draft: false` before pushing to GitHub.*

### Adding a New Project or News

Similarly, you can add content to other sections:

- **Projects**: `hugo new projects/my-project.md`
- **News**: `hugo new news/announcement.md`

### Updating Your Resume (CV)
To modify your professional CV, edit the `content/mycv.md` file.

### Editing the Homepage (About Me)
The dynamic "About Me" and "Tech Stack" section on the homepage is configured in `content/home_about.md`.

---

## 🧪 Testing

Before pushing your code to the live server, you should verify that the site builds correctly without errors:

1. Run the build command:
   ```bash
   hugo
   ```
2. Check the terminal output. If you see `Environment: "production"`, `Pages`, and `Static Files` generated successfully without any `ERROR` logs, your site is clean.

---

## 🚢 Deployment

This site uses **GitHub Actions** for continuous deployment. 

1. Simply commit your changes and push to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: new blog post"
   git push origin main
   ```
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically trigger, build the Hugo site, and publish the HTML artifacts directly to GitHub Pages.

---

## 📄 License

This repository's custom content is copyright © Kien Ly. The theme code is based on [PaperMod](https://github.com/adityatelange/hugo-PaperMod) which is licensed under the MIT License.

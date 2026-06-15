---
title: Neet Telegram Bot
emoji: 🤖
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Telegram AI Project Architect Bot

This is a Telegram bot that allows users to generate full multi-file projects using AI and automatically commit them to a GitHub repository.

## Features

- **Multi-file Project Generation**: Uses the Gemini CLI to architect and generate multiple files based on a single user prompt.
- **GitHub Integration**: Automatically commits the generated files to a specified GitHub repository as a batch.
- **Telegram Interface**: Easy-to-use bot interface for project creation.

## Prerequisites

- Node.js installed on your machine.
- [Gemini CLI](https://github.com/google/gemini-cli) installed and configured.
- A Telegram Bot Token (from [BotFather](https://t.me/botfather)).
- A GitHub Personal Access Token (with repo scope).

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd telegram
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GITHUB_TOKEN=your_github_token
   GITHUB_OWNER=your_github_username_or_org
   GITHUB_REPO=your_target_repository_name
   GITHUB_BRANCH=main
   ```

## Usage

1. **Start the bot**:
   ```bash
   node index.js
   ```

2. **Interact with the bot on Telegram**:
   - Send `/start` to see the welcome message.
   - Send a prompt describing the project you want to build (e.g., "Build a React app with a Navbar, Hero section, and a Footer").
   - The bot will generate the files and provide a link to the GitHub commit.

## Project Structure

- `index.js`: Main entry point for the Telegram bot.
- `ai-handler.js`: Handles communication with the Gemini CLI for project generation.
- `github-handler.js`: Handles batch committing files to GitHub using Octokit.
- `package.json`: Project dependencies and scripts.

## License

ISC

declare namespace App {
  interface Locals {
    // Directory of the post being rendered, relative to the project root
    // ("content/post/2026/ai-agent-first-dotfiles"). Read by <Partial>.
    postDir: string;
  }
}

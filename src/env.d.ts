declare namespace App {
  interface Locals {
    // Directory of the post being rendered, relative to the project root
    // ("sample/post/2026/ai-agent-first-dotfiles"). Read by <Partial>.
    postDir: string;
  }
}

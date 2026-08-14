export type GitHubConnectionStatus = {
  connected: boolean;
  login: string;
};

export function getGitHubConnectionMessage(status: GitHubConnectionStatus | null) {
  if (status?.connected) {
    return {
      title: `Connected to @${status.login}.`,
      detail: "This GitHub connection belongs only to this Nova AI workspace. You can disconnect it at any time.",
    };
  }

  return {
    title: "Connect your GitHub account.",
    detail: "Select Authorize GitHub, sign in to GitHub, and approve Nova AI. Your password stays with GitHub; Nova AI receives only the permission you approve.",
  };
}

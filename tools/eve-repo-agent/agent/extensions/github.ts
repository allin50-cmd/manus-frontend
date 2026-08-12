import githubExtension from "@github-tools/eve-extension";

export default githubExtension({
  preset: "code-review",
  context: {
    owner: "allin50-cmd",
    repo: "manus-frontend",
  },
});

import githubExtension from "@github-tools/eve-extension";

export default githubExtension({
  connector: "github/ultracore-eve",
  preset: "code-review",
});

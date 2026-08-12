import { connectGithubTools } from "@github-tools/sdk/connect/eve";

export default connectGithubTools("github/ultracore-eve", {
  preset: "maintainer",
});

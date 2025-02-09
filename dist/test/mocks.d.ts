export declare function mockGithubDeployments({ githubUser, githubRepoName, }: {
    githubUser: string;
    githubRepoName: string;
}): {
    handlers: import("msw").HttpHandler[];
};

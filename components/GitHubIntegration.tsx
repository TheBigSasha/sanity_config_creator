import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button } from "@mui/material";
import { useState } from "react";
import { SanityFieldProperties } from "../types/SanityFieldProperties";

interface GitHubIntegrationProps {
    onDismiss: () => void;
    onGotJSON: (json: SanityFieldProperties[]) => void;
}

const genrateGitHubURL = (username: string, reponame: string, branch: string) => {
    return `https://github.com/${username}/${reponame}/raw/${branch}/.sanity_codegen/schema.json`;
}

export const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({
    onGotJSON, onDismiss,
}) => {
    // URL example:
    // https://github.com/${username}/${reponame}/raw/main/.sanity_codegen/schema.json

    const [username, setUsername] = useState<string | undefined>();
    const [reponame, setReponame] = useState<string | undefined>();
    const [branch, setBranch] = useState<string | undefined>("main");

    const [error, setError] = useState<string | undefined>(undefined);

    const [loading, setLoading] = useState<boolean>(false);

    return (
        <Dialog open={true} onClose={onDismiss}>
            <DialogTitle>GitHub Integration</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Enter the GitHub repository URL to get started.
                </DialogContentText>
                <TextField
                    label="Repository URL"
                    value={genrateGitHubURL(username || "", reponame || "", branch || "")}
                    onChange={(e) => {
                        const url = new URL(e.target.value);
                        const path = url.pathname.split("/");
                        if (path.length >= 3) {
                            setUsername(path[1]);
                            setReponame(path[2]);
                            setBranch(path[4] || "main");
                        }
                    }}
                />
                <br />
                <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                    }}
                />
                <br />
                <TextField
                    label="Repository Name"
                    value={reponame}
                    onChange={(e) => {
                        setReponame(e.target.value);
                    }}
                />
                <br />
                <TextField
                    label="Branch"
                    value={branch}
                    onChange={(e) => {
                        setBranch(e.target.value);
                    }}
                />
                <br />
                {error && (
                    <DialogContentText>
                        {error}
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onDismiss}>Cancel</Button>
                <Button
                    onClick={() => {
                        if (username && reponame && branch) {
                            setLoading(true);
                            fetch(genrateGitHubURL(username, reponame, branch)).then((res) => {
                                if (res.ok) {
                                    res.json().then((json) => {
                                        onGotJSON(json);
                                        onDismiss();
                                    });
                                } else {
                                    setError("Error fetching schema");
                                }
                                setLoading(false);
                            });
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Load"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

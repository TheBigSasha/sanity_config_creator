import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button } from "@mui/material";
import { useState } from "react";
import { SanityFieldProperties } from "../types/SanityFieldProperties";
import { VscInfo } from "react-icons/vsc";

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
            <DialogTitle>GitHub Integration <Button onClick={() => {
                window.open("https://github.com/TheBigSasha/sanity_config_creator/blob/main/gh_integration.md", "_blank");
            }} variant={"text"}><VscInfo/></Button></DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Enter the GitHub repository URL to get started.
                </DialogContentText>
                <TextField
                    label="Username"
                    fullWidth={true}
                    value={username}
                    helperText={"The username of the owner of the repository IE TheBigSasha"}
                    onChange={(e) => {
                        setUsername(e.target.value);
                    }}
                />
                <br />
                <TextField
                    label="Repository Name"
                    value={reponame}
                    fullWidth={true}
                    helperText={"The name of the repository IE sanity_config_creator"}
                    onChange={(e) => {
                        setReponame(e.target.value);
                    }}
                />
                <br />
                <TextField
                    label="Branch"
                    fullWidth={true}
                    value={branch}
                    helperText={"The branch to fetch the schema from IE main"}
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
                    disabled={loading || !username || !reponame || !branch}
                >
                    {loading ? "Loading..." : "Load"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

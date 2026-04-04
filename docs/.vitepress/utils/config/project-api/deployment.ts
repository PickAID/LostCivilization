import { projectConfig } from "../../../config/project-config";
import type { DeploymentConfig } from "../project-types";

export function getDeploymentConfig(): DeploymentConfig {
    return projectConfig.deployment;
}

export function isDeploymentActive(
    type: "github-pages" | "server" | "custom",
): boolean {
    return projectConfig.deployment.type === type;
}

export function getActiveDeploymentType():
    | "github-pages"
    | "server"
    | "custom" {
    return projectConfig.deployment.type;
}

export function getServerDeploymentConfig() {
    return projectConfig.deployment.server;
}

export function getCustomDeploymentConfig() {
    return projectConfig.deployment.custom;
}

export function validateDeploymentConfig() {
    const deployment = projectConfig.deployment;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (deployment.type === "server") {
        if (!deployment.server.remotePath) {
            errors.push("Server deployment requires remotePath to be specified");
        }

        if (deployment.server.port < 1 || deployment.server.port > 65535) {
            errors.push(`Invalid SSH port: ${deployment.server.port}`);
        }

        warnings.push(
            "Ensure SSH_HOST, SSH_USERNAME, and SSH_PRIVATE_KEY secrets are configured in GitHub repository",
        );
    }

    if (deployment.type === "custom") {
        if (!deployment.custom.deployCommand) {
            errors.push("Custom deployment requires deployCommand to be specified");
        }
    }

    return {
        isValid: errors.length === 0,
        deploymentType: deployment.type,
        errors,
        warnings,
    };
}

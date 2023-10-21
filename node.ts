import { access } from "fs";
import ClientOAuth2 from "client-oauth2";

import mcc from "@mach-composer/mcc-sdk";

export type Credentials = {
  clientID: string;
  clientSecret: string;
  organization: string;
  project: string;
};

export class Client {
  private token: string;
  constructor(private credentials: Credentials) {}

  private getToken = async (): Promise<string> => {
    if (this.token) {
      return this.token;
    }
    const mccAuth = new ClientOAuth2({
      clientId: this.credentials.clientID,
      clientSecret: this.credentials.clientSecret,
      accessTokenUri: "https://auth.mach.cloud/oauth/token",
    });

    const token = await mccAuth.credentials.getToken();
    this.token = token.accessToken;
    return this.token;
  };

  public getLatestVersion = async (component: string) => {
    const response = await fetch(
      `https://api.mach.cloud/organizations/${this.credentials.organization}/projects/${this.credentials.project}/components/${component}/versions`,
      {
        headers: {
          Authorization: `Bearer ${await this.getToken()}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to fetch latest version");
    }
    const result = await response.json();
    if (!result.results.length) {
      return null;
    }
    return result.results[0].version;
  };
}

const client = new Client({
  clientID: "0dtaYT0mFeoSBFU3tbDN4FWeqP1nqklr",
  clientSecret:
    "Ss4Iv7G7pbI2ntqAbYOWdbemFhEeQQeZTxxmG9hz9SRuBzGvwbv2hG5cUxSa5OvH",
  organization: "lab-digital",
  project: "mach-commerce-accelerator",
});

const version = await client.getLatestVersion("page-resolver");
console.log(version);

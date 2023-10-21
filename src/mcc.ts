import ClientOAuth2 from "client-oauth2";

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
    const url = `https://api.mach.cloud/organizations/${this.credentials.organization}/projects/${this.credentials.project}/components/${component}/versions`;
    console.log("Request info from " + url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
    });
    if (!response.ok) {
      console.log(await response.text());
      throw new Error("Failed to fetch latest version");
    }
    const result = await response.json();
    if (!result.results.length) {
      return null;
    }
    return result.results[0].version;
  };
}

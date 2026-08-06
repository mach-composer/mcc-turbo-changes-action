# What is this?

This is a GitHub action which decides if a specific package (component) in a
monorepo is modified and needs to be built and published.

Under the hood it uses turborepo to determine if a package is modified since
the last release published to MACH Composer Cloud.

## Versions

Always pin to a major version ref (e.g. `@v2`) — never reference `main`, as it
can contain unreleased changes.

| Ref   | Runtime | Notes                                                                              |
| ----- | ------- | ---------------------------------------------------------------------------------- |
| `@v2` | Node 24 | **Recommended.** Adds the `allow_component_not_found` input and updated tooling.    |
| `@v1` | Node 20 | Previous stable release. Supports the `fallback_reference` input.                  |

```yaml
- uses: mach-composer/mcc-turbo-changes-action@v2
```

## Usage

```yaml
name: Build and publish
steps:
  - uses: actions/checkout@v3
    with:
      fetch-depth: 0

  - uses: mach-composer/mcc-turbo-changes-action@v2
    id: changes
    with:
      mcc_client_id: ${{ secrets.MCC_CLIENT_ID }}
      mcc_client_secret: ${{ secrets.MCC_CLIENT_SECRET }}
      mcc_organization: ${{ secrets.MCC_ORGANIZATION }}
      mcc_project: ${{ secrets.MCC_PROJECT }}
      config: |
        @commerce-backend/account:
          name: account
          extra-files: |
            backend/Dockerfile.node
            backend/services/account/terraform/*

        @commerce-backend/checkout:
          name: checkout
          extra-files: |
            backend/Dockerfile.node
            backend/services/checkout/terraform/*

  - name: Build and publish account
    if: contains(steps.changes.outputs.changes, '@commerce-backend/checkout')
    run: |
      cd backend/services/account
      pnpm build
      pnpm publish
```

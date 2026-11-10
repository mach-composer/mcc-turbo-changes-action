# What is this?

This is a GitHub action which decides if a specific package (component) in a
monorepo is modified and needs to be built and published.

Under the hood it uses turborepo to determine if a package is modified since
the last release published to MACH Composer Cloud.

## Versions

Pin to a release tag or a major version ref — never reference `main`, as it
can contain unreleased changes.

| Ref       | Runtime | Notes                                                                                                  |
| --------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `@v2.1.0` | Node 24 | **Latest release.** Security updates, `rolldown` bundle, `fallback_reference` and `allow_component_not_found` inputs. |
| `@v2`     | Node 24 | Moving major version branch, kept in sync with the latest `v2.x` release.                               |
| `@v1`     | Node 20 | Previous stable release. Supports the `fallback_reference` input.                                       |

We recommend pinning the commit SHA of a release tag with the version as a
comment (e.g. using [pinact](https://github.com/suzuki-shunsuke/pinact)):

```yaml
- uses: mach-composer/mcc-turbo-changes-action@df1592f1c08ed1d25b129f6937bd696e19049e06 # v2.1.0
```

### Releasing

`main` and `v2` point to the same commit. To release, tag the commit on `main`
and fast-forward the `v2` branch to it:

```sh
git tag -a v2.x.y -m "v2.x.y" && git push origin v2.x.y
git push origin main:v2
```

Always merge into `main` and fast-forward `v2` afterwards; never commit or
squash-merge directly into `v2`, otherwise the branches diverge.

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

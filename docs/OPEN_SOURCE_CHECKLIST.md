# Open Source Checklist

## Secrets and privacy
- Remove `.env` files and build outputs that contain secrets.
- Scrub sensitive data from Git history if secrets were committed.
- Ensure screenshots do not contain private content.

## Third-party licenses
- Review NPM and Rust dependency licenses for redistribution.
- Ship a `THIRD_PARTY_LICENSES.md` file with the release artifacts.

## Data handling
- Document local storage usage (SQLite, localStorage, files).
- State that data is not uploaded by default.

## External services
- Document default API endpoints as examples only.
- Require users to configure their own API keys.

## Release hygiene
- Bump version and update `docs/CHANGELOG.md`.
- Provide release notes and checksums.
- Keep build steps reproducible and documented.

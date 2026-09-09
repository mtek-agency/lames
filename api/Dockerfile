# syntax=docker/dockerfile:1

ARG GO_VERSION=1.27
ARG ALPINE_VERSION=3.20
ARG LITESTREAM_VERSION=0.5.17

# ---------------------------------------------------------------------------
# build: compile le binaire PocketBase custom (hook Go de stripping EXIF, §7.1)
# ---------------------------------------------------------------------------
FROM golang:${GO_VERSION}-alpine AS build
ARG TARGETARCH
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/root/go/pkg/mod go mod download
COPY main.go ./
RUN --mount=type=cache,target=/root/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -o /pocketbase .

# ---------------------------------------------------------------------------
# litestream: binaire prébuilt pour la réplication continue SQLite (§7.3)
# ---------------------------------------------------------------------------
FROM alpine:${ALPINE_VERSION} AS litestream
ARG TARGETARCH
ARG LITESTREAM_VERSION
RUN apk add --no-cache curl
RUN ARCH=$([ "$TARGETARCH" = "amd64" ] && echo x86_64 || echo arm64) \
    && curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-${ARCH}.tar.gz" \
       -o /tmp/litestream.tar.gz \
    && tar -xzf /tmp/litestream.tar.gz -C /usr/local/bin litestream \
    && rm /tmp/litestream.tar.gz

# ---------------------------------------------------------------------------
# runtime
# ---------------------------------------------------------------------------
FROM alpine:${ALPINE_VERSION}
RUN apk add --no-cache ca-certificates
WORKDIR /pb

COPY --from=build /pocketbase /pb/pocketbase
COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream
COPY pb_hooks /pb/pb_hooks
COPY pb_migrations /pb/pb_migrations
COPY litestream.yml /pb/litestream.yml
COPY entrypoint.sh /pb/entrypoint.sh
RUN chmod +x /pb/pocketbase /pb/entrypoint.sh

EXPOSE 8090

ENTRYPOINT ["/pb/entrypoint.sh"]

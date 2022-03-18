FROM rust
RUN rustup target add wasm32-unknown-unknown

RUN mkdir /opt/wabt && \
 curl -L https://github.com/WebAssembly/wabt/releases/download/1.0.27/wabt-1.0.27.tar.xz  | tar -xzf - -C /opt/wabt-1.0.27 --strip 1

ENV PATH="/opt/wabt:${PATH}"
WORKDIR /src

FROM arm32v7/node:13.5.0-buster-slim as builder

## Install build toolchain, install node deps and compile native add-ons
RUN apt-get update && apt-get upgrade
RUN apt-get install python make g++ -y
RUN apt-get install sqlite3

#COPY package.json /package.json
#RUN npm install

#RUN apt-get clean && rm -rf /var/lib/apt/lists/*

#FROM arm32v7/node:13.5.0-buster-slim as app

## Copy built node modules and binaries without including the toolchain
#COPY --from=builder /node_modules /node_modules
#COPY --from=builder /usr/bin/sqlite3 /usr/bin/sqlite3

#ENV NODE_PATH /node_modules

EXPOSE 9000

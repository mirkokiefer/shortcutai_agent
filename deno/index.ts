
// Start listening on port 8080 of localhost.
const server = Deno.listen({ port: 6006 });
console.log(`HTTP webserver running.  Access it at:  http://localhost:80/`);

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
    // In order to not be blocking, we need to handle each connection individually
    // without awaiting the function
    serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
    // This "upgrades" a network connection into an HTTP connection.
    const httpConn = Deno.serveHttp(conn);
    // Each request sent over the HTTP connection will be yielded as an async
    // iterator from the HTTP connection.
    for await (const requestEvent of httpConn) {
        const response = await handleRequest(requestEvent.request);
        requestEvent.respondWith(response);
    }
}

async function handleRequest(request: Request) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/deno")) {
        return new Response("Hello Deno Deploy!");
    }

    if (pathname.startsWith("/sadtalker")) {
        // python inference.py --driven_audio voice1.wav \
        //             --source_image face1a.png \
        //             --enhancer gfpgan 
        // wdir: /home/SadTalker

        const cmd = Deno.run({
            cmd: ["python", "inference.py", "--driven_audio", "voice1.wav", "--source_image", "full_body_2.png", "--enhancer", "gfpgan"],
            cwd: "/home/SadTalker",
            stdout: "piped",
            stderr: "piped",
        });

        // respond without waiting for process to finish - keep it running
        return new Response("Hello World!");

        

    }

    return new Response("Hello World!");
}
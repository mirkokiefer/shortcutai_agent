
async function fetchAndWriteToDisk(url: string, destinationPath: string) {
    const response = await fetch(url);
    const readableStream = response.body;
    if (!readableStream) {
        throw new Error("Failed to fetch readableStream");
    }

    const diskWritableStream = await Deno.open(destinationPath, {
        create: true,
        write: true,
    });

    await readableStream.pipeTo(diskWritableStream.writable);
    console.log(`File successfully written to ${destinationPath}`);
}

const destinationPath = "largefile.jpg";
const fileUrl = "https://i.pcmag.com/imagery/articles/02KW1KBEjvhGDCkfRNdcLxb-17..v1569486814.jpg";

await fetchAndWriteToDisk(fileUrl, destinationPath);
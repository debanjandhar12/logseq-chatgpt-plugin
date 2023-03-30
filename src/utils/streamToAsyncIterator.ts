export default function streamToAsyncIterator(readable: NodeJS.ReadableStream | ReadableStream): AsyncIterableIterator<Uint8Array> {
    // @ts-ignore
    const reader = readable.getReader();
    return {
        next() {
            return reader.read();
        },
        return() {
            try {
                reader.releaseLock();
                readable?.cancel();
            } catch (e) {
                console.log(e);
            }
            return true;
        },
        [Symbol.asyncIterator]() {
            return this;
        }
    } as any as AsyncIterableIterator<Uint8Array>;
}

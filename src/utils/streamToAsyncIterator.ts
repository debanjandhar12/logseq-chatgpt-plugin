export default function streamToAsyncIterator(readable : NodeJS.ReadableStream | ReadableStream) : AsyncIterableIterator<Uint8Array> {
    // @ts-ignore
    const reader = readable.getReader();
    return {
        next(){
            return reader.read();
        },
        return(){
            return reader.releaseLock();
        },
        [Symbol.asyncIterator](){
            return this;
        }
    } as any as AsyncIterableIterator<Uint8Array>;
}
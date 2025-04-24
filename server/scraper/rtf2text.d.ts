// Declaration file for rtf2text where default export has methods
declare module 'rtf2text' {
    // Define the callback signature
    type RtfToTextCallback = (err: Error | null, text: string) => void;

    // Define the .string function signature
    type RtfStringFunction = (input: Buffer | string, callback: RtfToTextCallback) => void;
    // Define the .stream function signature
    type RtfStreamFunction = (stream: NodeJS.ReadableStream, opts?: any, cb?: RtfToTextCallback) => void;

    // Define the default export signature (likely the stream function)
    interface RtfDefaultFunction {
        (opts?: any, cb?: RtfToTextCallback): any; // The function call signature
        string: RtfStringFunction; // It also has a .string property
        stream: RtfStreamFunction; // It also has a .stream property
    }

    // Define and export the default function
    const rtfToTextDefault: RtfDefaultFunction;
    export default rtfToTextDefault;
} 
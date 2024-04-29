import formidable from 'formidable';
import { Request } from 'express';
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';

let customEmitter = new EventEmitter();

const streamHandler = (file: any) => {

    let dataStream = new PassThrough();

    new Upload({
        client: new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
            },
            region: process.env.S3_REGION || ""
        }),
        params: {
            ACL: 'public-read',
            Bucket: process.env.S3_BUCKET || "",
            Key: `langchain/docs/${Date.now().toString()}.pdf`, //-${file.originalFilename}`, TO-DO: sort out names with spaces later
            Body: dataStream
        },
        tags: [], // optional tags
        queueSize: 4, // optional concurrency configuration
        partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
        leavePartsOnError: false, // optional manually handle dropped parts
    })
        .done()
        .then(data => {
            customEmitter.emit('data', { location: data.Location, key: data.Key }); // trying out NodeJS' events module
        }).catch((err) => {
            customEmitter.emit('error', err.message);
        })

    return dataStream;
};

/**
 * Uploads a file and returns the upload location and key.
 *
 * This function takes an HTTP request object (`req`) as input, containing the file data. 
 * It returns a promise that resolves to an object with two properties:
 *   - `location`: The URL or path where the file is uploaded. (string)
 *   - `key`: The unique identifier for the uploaded file within S3. (string)
 *
 * @param req The HTTP request object containing the file data.
 * @returns A promise resolving to an object with location and key.
 */

const parsefile = async (req: Request): Promise<UploadFile> => {
    try {

        return new Promise((resolve, reject) => {
            let options = {
                maxFileSize: 5 * 1024 * 1024, //5 megabytes converted to bytes,
                maxFiles: 1,
                allowEmptyFiles: false,
                fileWriteStreamHandler: streamHandler,
            }

            const form = formidable(options);

            form.parse(req, (error, fields, files) => {
                if (error) {
                    let message: string = error.message;
                    if (error.message.indexOf('options.maxFiles') !== -1) {
                        message = `Maximum number of files (1) exceeded`;
                    }
                    customEmitter.emit('error', message);
                }

                if (!Object.keys(files).length) {
                    customEmitter.emit('error', 'Please upload at least one file.');
                }

                if (files.document?.[0].mimetype !== 'application/pdf') {
                    customEmitter.emit('error', "Please upload a PDF file.");
                }
            })

            customEmitter.on('data', (data: { location: string, key: string }) => {
                resolve(data);
            })

            customEmitter.on('error', (error) => {
                reject(error)
            })
        })
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export default parsefile;

import { Request } from 'express';
import { S3Loader } from "langchain/document_loaders/web/s3";
import fileUploadHandler from "./helpers/fileparser";

const service = async (req: Request) => {

    let uploadedFile = await fileUploadHandler(req);

    const langchainS3oader = new S3Loader({
        bucket: process.env.S3_BUCKET || "",
        key: uploadedFile.key,
        s3Config: {
            region: process.env.S3_REGION || "",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        },
        unstructuredAPIURL: "http://localhost:8000/general/v0/general",
        unstructuredAPIKey: "", // this will be soon required
    });

    return langchainS3oader.load();
}

export default service;

import express, { Request, Response } from 'express';
import service from './flow';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('LangChain + Express + TypeScript Server');
});

app.post('/api/v1/upload-flow', async (req: Request, res: Response) => {
  await service(req)
  .then((doc) => {
    res.status(200).json({
      message: "Success",
      data: doc
    })
  }).catch(error => {
    res.status(400).json({
      message: error || "An error occurred.",
      data: null
    })
  })
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});


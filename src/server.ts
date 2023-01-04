import * as dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import { filterImageFromURL, deleteLocalFiles } from "./util/util";

// middleware for authentication
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const headers = req.headers;

  if (!headers || !headers.authorization) {
    return res
      .status(401)
      .send({ message: "authorization header is required" });
  }

  const token_bearer = req.headers.authorization.split(" ");
  if (token_bearer.length != 2) {
    return res
      .status(401)
      .send({ message: "authorization header is not valid" });
  }

  const token = token_bearer[1];
  if (token != process.env.SECRET_TOKEN) {
    return res.status(401).send({ message: "token is incorrect" });
  }

  next();
}

(async () => {
  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT - DONE!!! 😀
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */
  app.get(
    "/filteredimage",
    requireAuth,
    async (req: Request, res: Response) => {
      const { image_url } = req.query;

      // validates image_url
      if (!image_url) {
        return res.status(401).send({ message: "image url query is required" });
      }

      try {
        // filters image
        const filtered_path = await filterImageFromURL(image_url as string);

        // sends file response and deletes file when completed
        return res.sendFile(filtered_path, (err) => {
          if (err) {
            return res.status(500).send({ message: "could not send file" });
          } else {
            deleteLocalFiles([filtered_path]);
          }
        });
      } catch (error) {
        console.log("process error", error);
        // handle image processing error
        return res.status(422).send({ message: "could not process image" });
      }
    }
  );

  //! END @TODO1

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req, res) => {
    res.send("try GET /filteredimage?image_url={{}}");
  });

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();

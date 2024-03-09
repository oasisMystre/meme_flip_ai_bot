import ImageKit from "imagekit";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: "https://ik.imagekit.io/orgk45qhh/",
});

const authenticate = function (req: FastifyRequest, res: FastifyReply) {
  var authenticationParameters = imagekit.getAuthenticationParameters();
  res.send(authenticationParameters);
};

export const imagekitRoute = function (fastify: FastifyInstance) {
  fastify.get("/imagekit/auth/", authenticate);
};

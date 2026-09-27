import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

/**
 * Builds a weak HTTP entity tag from a JSON-serialisable value.
 *
 * A weak tag (`W/"..."`) is the correct choice for JSON representations because
 * two byte-different bodies can still be semantically identical to a client.
 *
 * @param value - Any JSON-serialisable value, normally the response body.
 * @returns A weak entity tag, for example `W/"3f9c1a..."`.
 */
export function createEntityTag(value: unknown): string {
  const digest = createHash('sha1').update(JSON.stringify(value)).digest('base64url');

  return `W/"${digest}"`;
}

/**
 * Checks whether the request's `If-None-Match` header matches a given entity tag.
 *
 * Supports the wildcard form (`*`), a comma-separated list of tags, and both
 * weak and strong comparison of the supplied tag.
 *
 * @param req - The incoming Express request.
 * @param entityTag - The entity tag generated for the current representation.
 * @returns `true` when the client already holds this representation.
 */
export function requestMatchesEntityTag(req: Request, entityTag: string): boolean {
  const header = req.headers['if-none-match'];

  if (typeof header !== 'string') {
    return false;
  }

  const candidates = header
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  if (candidates.includes('*')) {
    return true;
  }

  const strongTag = entityTag.replace(/^W\//, '');

  return candidates.some((candidate) => candidate === entityTag || candidate === strongTag);
}

/**
 * Sends a JSON response with conditional request support.
 *
 * The representation is hashed into an `ETag`. When the client's `If-None-Match`
 * header already matches, a bodyless `304 Not Modified` is returned instead, which
 * saves bandwidth while still letting the client confirm its cached copy is fresh.
 *
 * `Vary: Authorization` is always sent because the hypermedia links inside the body
 * depend on the caller's role.
 *
 * @param req - The incoming Express request, used to read `If-None-Match`.
 * @param res - The Express response to write to.
 * @param statusCode - The success status code to use when the body is sent.
 * @param body - The JSON body to serialise.
 */
export function sendConditionalJson(
  req: Request,
  res: Response,
  statusCode: number,
  body: unknown,
): void {
  const entityTag = createEntityTag(body);

  res.setHeader('ETag', entityTag);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vary', 'Authorization');

  if (requestMatchesEntityTag(req, entityTag)) {
    res.status(304).end();
    return;
  }

  res.status(statusCode).json(body);
}

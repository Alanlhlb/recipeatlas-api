import type { UserRole } from '../types/user';

/**
 * A single hypermedia control embedded in a response body.
 */
export interface HypermediaLink {
  /** The URI of the related resource or operation. */
  href: string;
  /** The HTTP method a client should use to follow this link. */
  method: string;
  /** A short human-readable description of what the link does. */
  title: string;
}

/**
 * A map of link relation names to hypermedia controls.
 */
export type HypermediaLinks = Record<string, HypermediaLink>;

/**
 * Builds the `_links` object for a single recipe resource.
 *
 * Links that require authentication are only advertised to authenticated callers,
 * and administrator operations are only advertised to administrators. This is what
 * makes the API self-describing: a client can discover the actions available to it
 * without hard-coding knowledge of the API surface.
 *
 * @param recipeId - Identifier of the recipe the links belong to.
 * @param role - Role of the authenticated caller, or `undefined` when anonymous.
 * @returns The link relations available for this recipe and caller.
 */
export function recipeLinks(recipeId: number, role?: UserRole): HypermediaLinks {
  const links: HypermediaLinks = {
    self: {
      href: `/api/recipes/${recipeId}`,
      method: 'GET',
      title: 'This recipe',
    },
    collection: {
      href: '/api/recipes',
      method: 'GET',
      title: 'The full recipe catalogue',
    },
  };

  if (role) {
    links['add-favourite'] = {
      href: `/api/favorites/${recipeId}`,
      method: 'POST',
      title: 'Save this recipe to your favourites',
    };
    links['remove-favourite'] = {
      href: `/api/favorites/${recipeId}`,
      method: 'DELETE',
      title: 'Remove this recipe from your favourites',
    };
    links['contact-administrator'] = {
      href: '/api/messages',
      method: 'POST',
      title: 'Send a message about this recipe',
    };
  }

  if (role === 'admin') {
    links.update = {
      href: `/api/admin/recipes/${recipeId}`,
      method: 'PUT',
      title: 'Replace this recipe',
    };
    links.delete = {
      href: `/api/admin/recipes/${recipeId}`,
      method: 'DELETE',
      title: 'Delete this recipe',
    };
  }

  return links;
}

/**
 * Builds the `_links` object for the recipe collection itself.
 *
 * @param originalUrl - The request URL, reused so the `self` link preserves the
 *   active query string (search, filters and sorting).
 * @param role - Role of the authenticated caller, or `undefined` when anonymous.
 * @returns The link relations available for the collection and caller.
 */
export function recipeCollectionLinks(originalUrl: string, role?: UserRole): HypermediaLinks {
  const links: HypermediaLinks = {
    self: {
      href: originalUrl,
      method: 'GET',
      title: 'This collection, including the current query string',
    },
    'external-recipes': {
      href: '/api/external-recipes?q={title}',
      method: 'GET',
      title: 'Search the external TheMealDB catalogue',
    },
  };

  if (role) {
    links.favourites = {
      href: '/api/favorites',
      method: 'GET',
      title: 'Your saved recipes',
    };
  }

  if (role === 'admin') {
    links.create = {
      href: '/api/admin/recipes',
      method: 'POST',
      title: 'Add a new recipe',
    };
    links.messages = {
      href: '/api/messages',
      method: 'GET',
      title: 'Messages sent by users',
    };
  }

  return links;
}

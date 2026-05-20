/**
 * Prepr CMS – GraphQL API integration
 * Docs: https://docs.prepr.io/development/connecting-a-front-end-framework
 *
 * Set your token in config below or via env (e.g. PREPR_ACCESS_TOKEN).
 */

import axios, { AxiosError } from 'axios';

// Replace with your Prepr access token from Prepr dashboard
const PREPR_ACCESS_TOKEN = ''; // or use process.env.PREPR_ACCESS_TOKEN if you use react-native-config

const PREPR_GRAPHQL_URL = PREPR_ACCESS_TOKEN
  ? `https://graphql.prepr.io/${PREPR_ACCESS_TOKEN}`
  : '';

export interface PreprGraphQLVariables {
  [key: string]: unknown;
}

export interface PreprGraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown[]; path?: unknown[] }>;
}

/**
 * Run a GraphQL query or mutation against Prepr CMS.
 */
export async function preprRequest<T = unknown>(
  query: string,
  variables?: PreprGraphQLVariables
): Promise<PreprGraphQLResponse<T>> {
  if (!PREPR_GRAPHQL_URL) {
    console.warn('Prepr: PREPR_ACCESS_TOKEN is not set. Add it in src/Api/prepr.ts or via env.');
    return { data: undefined, errors: [{ message: 'Prepr not configured' }] };
  }

  try {
    const { data } = await axios.post<PreprGraphQLResponse<T>>(
      PREPR_GRAPHQL_URL,
      { query, variables },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    if (data.errors?.length) {
      console.warn('Prepr GraphQL errors:', data.errors);
      return { data: data.data, errors: data.errors };
    }

    return { data: data.data, errors: undefined };
  } catch (err) {
    const axiosError = err as AxiosError<PreprGraphQLResponse>;
    const message = axiosError.response?.data?.errors?.[0]?.message
      ?? axiosError.message
      ?? 'Prepr request failed';
    console.error('Prepr request error:', message);
    return { data: undefined, errors: [{ message }] };
  }
}

/**
 * Example: fetch a single Prepr content item by slug (adjust query to your Prepr model).
 * In Prepr you might have a model "Page" with slug. Customize the query to match your schema.
 */
export async function getPreprPageBySlug(slug: string) {
  const query = `
    query GetPage($slug: String!) {
      Page(slug: $slug) {
        _id
        title
        slug
        content
        image {
          _id
          url
        }
      }
    }
  `;
  const result = await preprRequest<{ Page: unknown }>(query, { slug });
  return result.data?.Page ?? null;
}

/**
 * Example: fetch multiple items (e.g. list of articles). Adjust query to your Prepr model.
 */
export async function getPreprArticles(limit = 10) {
  const query = `
    query GetArticles($limit: Int!) {
      Articles(limit: $limit) {
        items {
          _id
          title
          slug
          excerpt
          image {
            _id
            url
          }
        }
      }
    }
  `;
  const result = await preprRequest<{ Articles: { items: unknown[] } }>(query, { limit });
  return result.data?.Articles?.items ?? [];
}

export { PREPR_ACCESS_TOKEN, PREPR_GRAPHQL_URL };

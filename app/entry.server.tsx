import shopify from '@/lib/shopify.service';
import { EntryContext } from '@remix-run/node';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  shopify.addDocumentResponseHeaders(request, responseHeaders);

  // ..etc
}
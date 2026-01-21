// MODIFIED FROM https://developers.cloudflare.com/workers/examples/cors-header-proxy/
// NO OTHER COMMENTS ARE MY OWN

const FAVICON = "iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgBAMAAACP+qOmAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAABVQTFRF////5+fnzc3NAAAA8/PzR+L/2traO7U3vgAAAkxJREFUeJzt3VsNAkEQRFEsYAELWMACFvAvAQdF0p3KDsm5v5t5nPnv7O226B7Lax+xzc6btcDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMC556JXrHcuMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw8AacP+et37HNS2/O/fHQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBHca/Mrx8suvQkYGBgYGPiggIGBgYGBDwoYGBgYGPiggIGBgYGBDwoYGBgYGPiggIGBgYGBDwoYGBgYGPiggIGBgYGBDwoY+BJw7+A8MJnLjwUMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzcA28u/Yn1wHktMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwcA+8eY7eoGYeEAUGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgbugfOlN6RcHrZckXLAwMDAk4CBSwEDAwNPAgYuBQwMDDwJGLgUMDAw8CRg4FLAwMDAk4CBSwEDAwNPAgYuBQwMDDwJGLgUMDAw8CRg4FLAwP8G/gIqlwmoMoA/7AAAAABJRU5ErkJggg=="

export default {
	async fetch(request): Promise<Response> {
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Max-Age": "86400",
		};

		const API_URL = "http://gtfs.ltconline.ca/Vehicle/VehiclePositions.json";

		// The rest of this snippet for the demo page
		function rawHtmlResponse(html) {
			return new Response(html, {
				headers: {
					"content-type": "text/html;charset=UTF-8",
				},
			});
		}

		async function handleRequest(request) {
			const url = new URL(request.url);
			
			if (url.pathname === "/favicon.ico") {
		      const bytes = Uint8Array.from(atob(FAVICON_B64), c => c.charCodeAt(0));
		      return new Response(bytes, {
		        headers: {
		          "Content-Type": "image/x-icon",
		          "Cache-Control": "public, max-age=604800" // Cache for 1 week
		        },
		      });
		    }
			
			// Rewrite request to point to API URL. This also makes the request mutable
			// so you can add the correct Origin header to make the API server think
			// that this request is not cross-site.
			request = new Request(API_URL, request);
			request.headers.set("Origin", new URL(API_URL).origin);
			let response = await fetch(request);
			// Recreate the response so you can modify the headers

			response = new Response(response.body, response);
			// Set CORS headers

			response.headers.set("Access-Control-Allow-Origin", "*");

			// Append to/Add Vary header so browser will cache response correctly
			response.headers.append("Vary", "Origin");

			return response;
		}

		async function handleOptions(request) {
			if (
				request.headers.get("Origin") !== null &&
				request.headers.get("Access-Control-Request-Method") !== null &&
				request.headers.get("Access-Control-Request-Headers") !== null
			) {
				// Handle CORS preflight requests.
				return new Response(null, {
					headers: {
						...corsHeaders,
						"Access-Control-Allow-Headers": request.headers.get(
							"Access-Control-Request-Headers",
						),
					},
				});
			} else {
				// Handle standard OPTIONS request.
				return new Response(null, {
					headers: {
						Allow: "GET, HEAD, POST, OPTIONS",
					},
				});
			}
		}

		const url = new URL(request.url);
		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			return handleOptions(request);
		} else if (
			request.method === "GET" ||
			request.method === "HEAD" ||
			request.method === "POST"
		) {
			// Handle requests to the API server
			return handleRequest(request);
		} else {
			return new Response(null, {
				status: 405,
				statusText: "Method Not Allowed",
			});
		}
	},
} satisfies ExportedHandler;

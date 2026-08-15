import * as http from 'node:http';
import * as https from 'node:https';

export interface TransportRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
}

export interface TransportResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

export interface Transport {
    request(request: TransportRequest): Promise<TransportResponse>;
}

/**
 * A zero-dependency transport built on Node's built-in `http`/`https` modules.
 */
export class NodeTransport implements Transport {
    request(request: TransportRequest): Promise<TransportResponse> {
        return new Promise((resolve, reject) => {
            const url = new URL(request.url);
            const module = url.protocol === 'https:' ? https : http;
            const requestOptions: http.RequestOptions = {
                method: request.method,
                headers: request.headers,
                timeout: request.timeoutMs,
            };

            const httpRequest = module.request(url, requestOptions, (response) => {
                let data = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    resolve({
                        status: response.statusCode ?? 0,
                        headers: normalizedHeaders(response.headers),
                        body: data,
                    });
                });
            });

            httpRequest.on('timeout', () => {
                httpRequest.destroy(new Error('Variza API request timed out.'));
            });

            httpRequest.on('error', reject);

            if (request.body !== undefined) {
                httpRequest.write(request.body);
            }

            httpRequest.end();
        });
    }
}

function normalizedHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            result[key] = String(value);
        }
    }

    return result;
}
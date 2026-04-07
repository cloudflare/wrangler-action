export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return new Response("Hello from Cloudflare Workers!");
	},
} satisfies ExportedHandler<Env>;

interface Env {
	// Add your bindings here, e.g.:
	// MY_KV: KVNamespace;
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	// MY_VAR: string;
}

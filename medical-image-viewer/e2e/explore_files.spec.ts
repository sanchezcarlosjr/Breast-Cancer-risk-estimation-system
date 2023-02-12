import { test, expect, request } from '@playwright/test'

test('should call API', async ({ page }) => {
	const context = await request.newContext({
		baseURL: 'http://localhost:3001/api/'
	});
	const response = await context.fetch('images?path=1.1/1').then((x) => x.json());
	console.log(response);
})

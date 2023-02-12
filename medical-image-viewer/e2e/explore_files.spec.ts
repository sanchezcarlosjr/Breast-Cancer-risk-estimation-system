import { test, expect, request } from '@playwright/test'

test('should list images from SFTP server', async ({ page }) => {
	const context = await request.newContext({
		baseURL: 'http://localhost:3001/api/'
	});
	const images = await context.fetch('images?path=1.1').then(response => response.json()).then(files =>  files.map(file => file.local_location));
	expect(images.length).toEqual(9);
	expect(images).not.toContain(undefined);
})

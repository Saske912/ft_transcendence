import { Controller, Get, Param, Res } from '@nestjs/common';

@Controller('images')
export class ImagesController {

	@Get(':filename')
	getImage(@Param('filename') filename: string, @Res() res: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		res.sendFile(filename, { root: '/uploads' });
	}

}
